from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.chat import Chat
from app.models.message import Message


def list_chats(db: Session, *, workspace_id: int) -> list[Chat]:
    return list(db.execute(select(Chat).where(Chat.workspace_id == workspace_id).order_by(Chat.created_at.desc())).scalars().all())


def create_chat(db: Session, *, workspace_id: int, title: str | None) -> Chat:
    c = Chat(workspace_id=workspace_id, title=title or "New chat")
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def get_chat(db: Session, *, chat_id: int, workspace_id: int) -> Chat | None:
    return db.execute(select(Chat).where(Chat.id == chat_id, Chat.workspace_id == workspace_id)).scalar_one_or_none()


def list_messages(db: Session, *, chat_id: int) -> list[Message]:
    return list(db.execute(select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at.asc())).scalars().all())


def add_message(db: Session, *, chat_id: int, role: str, content: str, citations_json: dict | None = None) -> Message:
    m = Message(chat_id=chat_id, role=role, content=content, citations_json=citations_json)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

