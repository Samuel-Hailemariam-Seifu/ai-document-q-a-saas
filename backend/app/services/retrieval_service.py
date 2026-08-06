from __future__ import annotations

import math
import re

from rank_bm25 import BM25Okapi
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.document_chunk import DocumentChunk


# ---------------------------------------------------------------------------
# Low-level math
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


# ---------------------------------------------------------------------------
# Chunk fetching
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
    return db.execute(stmt).all()


# ---------------------------------------------------------------------------
# Vector-only retrieval (kept for backward compat / testing)
# ---------------------------------------------------------------------------

def top_k_chunks_for_workspace(
    db: Session,
    *,
    workspace_id: int,
    query_embedding: list[float],
    k: int = 6,
    document_ids: list[int] | None = None,
) -> list[tuple[DocumentChunk, float, str]]:
    """
    Returns [(chunk, cosine_score, document_original_name)] sorted by score desc.
    Full table scan — no ANN index (pgvector upgrade path preserved).
    """
    rows = _fetch_chunks(db, workspace_id=workspace_id, document_ids=document_ids)

    scored: list[tuple[DocumentChunk, float, str]] = []
    for chunk, doc_name in rows:
        emb = chunk.embedding or []
        score = cosine_similarity(query_embedding, emb)
        scored.append((chunk, score, doc_name))

    scored.sort(key=lambda t: t[1], reverse=True)
    return scored[:k]


# ---------------------------------------------------------------------------
# Hybrid retrieval — vector + BM25 fused with Reciprocal Rank Fusion (RRF)
# ---------------------------------------------------------------------------

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
    Combines vector similarity and BM25 keyword search via Reciprocal Rank
    Fusion (RRF). Returns [(chunk, rrf_score, document_original_name)].

    RRF score = 1/(rrf_k + vector_rank) + 1/(rrf_k + bm25_rank)
    rrf_k=60 is the standard default — no tuning needed.

    Falls back gracefully: if all embeddings are missing, only BM25 ranks;
    if the query tokenizes to nothing, only vector ranks.
    """
    rows = _fetch_chunks(db, workspace_id=workspace_id, document_ids=document_ids)
    if not rows:
        return []

    chunks = [chunk for chunk, _ in rows]
    doc_names = [doc_name for _, doc_name in rows]

    # --- Vector ranking ---
    vector_scored: list[tuple[int, float]] = []  # (index, score)
    for i, chunk in enumerate(chunks):
        emb = chunk.embedding or []
        score = cosine_similarity(query_embedding, emb)
        vector_scored.append((i, score))
    vector_scored.sort(key=lambda t: t[1], reverse=True)
    vector_rank: dict[int, int] = {idx: rank for rank, (idx, _) in enumerate(vector_scored)}

    # --- BM25 ranking ---
    query_tokens = _tokenize(query)
    corpus = [_tokenize(chunk.content or "") for chunk in chunks]

    bm25_rank: dict[int, int] = {}
    if query_tokens and any(corpus):
        bm25 = BM25Okapi(corpus)
        bm25_scores = bm25.get_scores(query_tokens)
        bm25_order = sorted(range(len(chunks)), key=lambda i: bm25_scores[i], reverse=True)
        bm25_rank = {idx: rank for rank, idx in enumerate(bm25_order)}
    else:
        # No keyword signal — rank all equally last so only vector contributes
        bm25_rank = {i: len(chunks) for i in range(len(chunks))}

    # --- RRF fusion ---
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
        # keep stable order and unique by id
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

    # unique while preserving order
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
