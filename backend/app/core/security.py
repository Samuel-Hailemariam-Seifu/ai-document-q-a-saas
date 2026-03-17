from __future__ import annotations

from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from app.core.config import settings

ALGORITHM = "HS256"

# bcrypt has a 72-byte limit; truncate to avoid errors for very long inputs
MAX_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:
    raw = password.encode("utf-8")
    if len(raw) > MAX_PASSWORD_BYTES:
        raw = raw[:MAX_PASSWORD_BYTES]
    return bcrypt.hashpw(raw, bcrypt.gensalt()).decode("ascii")


def verify_password(plain_password: str, password_hash: str) -> bool:
    raw = plain_password.encode("utf-8")
    if len(raw) > MAX_PASSWORD_BYTES:
        raw = raw[:MAX_PASSWORD_BYTES]
    return bcrypt.checkpw(raw, password_hash.encode("ascii"))


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(*, subject: str) -> str:
    expire = _now_utc() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode = {"sub": subject, "type": "access", "exp": expire}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=ALGORITHM)


def create_refresh_token(*, subject: str) -> str:
    expire = _now_utc() + timedelta(days=settings.refresh_token_expire_days)
    to_encode = {"sub": subject, "type": "refresh", "exp": expire}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])

