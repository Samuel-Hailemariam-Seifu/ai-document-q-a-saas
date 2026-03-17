from __future__ import annotations

import os
import secrets
from pathlib import Path

from app.core.config import settings


def get_storage_root() -> Path:
    root = Path(settings.storage_path).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def save_upload(workspace_id: int, original_filename: str, content: bytes) -> tuple[str, str]:
    """Save file under storage_path/workspace_id/random_filename. Returns (file_path relative to root, stored filename)."""
    root = get_storage_root()
    ws_dir = root / str(workspace_id)
    ws_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(original_filename).suffix or ""
    safe_name = secrets.token_urlsafe(16) + ext
    full_path = ws_dir / safe_name
    full_path.write_bytes(content)
    rel_path = str(Path(str(workspace_id)) / safe_name)
    return rel_path, safe_name


def delete_file(relative_path: str) -> None:
    root = get_storage_root()
    full = root / relative_path
    if full.is_file():
        full.unlink(missing_ok=True)


def resolve_path(relative_path: str) -> Path:
    return (get_storage_root() / relative_path).resolve()
