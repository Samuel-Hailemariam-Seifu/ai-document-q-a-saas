from __future__ import annotations

import math

from sqlalchemy import select
from sqlalchemy.orm import Session

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

