from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)


class WorkspaceOut(BaseModel):
    id: int
    name: str
    created_at: datetime

