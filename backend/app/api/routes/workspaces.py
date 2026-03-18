from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, select
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.chat import Chat
from app.models.document import Document
from app.models.message import Message
from app.models.user import User
from app.schemas.workspace import WorkspaceCreate, WorkspaceOut, WorkspaceStatsOut
from app.services.workspace_service import create_workspace, get_workspace, list_workspaces

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


@router.get("", response_model=list[WorkspaceOut])
def workspaces(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[WorkspaceOut]:
    items = list_workspaces(db, owner_id=current_user.id)
    return [WorkspaceOut(id=w.id, name=w.name, created_at=w.created_at) for w in items]


@router.post("", response_model=WorkspaceOut, status_code=status.HTTP_201_CREATED)
def create(payload: WorkspaceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> WorkspaceOut:
    ws = create_workspace(db, owner_id=current_user.id, name=payload.name)
    return WorkspaceOut(id=ws.id, name=ws.name, created_at=ws.created_at)


@router.get("/{workspace_id}", response_model=WorkspaceOut)
def detail(workspace_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> WorkspaceOut:
    ws = get_workspace(db, workspace_id=workspace_id, owner_id=current_user.id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return WorkspaceOut(id=ws.id, name=ws.name, created_at=ws.created_at)


@router.get("/{workspace_id}/stats", response_model=WorkspaceStatsOut)
def stats(workspace_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> WorkspaceStatsOut:
    ws = get_workspace(db, workspace_id=workspace_id, owner_id=current_user.id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    docs_total = db.execute(
        select(func.count()).select_from(Document).where(Document.workspace_id == workspace_id)
    ).scalar_one()
    docs_ready = db.execute(
        select(func.count()).select_from(Document).where(Document.workspace_id == workspace_id, Document.status == "ready")
    ).scalar_one()
    docs_processing = db.execute(
        select(func.count()).select_from(Document).where(
            Document.workspace_id == workspace_id, Document.status == "processing"
        )
    ).scalar_one()
    docs_pending = db.execute(
        select(func.count()).select_from(Document).where(Document.workspace_id == workspace_id, Document.status == "pending")
    ).scalar_one()
    docs_failed = db.execute(
        select(func.count()).select_from(Document).where(Document.workspace_id == workspace_id, Document.status == "failed")
    ).scalar_one()

    storage_bytes_total = db.execute(
        select(func.coalesce(func.sum(Document.file_size), 0)).select_from(Document).where(Document.workspace_id == workspace_id)
    ).scalar_one()

    chats_total = db.execute(
        select(func.count()).select_from(Chat).where(Chat.workspace_id == workspace_id)
    ).scalar_one()

    messages_total = db.execute(
        select(func.count())
        .select_from(Message)
        .join(Chat, Chat.id == Message.chat_id)
        .where(Chat.workspace_id == workspace_id)
    ).scalar_one()

    ai_queries_total = db.execute(
        select(func.count())
        .select_from(Message)
        .join(Chat, Chat.id == Message.chat_id)
        .where(Chat.workspace_id == workspace_id, Message.role == "user")
    ).scalar_one()

    # ingestion success rate among terminal states (ready/failed)
    terminal_total = int((docs_ready or 0) + (docs_failed or 0))
    ingestion_success_rate = (float(docs_ready or 0) / float(terminal_total)) if terminal_total > 0 else 0.0

    # average processing time across documents with both timestamps
    times = db.execute(
        select(Document.processing_started_at, Document.processing_finished_at)
        .where(Document.workspace_id == workspace_id)
        .where(Document.processing_started_at.is_not(None))
        .where(Document.processing_finished_at.is_not(None))
    ).all()
    durations: list[float] = []
    for started_at, finished_at in times:
        if isinstance(started_at, datetime) and isinstance(finished_at, datetime):
            delta = (finished_at - started_at).total_seconds()
            if delta >= 0:
                durations.append(delta)
    avg_processing_seconds = (sum(durations) / len(durations)) if durations else None

    # citations per assistant answer (avg # of citations on assistant messages)
    assistant_msgs = db.execute(
        select(Message.citations_json)
        .select_from(Message)
        .join(Chat, Chat.id == Message.chat_id)
        .where(Chat.workspace_id == workspace_id, Message.role == "assistant")
        .order_by(Message.id.desc())
    ).scalars().all()
    answers = len(assistant_msgs)
    total_citations = 0
    for cj in assistant_msgs:
        if isinstance(cj, dict):
            citations = cj.get("citations")
            if isinstance(citations, list):
                total_citations += len(citations)
    citations_per_answer = (float(total_citations) / float(answers)) if answers > 0 else 0.0

    return WorkspaceStatsOut(
        workspace_id=workspace_id,
        documents_total=int(docs_total or 0),
        documents_ready=int(docs_ready or 0),
        documents_processing=int(docs_processing or 0),
        documents_pending=int(docs_pending or 0),
        documents_failed=int(docs_failed or 0),
        storage_bytes_total=int(storage_bytes_total or 0),
        chats_total=int(chats_total or 0),
        messages_total=int(messages_total or 0),
        ai_queries_total=int(ai_queries_total or 0),
        ingestion_success_rate=float(ingestion_success_rate),
        avg_processing_seconds=float(avg_processing_seconds) if avg_processing_seconds is not None else None,
        citations_per_answer=float(citations_per_answer),
    )

