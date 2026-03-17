from __future__ import annotations

import math

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.document_chunk import DocumentChunk


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


def top_k_chunks_for_workspace(
    db: Session, *, workspace_id: int, query_embedding: list[float], k: int = 6
) -> list[tuple[DocumentChunk, float, str]]:
    """
    Returns [(chunk, score, document_original_name)] for documents in workspace.
    In MVP (no pgvector), compute similarity in Python.
    """
    rows = db.execute(
        select(DocumentChunk, Document.original_name)
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(Document.workspace_id == workspace_id, Document.status == "ready")
    ).all()

    scored: list[tuple[DocumentChunk, float, str]] = []
    for chunk, doc_name in rows:
        emb = chunk.embedding or []
        score = cosine_similarity(query_embedding, emb)
        scored.append((chunk, score, doc_name))

    scored.sort(key=lambda t: t[1], reverse=True)
    return scored[:k]


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

