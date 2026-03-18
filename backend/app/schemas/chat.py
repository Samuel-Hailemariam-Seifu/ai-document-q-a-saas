from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ChatCreate(BaseModel):
    title: str | None = Field(default=None, max_length=200)


class ChatOut(BaseModel):
    id: int
    workspace_id: int
    title: str
    created_at: datetime


class ChatPreviewOut(BaseModel):
    id: int
    workspace_id: int
    title: str
    last_message_preview: str | None = None
    last_message_at: datetime | None = None


class CitationOut(BaseModel):
    document_id: int
    filename: str
    chunk_id: int
    page_number: int | None
    excerpt: str


class MessageOut(BaseModel):
    id: int
    chat_id: int
    role: str
    content: str
    citations: list[CitationOut] | None = None
    created_at: datetime


class AskRequest(BaseModel):
    chat_id: int | None = None
    question: str = Field(min_length=1, max_length=8000)


class AskResponse(BaseModel):
    chat_id: int
    answer: str
    citations: list[CitationOut]

