from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.workspace import WorkspaceCreate, WorkspaceOut
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

