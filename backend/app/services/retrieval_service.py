from __future__ import annotations

import math
import re

from rank_bm25 import BM25Okapi
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.pgvector_runtime import get_pgvector_info
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.services.embeddings_service import (
    EmbeddingModelMismatchError,
    configured_embedding_model,
)


# ---------------------------------------------------------------------------
# Low-level math (legacy Python vector path)
# ---------------------------------------------------------------------------

def _dot(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b, strict=False))


def _norm(a: list[float]) -> float:
    return math.sqrt(sum(x * x for x in a))


def cosine_similarity(a: list[float], b: list[float]) -> float:
    na = _norm(a)
    nb = _norm(b)
    if na == 0.0 or nb == 0.0:
        return 0.0
    return _dot(a, b) / (na * nb)


def _tokenize(text: str) -> list[str]:
    """Simple whitespace + punctuation tokenizer for BM25."""
    return re.findall(r"\w+", text.lower())


def _tsquery_or_terms(query: str) -> str | None:
    """
    Build an english to_tsquery string with OR between lexemes.
    plainto_tsquery uses AND; OR keeps partial / single-term hits rankable.
    """
    tokens = _tokenize(query)
    if not tokens:
        return None
    # Strip tsquery operators / quotes from tokens; keep alphanumerics + underscore.
    safe = [re.sub(r"[^\w]", "", t) for t in tokens]
    safe = [t for t in safe if t]
    if not safe:
        return None
    return " | ".join(safe)


# ---------------------------------------------------------------------------
# Workspace embedding-model policy
# ---------------------------------------------------------------------------

def workspace_embedding_models(
    db: Session,
    *,
    workspace_id: int,
) -> list[str]:
    rows = db.execute(
        select(Document.embedding_model)
        .where(
            Document.workspace_id == workspace_id,
            Document.status == "ready",
            Document.embedding_model.is_not(None),
        )
        .distinct()
    ).scalars().all()
    return sorted({m for m in rows if m})


def assert_workspace_embedding_compatible(
    db: Session,
    *,
    workspace_id: int,
    model: str | None = None,
) -> str | None:
    """
    Enforce one embedding model per workspace.
    Returns the workspace model (if any). Raises on conflict with `model` or mixed docs.
    """
    existing = workspace_embedding_models(db, workspace_id=workspace_id)
    if len(existing) > 1:
        raise EmbeddingModelMismatchError(
            f"Workspace {workspace_id} has mixed embedding models {existing}. "
            f"Re-embed the workspace to a single model before querying or ingesting."
        )
    active = model if model is not None else configured_embedding_model()
    if existing and existing[0] != active:
        raise EmbeddingModelMismatchError(
            f"Workspace {workspace_id} was embedded with {existing[0]!r}, but the "
            f"configured model is {active!r}. Re-embed the workspace or restore the "
            f"original model/API key configuration."
        )
    return existing[0] if existing else None


# ---------------------------------------------------------------------------
# Chunk fetching (legacy / BM25 path)
# ---------------------------------------------------------------------------

def _fetch_chunks(
    db: Session,
    *,
    workspace_id: int,
    document_ids: list[int] | None = None,
) -> list[tuple[DocumentChunk, str]]:
    """
    Returns all ready chunks for the workspace as (chunk, original_name).
    Optionally filtered by document_ids.
    """
    stmt = (
        select(DocumentChunk, Document.original_name)
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(Document.workspace_id == workspace_id, Document.status == "ready")
    )
    if document_ids:
        stmt = stmt.where(Document.id.in_(document_ids))
    return list(db.execute(stmt).all())


def _base_chunk_filters(
    *,
    workspace_id: int,
    document_ids: list[int] | None,
) -> tuple[str, dict]:
    clauses = ["d.workspace_id = :workspace_id", "d.status = 'ready'"]
    params: dict = {"workspace_id": workspace_id}
    if document_ids:
        clauses.append("d.id = ANY(:document_ids)")
        params["document_ids"] = document_ids
    return " AND ".join(clauses), params


# ---------------------------------------------------------------------------
# Vector-only retrieval
# ---------------------------------------------------------------------------

def top_k_chunks_for_workspace(
    db: Session,
    *,
    workspace_id: int,
    query_embedding: list[float],
    k: int = 6,
    document_ids: list[int] | None = None,
) -> list[tuple[DocumentChunk, float, str]]:
    """pgvector cosine distance search (filtered to workspace / ready / document_ids)."""
    assert_workspace_embedding_compatible(db, workspace_id=workspace_id)
    return _vector_top_n(
        db,
        workspace_id=workspace_id,
        query_embedding=query_embedding,
        n=k,
        document_ids=document_ids,
    )


