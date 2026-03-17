from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.services.storage_service import delete_file, save_upload
from app.services.workspace_service import get_workspace


ALLOWED_MIMES = {"application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


def list_documents(db: Session, *, workspace_id: int, owner_id: int) -> list[Document]:
    ws = get_workspace(db, workspace_id=workspace_id, owner_id=owner_id)
    if not ws:
        return []
    return list(
        db.execute(
            select(Document).where(Document.workspace_id == workspace_id).order_by(Document.created_at.desc())
        ).scalars().all()
    )


def get_document(db: Session, *, document_id: int, owner_id: int) -> Document | None:
    doc = db.get(Document, document_id)
    if not doc:
        return None
    ws = get_workspace(db, workspace_id=doc.workspace_id, owner_id=owner_id)
    if not ws:
        return None
    return doc


def create_document(
    db: Session,
    *,
    workspace_id: int,
    owner_id: int,
    original_name: str,
    content: bytes,
    mime_type: str,
) -> Document | None:
    ws = get_workspace(db, workspace_id=workspace_id, owner_id=owner_id)
    if not ws:
        return None
    if mime_type not in ALLOWED_MIMES:
        return None
    ext = "." + (original_name.rsplit(".", 1)[-1] if "." in original_name else "")
    if ext.lower() not in ALLOWED_EXTENSIONS:
        return None
    if len(content) > MAX_FILE_SIZE:
        return None

    file_path, filename = save_upload(workspace_id, original_name, content)
    doc = Document(
        workspace_id=workspace_id,
        filename=filename,
        original_name=original_name,
        file_path=file_path,
        mime_type=mime_type,
        file_size=len(content),
        status="pending",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def delete_document(db: Session, *, document_id: int, owner_id: int) -> bool:
    doc = get_document(db, document_id=document_id, owner_id=owner_id)
    if not doc:
        return False
    try:
        delete_file(doc.file_path)
    except OSError:
        pass
    db.delete(doc)
    db.commit()
    return True
