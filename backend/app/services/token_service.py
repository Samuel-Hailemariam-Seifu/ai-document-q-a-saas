from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.auth_token import AuthToken


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _sha256_hex(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def create_token(db: Session, *, user_id: int, token_type: str) -> str:
    raw = secrets.token_urlsafe(32)
    token_hash = _sha256_hex(raw)

    if token_type == "verify_email":
        expires = _now() + timedelta(hours=int(settings.verify_token_expire_hours))
    elif token_type == "reset_password":
        expires = _now() + timedelta(minutes=int(settings.reset_token_expire_minutes))
    else:
        expires = _now() + timedelta(hours=1)

    row = AuthToken(user_id=user_id, token_hash=token_hash, token_type=token_type, expires_at=expires, used_at=None)
    db.add(row)
    db.commit()
    return raw


def consume_token(db: Session, *, token: str, token_type: str) -> AuthToken | None:
    token_hash = _sha256_hex(token)
    row = db.execute(
        select(AuthToken).where(
            AuthToken.token_hash == token_hash,
            AuthToken.token_type == token_type,
            AuthToken.used_at.is_(None),
            AuthToken.expires_at > _now(),
        )
    ).scalar_one_or_none()
    if not row:
        return None
    row.used_at = _now()
    db.commit()
    db.refresh(row)
    return row