def top_k_chunks_for_workspace_legacy(
    db: Session,
    *,
    workspace_id: int,
    query_embedding: list[float],
    k: int = 6,
    document_ids: list[int] | None = None,
) -> list[tuple[DocumentChunk, float, str]]:
    """Full-scan Python cosine over legacy ARRAY embeddings (comparison / fallback)."""
    rows = _fetch_chunks(db, workspace_id=workspace_id, document_ids=document_ids)

    scored: list[tuple[DocumentChunk, float, str]] = []
    for chunk, doc_name in rows:
        emb = chunk.embedding or []
        score = cosine_similarity(query_embedding, emb)
        scored.append((chunk, score, doc_name))

    scored.sort(key=lambda t: t[1], reverse=True)
    return scored[:k]


def _apply_hnsw_session_settings(db: Session, *, limit: int) -> None:
    """SET LOCAL must run in the same transaction as the vector ORDER BY query."""
    info = get_pgvector_info()
    ef = max(int(settings.hnsw_ef_search), int(limit))
    db.execute(text("SET LOCAL hnsw.ef_search = :ef"), {"ef": ef})
    if info is not None and info.supports_iterative_scan:
        db.execute(text("SET LOCAL hnsw.iterative_scan = 'relaxed_order'"))


def _vector_top_n(
    db: Session,
    *,
    workspace_id: int,
    query_embedding: list[float],
    n: int,
    document_ids: list[int] | None = None,
) -> list[tuple[DocumentChunk, float, str]]:
    if n <= 0:
        return []

    info = get_pgvector_info()
    fetch_n = n
    if info is not None and not info.supports_iterative_scan:
        fetch_n = n * max(1, int(settings.hnsw_overfetch_factor))

    where_sql, params = _base_chunk_filters(
        workspace_id=workspace_id, document_ids=document_ids
    )
    params = {
        **params,
        "qvec": str(query_embedding),
        "lim": fetch_n,
    }

    _apply_hnsw_session_settings(db, limit=fetch_n)

    sql = text(
        f"""
        SELECT c.id AS chunk_id,
               (c.embedding_vec <=> CAST(:qvec AS vector)) AS distance,
               d.original_name AS original_name
        FROM document_chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE {where_sql}
          AND c.embedding_vec IS NOT NULL
        ORDER BY c.embedding_vec <=> CAST(:qvec AS vector)
        LIMIT :lim
        """
    )
    rows = db.execute(sql, params).all()
    if not rows:
        return []

    # Re-sort by distance and truncate after over-fetch.
    rows = sorted(rows, key=lambda r: float(r.distance))[:n]
    chunk_ids = [int(r.chunk_id) for r in rows]
    chunks = {
        c.id: c
        for c in db.execute(select(DocumentChunk).where(DocumentChunk.id.in_(chunk_ids)))
        .scalars()
        .all()
    }
    out: list[tuple[DocumentChunk, float, str]] = []
    for r in rows:
        chunk = chunks.get(int(r.chunk_id))
        if chunk is None:
            continue
        distance = float(r.distance)
        score = 1.0 - distance  # cosine distance → similarity-ish for callers
        out.append((chunk, score, str(r.original_name)))
    return out


# ---------------------------------------------------------------------------
# Keyword retrieval
# ---------------------------------------------------------------------------

def _keyword_top_n_postgres(
    db: Session,
    *,
    workspace_id: int,
    query: str,
    n: int,
    document_ids: list[int] | None = None,
) -> list[tuple[DocumentChunk, float, str]]:
    tsquery = _tsquery_or_terms(query)
    if not tsquery or n <= 0:
        return []

    where_sql, params = _base_chunk_filters(
        workspace_id=workspace_id, document_ids=document_ids
    )
    params = {**params, "tsq": tsquery, "lim": n}

    sql = text(
        f"""
        SELECT c.id AS chunk_id,
               ts_rank_cd(c.content_tsv, to_tsquery('english', :tsq)) AS rank,
               d.original_name AS original_name
        FROM document_chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE {where_sql}
          AND c.content_tsv @@ to_tsquery('english', :tsq)
        ORDER BY rank DESC
        LIMIT :lim
        """
    )
    rows = db.execute(sql, params).all()
    if not rows:
        return []

    chunk_ids = [int(r.chunk_id) for r in rows]
    chunks = {
        c.id: c
        for c in db.execute(select(DocumentChunk).where(DocumentChunk.id.in_(chunk_ids)))
        .scalars()
        .all()
    }
    out: list[tuple[DocumentChunk, float, str]] = []
    for r in rows:
        chunk = chunks.get(int(r.chunk_id))
        if chunk is None:
            continue
        out.append((chunk, float(r.rank), str(r.original_name)))
    return out


