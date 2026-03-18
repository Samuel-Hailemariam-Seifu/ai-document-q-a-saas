from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)


class WorkspaceOut(BaseModel):
    id: int
    name: str
    created_at: datetime


class WorkspaceStatsOut(BaseModel):
    workspace_id: int

    documents_total: int
    documents_ready: int
    documents_processing: int
    documents_pending: int
    documents_failed: int

    storage_bytes_total: int

    chats_total: int
    messages_total: int
    ai_queries_total: int

    ingestion_success_rate: float
    avg_processing_seconds: float | None
    citations_per_answer: float

