from __future__ import annotations

from sqlalchemy import func, select
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


def delete_chat(db: Session, *, chat: Chat) -> None:
    db.delete(chat)
    db.commit()


def list_messages(db: Session, *, chat_id: int) -> list[Message]:
    return list(db.execute(select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at.asc())).scalars().all())


def add_message(db: Session, *, chat_id: int, role: str, content: str, citations_json: dict | None = None) -> Message:
    m = Message(chat_id=chat_id, role=role, content=content, citations_json=citations_json)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def list_recent_chat_previews(db: Session, *, workspace_id: int, limit: int = 8) -> list[tuple[Chat, Message | None]]:
    """
    Returns recent chats for a workspace with their latest message (if any).
    Uses a subquery to find last message timestamp per chat.
    """
    lim = max(1, min(int(limit or 8), 50))

    last_msg = (
        select(Message.chat_id.label("chat_id"), func.max(Message.created_at).label("last_at"))
        .group_by(Message.chat_id)
        .subquery()
    )

    rows = (
        db.execute(
            select(Chat, Message)
            .where(Chat.workspace_id == workspace_id)
            .outerjoin(last_msg, last_msg.c.chat_id == Chat.id)
            .outerjoin(
                Message,
                (Message.chat_id == Chat.id) & (Message.created_at == last_msg.c.last_at),
            )
            .order_by(last_msg.c.last_at.desc().nullslast(), Chat.created_at.desc())
            .limit(lim)
        )
        .all()
    )

    return [(c, m) for (c, m) in rows]