def _keyword_top_n_bm25(
    db: Session,
    *,
    workspace_id: int,
    query: str,
    n: int,
    document_ids: list[int] | None = None,
) -> list[tuple[DocumentChunk, float, str]]:
    rows = _fetch_chunks(db, workspace_id=workspace_id, document_ids=document_ids)
    if not rows or n <= 0:
        return []

    chunks = [chunk for chunk, _ in rows]
    doc_names = [doc_name for _, doc_name in rows]
    query_tokens = _tokenize(query)
    corpus = [_tokenize(chunk.content or "") for chunk in chunks]
    if not query_tokens or not any(corpus):
        return []

    bm25 = BM25Okapi(corpus)
    scores = bm25.get_scores(query_tokens)
    order = sorted(range(len(chunks)), key=lambda i: scores[i], reverse=True)[:n]
    return [(chunks[i], float(scores[i]), doc_names[i]) for i in order]


def keyword_top_n(
    db: Session,
    *,
    workspace_id: int,
    query: str,
    n: int,
    document_ids: list[int] | None = None,
    backend: str | None = None,
) -> list[tuple[DocumentChunk, float, str]]:
    b = (backend or settings.keyword_backend or "postgres").lower()
    if b == "bm25":
        return _keyword_top_n_bm25(
            db,
            workspace_id=workspace_id,
            query=query,
            n=n,
            document_ids=document_ids,
        )
    return _keyword_top_n_postgres(
        db,
        workspace_id=workspace_id,
        query=query,
        n=n,
        document_ids=document_ids,
    )


# ---------------------------------------------------------------------------
# Hybrid retrieval — vector + keyword fused with Reciprocal Rank Fusion (RRF)
# ---------------------------------------------------------------------------

def _rrf_fuse(
    vector_hits: list[tuple[DocumentChunk, float, str]],
    keyword_hits: list[tuple[DocumentChunk, float, str]],
    *,
    k: int,
    rrf_k: int,
) -> list[tuple[DocumentChunk, float, str]]:
    """Fuse two ranked candidate lists only (not the full corpus)."""
    by_id: dict[int, tuple[DocumentChunk, str]] = {}
    vector_rank: dict[int, int] = {}
    keyword_rank: dict[int, int] = {}

    for rank, (chunk, _score, name) in enumerate(vector_hits):
        by_id[chunk.id] = (chunk, name)
        vector_rank[chunk.id] = rank
    for rank, (chunk, _score, name) in enumerate(keyword_hits):
        by_id[chunk.id] = (chunk, name)
        keyword_rank[chunk.id] = rank

    if not by_id:
        return []

    # Missing list → contribute nothing (omit that term), matching "candidate lists only".
    scored: list[tuple[int, float]] = []
    for cid in by_id:
        rrf = 0.0
        if cid in vector_rank:
            rrf += 1.0 / (rrf_k + vector_rank[cid])
        if cid in keyword_rank:
            rrf += 1.0 / (rrf_k + keyword_rank[cid])
        scored.append((cid, rrf))

    scored.sort(key=lambda t: t[1], reverse=True)
    out: list[tuple[DocumentChunk, float, str]] = []
    for cid, score in scored[:k]:
        chunk, name = by_id[cid]
        out.append((chunk, score, name))
    return out


def hybrid_top_k(
    db: Session,
    *,
    workspace_id: int,
    query: str,
    query_embedding: list[float],
    k: int = 6,
    document_ids: list[int] | None = None,
    rrf_k: int = 60,
) -> list[tuple[DocumentChunk, float, str]]:
    """
    Vector (pgvector) + keyword top-N, fused with RRF over the two candidate lists.
    """
    assert_workspace_embedding_compatible(db, workspace_id=workspace_id)
    n = settings.retrieval_candidate_n

    vector_hits = _vector_top_n(
        db,
        workspace_id=workspace_id,
        query_embedding=query_embedding,
        n=n,
        document_ids=document_ids,
    )
    keyword_hits = keyword_top_n(
        db,
        workspace_id=workspace_id,
        query=query,
        n=n,
        document_ids=document_ids,
    )
    return _rrf_fuse(vector_hits, keyword_hits, k=k, rrf_k=rrf_k)


