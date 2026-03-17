from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class DocumentOut(BaseModel):
    id: int
    workspace_id: int
    filename: str
    original_name: str
    file_path: str
    mime_type: str
    file_size: int
    status: str
    page_count: int | None
    chunk_count: int
    error_message: str | None
    created_at: datetime


class DocumentListOut(BaseModel):
    id: int
    workspace_id: int
    original_name: str
    file_size: int
    status: str
    chunk_count: int
    created_at: datetime
