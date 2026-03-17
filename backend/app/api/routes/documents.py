from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.document import DocumentListOut, DocumentOut
from app.services.document_service import (
    create_document,
    delete_document,
    get_document,
    list_documents,
)
from app.services.workspace_service import get_workspace

router = APIRouter(tags=["documents"])


@router.get("/api/workspaces/{workspace_id}/documents", response_model=list[DocumentListOut])
def list_workspace_documents(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws = get_workspace(db, workspace_id=workspace_id, owner_id=current_user.id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    items = list_documents(db, workspace_id=workspace_id, owner_id=current_user.id)
    return [
        DocumentListOut(
            id=d.id,
            workspace_id=d.workspace_id,
            original_name=d.original_name,
            file_size=d.file_size,
            status=d.status,
            chunk_count=d.chunk_count,
            created_at=d.created_at,
        )
        for d in items
    ]


@router.post("/api/workspaces/{workspace_id}/documents/upload", response_model=DocumentOut, status_code=201)
async def upload_document(
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...),
):
    ws = get_workspace(db, workspace_id=workspace_id, owner_id=current_user.id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    content = await file.read()
    mime = file.content_type or "application/octet-stream"
    doc = create_document(
        db,
        workspace_id=workspace_id,
        owner_id=current_user.id,
        original_name=file.filename or "document",
        content=content,
        mime_type=mime,
    )
    if not doc:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type or size. Allowed: PDF, TXT, DOCX; max 25MB.",
        )
    return DocumentOut(
        id=doc.id,
        workspace_id=doc.workspace_id,
        filename=doc.filename,
        original_name=doc.original_name,
        file_path=doc.file_path,
        mime_type=doc.mime_type,
        file_size=doc.file_size,
        status=doc.status,
        page_count=doc.page_count,
        chunk_count=doc.chunk_count,
        error_message=doc.error_message,
        created_at=doc.created_at,
    )


@router.get("/api/documents/{document_id}", response_model=DocumentOut)
def get_document_detail(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = get_document(db, document_id=document_id, owner_id=current_user.id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentOut(
        id=doc.id,
        workspace_id=doc.workspace_id,
        filename=doc.filename,
        original_name=doc.original_name,
        file_path=doc.file_path,
        mime_type=doc.mime_type,
        file_size=doc.file_size,
        status=doc.status,
        page_count=doc.page_count,
        chunk_count=doc.chunk_count,
        error_message=doc.error_message,
        created_at=doc.created_at,
    )


@router.delete("/api/documents/{document_id}", status_code=204)
def delete_document_by_id(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ok = delete_document(db, document_id=document_id, owner_id=current_user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Document not found")
