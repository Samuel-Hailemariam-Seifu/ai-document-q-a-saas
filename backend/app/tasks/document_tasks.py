from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.services.embeddings_service import embed_texts
from app.services.storage_service import resolve_path
from app.tasks.celery_app import celery_app
from app.utils.chunking import chunk_pages
from app.utils.text_extraction import extract_text


@celery_app.task(name="ingest_document")
def ingest_document(document_id: int) -> None:
    db: Session = SessionLocal()
    try:
        doc = db.get(Document, document_id)
        if not doc:
            return

        doc.status = "processing"
        doc.error_message = None
        doc.processing_started_at = datetime.now(timezone.utc)
        doc.processing_finished_at = None
        db.commit()

        full_path = resolve_path(doc.file_path)
        content = full_path.read_bytes()

        pages, page_count = extract_text(doc.mime_type, content)
        chunks = chunk_pages(pages)

        # wipe old chunks (re-ingest)
        db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == doc.id))
        db.commit()

        if not chunks:
            doc.status = "failed"
            doc.error_message = "No text extracted"
            doc.page_count = page_count
            doc.chunk_count = 0
            doc.processing_finished_at = datetime.now(timezone.utc)
            db.commit()
            return

        embeddings = embed_texts([c.content for c in chunks])

        rows = [
            DocumentChunk(
                document_id=doc.id,
                chunk_index=c.chunk_index,
                page_number=c.page_number,
                content=c.content,
                embedding=emb,
            )
            for c, emb in zip(chunks, embeddings, strict=True)
        ]
        db.add_all(rows)
        doc.page_count = page_count
        doc.chunk_count = len(rows)
        doc.status = "ready"
        doc.processing_finished_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as e:  # noqa: BLE001
        db.close()
        fail_db: Session = SessionLocal()
        try:
            doc = fail_db.get(Document, document_id)
            if doc:
                doc.status = "failed"
                doc.error_message = str(e)[:1024]
                doc.processing_finished_at = datetime.now(timezone.utc)
                fail_db.commit()
        finally:
            fail_db.close()
        raise
    finally:
        db.close()