def hybrid_top_k_legacy(
    db: Session,
    *,
    workspace_id: int,
    query: str,
    query_embedding: list[float],
    k: int = 6,
    document_ids: list[int] | None = None,
    rrf_k: int = 60,
) -> list[tuple[DocumentChunk, float, str]]:
    """
    Original full-workspace scan: Python cosine + BM25Okapi over all ready chunks.
    Kept for old-vs-new comparison scripts.
    """
    rows = _fetch_chunks(db, workspace_id=workspace_id, document_ids=document_ids)
    if not rows:
        return []

    chunks = [chunk for chunk, _ in rows]
    doc_names = [doc_name for _, doc_name in rows]

    vector_scored: list[tuple[int, float]] = []
    for i, chunk in enumerate(chunks):
        emb = chunk.embedding or []
        score = cosine_similarity(query_embedding, emb)
        vector_scored.append((i, score))
    vector_scored.sort(key=lambda t: t[1], reverse=True)
    vector_rank: dict[int, int] = {idx: rank for rank, (idx, _) in enumerate(vector_scored)}

    query_tokens = _tokenize(query)
    corpus = [_tokenize(chunk.content or "") for chunk in chunks]

    bm25_rank: dict[int, int] = {}
    if query_tokens and any(corpus):
        bm25 = BM25Okapi(corpus)
        bm25_scores = bm25.get_scores(query_tokens)
        bm25_order = sorted(range(len(chunks)), key=lambda i: bm25_scores[i], reverse=True)
        bm25_rank = {idx: rank for rank, idx in enumerate(bm25_order)}
    else:
        bm25_rank = {i: len(chunks) for i in range(len(chunks))}

    rrf_scores: list[tuple[int, float]] = []
    for i in range(len(chunks)):
        vr = vector_rank.get(i, len(chunks))
        br = bm25_rank.get(i, len(chunks))
        rrf = 1.0 / (rrf_k + vr) + 1.0 / (rrf_k + br)
        rrf_scores.append((i, rrf))

    rrf_scores.sort(key=lambda t: t[1], reverse=True)
    top = rrf_scores[:k]
    return [(chunks[i], score, doc_names[i]) for i, score in top]


# ---------------------------------------------------------------------------
# Neighbor expansion
# ---------------------------------------------------------------------------

def expand_with_neighbors(
    db: Session,
    *,
    seed_chunks: list[DocumentChunk],
    window: int | None = None,
) -> list[DocumentChunk]:
    """Include +/- N chunks by chunk_index for each seed chunk."""
    if not seed_chunks:
        return []
    w = settings.retrieval_neighbor_window if window is None else window
    w = max(0, int(w))
    if w == 0:
        seen: set[int] = set()
        out: list[DocumentChunk] = []
        for c in seed_chunks:
            if c.id not in seen:
                seen.add(c.id)
                out.append(c)
        return out

    doc_to_indices: dict[int, set[int]] = {}
    for c in seed_chunks:
        idxs = doc_to_indices.setdefault(c.document_id, set())
        for i in range(c.chunk_index - w, c.chunk_index + w + 1):
            if i >= 0:
                idxs.add(i)

    expanded: list[DocumentChunk] = []
    for doc_id, idxs in doc_to_indices.items():
        rows = db.execute(
            select(DocumentChunk)
            .where(DocumentChunk.document_id == doc_id, DocumentChunk.chunk_index.in_(sorted(idxs)))
            .order_by(DocumentChunk.chunk_index)
        ).scalars().all()
        expanded.extend(list(rows))

    seen2: set[int] = set()
    out2: list[DocumentChunk] = []
    for c in expanded:
        if c.id not in seen2:
            seen2.add(c.id)
            out2.append(c)
    return out2


# ---------------------------------------------------------------------------
# Summary path helper
# ---------------------------------------------------------------------------

def first_chunks_for_documents(
    db: Session,
    *,
    document_ids: list[int],
    per_document: int = 4,
) -> list[DocumentChunk]:
    """Return the first N chunks (by chunk_index) for each document id."""
    if not document_ids:
        return []
    n = max(1, min(12, int(per_document)))
    out: list[DocumentChunk] = []
    for doc_id in document_ids:
        rows = (
            db.execute(
                select(DocumentChunk)
                .where(DocumentChunk.document_id == doc_id)
                .order_by(DocumentChunk.chunk_index)
                .limit(n)
            )
            .scalars()
            .all()
        )
        out.extend(list(rows))
    return out
