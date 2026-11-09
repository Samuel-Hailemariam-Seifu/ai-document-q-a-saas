from __future__ import annotations

import pytest
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.user import User
from app.models.workspace import Workspace
from app.services import embeddings_service
from app.services.embeddings_service import EmbeddingModelMismatchError
from app.services.retrieval_service import (
    assert_workspace_embedding_compatible,
    hybrid_top_k,
    keyword_top_n,
    top_k_chunks_for_workspace,
)


def _user_ws(db: Session, email: str, ws_name: str) -> tuple[User, Workspace]:
    user = User(email=email, password_hash="x", full_name="T")
    db.add(user)
    db.flush()
    ws = Workspace(owner_id=user.id, name=ws_name)
    db.add(ws)
    db.flush()
    return user, ws


def _add_doc_with_chunks(
    db: Session,
    *,
    workspace_id: int,
    name: str,
    chunks: list[str],
    model: str = "BAAI/bge-small-en-v1.5",
) -> Document:
    doc = Document(
        workspace_id=workspace_id,
        filename=name,
        original_name=name,
        file_path=f"{workspace_id}/{name}",
        mime_type="text/plain",
        file_size=10,
        status="ready",
        chunk_count=len(chunks),
        embedding_model=model,
    )
    db.add(doc)
    db.flush()
    embeddings = embeddings_service.embed_texts(chunks)
    for i, (content, emb) in enumerate(zip(chunks, embeddings, strict=True)):
        db.add(
            DocumentChunk(
                document_id=doc.id,
                chunk_index=i,
                page_number=1,
                content=content,
                embedding=emb,
                embedding_vec=emb,
            )
        )
    db.flush()
    return doc


def test_vector_search_paraphrase(db: Session):
    _, ws = _user_ws(db, "a@example.com", "W1")
    _add_doc_with_chunks(
        db,
        workspace_id=ws.id,
        name="refund.txt",
        chunks=[
            "Customers may request a refund within fourteen days of purchase.",
            "Onboarding guide for new accounts and workspace setup.",
        ],
    )
    # Shares lexical signal with the refund chunk under the deterministic test embedder.
    q = "Can customers request a refund within fourteen days of purchase?"
    q_emb = embeddings_service.embed_texts([q])[0]
    hits = top_k_chunks_for_workspace(
        db, workspace_id=ws.id, query_embedding=q_emb, k=1
    )
    assert hits
    assert "refund" in hits[0][0].content.lower()


def test_keyword_search_exact_code(db: Session):
    _, ws = _user_ws(db, "b@example.com", "W2")
    _add_doc_with_chunks(
        db,
        workspace_id=ws.id,
        name="sku.txt",
        chunks=[
            "Inventory item SKU-ACME-REFUND-14 is discontinued.",
            "General introduction to the company handbook.",
        ],
    )
    hits = keyword_top_n(
        db,
        workspace_id=ws.id,
        query="SKU-ACME-REFUND-14",
        n=3,
        backend="postgres",
    )
    assert hits
    assert "SKU-ACME-REFUND-14" in hits[0][0].content


def test_hybrid_includes_vector_and_keyword_signals(db: Session):
    _, ws = _user_ws(db, "c@example.com", "W3")
    _add_doc_with_chunks(
        db,
        workspace_id=ws.id,
        name="mixed.txt",
        chunks=[
            "The warranty covers manufacturing defects for two years.",
            "Part number ZX-4401-BETA must be quoted on all RMA forms.",
            "Cafeteria hours are posted near the lobby.",
        ],
    )
    q = "What is ZX-4401-BETA used for when returning products?"
    q_emb = embeddings_service.embed_texts([q])[0]
    hits = hybrid_top_k(
        db,
        workspace_id=ws.id,
        query=q,
        query_embedding=q_emb,
        k=3,
    )
    contents = " ".join(c.content for c, _, _ in hits)
    assert "ZX-4401-BETA" in contents


def test_workspace_isolation(db: Session):
    _, ws_a = _user_ws(db, "d@example.com", "A")
    _, ws_b = _user_ws(db, "e@example.com", "B")
    _add_doc_with_chunks(
        db,
        workspace_id=ws_a.id,
        name="secret.txt",
        chunks=["Top secret project codename NEBULA-9 lives only in workspace A."],
    )
    _add_doc_with_chunks(
        db,
        workspace_id=ws_b.id,
        name="other.txt",
        chunks=["Public brochure about office plants and coffee."],
    )
    q = "NEBULA-9"
    q_emb = embeddings_service.embed_texts([q])[0]
    hits = hybrid_top_k(
        db,
        workspace_id=ws_b.id,
        query=q,
        query_embedding=q_emb,
        k=5,
    )
    for chunk, _, _ in hits:
        assert "NEBULA-9" not in chunk.content


def test_document_ids_filter(db: Session):
    _, ws = _user_ws(db, "f@example.com", "W4")
    doc_keep = _add_doc_with_chunks(
        db,
        workspace_id=ws.id,
        name="keep.txt",
        chunks=["Alpha protocol ALPHA-100 is documented here."],
    )
    _add_doc_with_chunks(
        db,
        workspace_id=ws.id,
        name="skip.txt",
        chunks=["Alpha protocol ALPHA-100 also appears in the skipped document."],
    )
    q = "ALPHA-100"
    q_emb = embeddings_service.embed_texts([q])[0]
    hits = hybrid_top_k(
        db,
        workspace_id=ws.id,
        query=q,
        query_embedding=q_emb,
        k=5,
        document_ids=[doc_keep.id],
    )
    assert hits
    assert all(c.document_id == doc_keep.id for c, _, _ in hits)


def test_mixed_embedding_models_rejected(db: Session):
    _, ws = _user_ws(db, "g@example.com", "W5")
    _add_doc_with_chunks(
        db,
        workspace_id=ws.id,
        name="a.txt",
        chunks=["first document"],
        model="BAAI/bge-small-en-v1.5",
    )
    _add_doc_with_chunks(
        db,
        workspace_id=ws.id,
        name="b.txt",
        chunks=["second document"],
        model="text-embedding-3-small",
    )
    with pytest.raises(EmbeddingModelMismatchError):
        assert_workspace_embedding_compatible(db, workspace_id=ws.id)

    # Query-time mismatch: workspace model differs from configured model.
    from sqlalchemy import select

    docs = db.execute(select(Document).where(Document.workspace_id == ws.id)).scalars().all()
    for d in docs:
        d.embedding_model = "text-embedding-3-small"
    db.flush()
    with pytest.raises(EmbeddingModelMismatchError):
        assert_workspace_embedding_compatible(
            db, workspace_id=ws.id, model="BAAI/bge-small-en-v1.5"
        )
