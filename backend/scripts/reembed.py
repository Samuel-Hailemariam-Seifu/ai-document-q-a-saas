"""Re-embed all (or one) document(s) in a workspace with the currently configured model.

Usage (from backend/):
    python -m scripts.reembed --workspace-id 1
    python -m scripts.reembed --workspace-id 1 --document-id 42
"""

from __future__ import annotations

import argparse
import sys

from sqlalchemy import delete, select

from app.core.database import SessionLocal
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.services.embeddings_service import configured_embedding_model, embed_texts
from app.services.storage_service import resolve_path
from app.utils.chunking import chunk_pages
from app.utils.text_extraction import extract_text


def reembed_document(db, doc: Document, model: str) -> int:
    full_path = resolve_path(doc.file_path)
    content = full_path.read_bytes()
    pages, page_count = extract_text(doc.mime_type, content)
    chunks = chunk_pages(pages)

    db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == doc.id))
    db.flush()

    if not chunks:
        doc.status = "failed"
        doc.error_message = "No text extracted during re-embed"
        doc.chunk_count = 0
        doc.page_count = page_count
        doc.embedding_model = None
        return 0

    embeddings = embed_texts([c.content for c in chunks])
    rows = [
        DocumentChunk(
            document_id=doc.id,
            chunk_index=c.chunk_index,
            page_number=c.page_number,
            content=c.content,
            embedding=emb,
            embedding_vec=emb,
        )
        for c, emb in zip(chunks, embeddings, strict=True)
    ]
    db.add_all(rows)
    doc.page_count = page_count
    doc.chunk_count = len(rows)
    doc.embedding_model = model
    doc.status = "ready"
    doc.error_message = None
    return len(rows)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Re-embed workspace documents")
    parser.add_argument("--workspace-id", type=int, required=True)
    parser.add_argument("--document-id", type=int, default=None)
    args = parser.parse_args(argv)

    model = configured_embedding_model()
    db = SessionLocal()
    try:
        stmt = select(Document).where(Document.workspace_id == args.workspace_id)
        if args.document_id is not None:
            stmt = stmt.where(Document.id == args.document_id)
        docs = list(db.execute(stmt).scalars().all())
        if not docs:
            print("No documents found.", file=sys.stderr)
            return 1

        print(f"Re-embedding {len(docs)} document(s) with model={model!r}")
        total = 0
        for doc in docs:
            n = reembed_document(db, doc, model)
            db.commit()
            print(f"  document_id={doc.id} chunks={n} status={doc.status}")
            total += n
        print(f"Done. Total chunks written: {total}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
