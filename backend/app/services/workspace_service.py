from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.workspace import Workspace


def list_workspaces(db: Session, *, owner_id: int) -> list[Workspace]:
    return list(db.execute(select(Workspace).where(Workspace.owner_id == owner_id).order_by(Workspace.created_at.desc())).scalars().all())


def create_workspace(db: Session, *, owner_id: int, name: str) -> Workspace:
    ws = Workspace(owner_id=owner_id, name=name)
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return ws


def get_workspace(db: Session, *, workspace_id: int, owner_id: int) -> Workspace | None:
    return db.execute(
        select(Workspace).where(Workspace.id == workspace_id, Workspace.owner_id == owner_id)
    ).scalar_one_or_none()

