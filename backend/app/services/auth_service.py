from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.execute(select(User).where(User.email == email)).scalar_one_or_none()


def create_user(db: Session, *, full_name: str, email: str, password: str) -> User:
    user = User(full_name=full_name, email=email.lower(), password_hash=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, *, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email.lower())
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def update_user_profile(db: Session, *, user: User, full_name: str, email: str) -> User:
    full_name = (full_name or "").strip()
    email = (email or "").strip().lower()
    if not full_name:
        raise ValueError("Full name is required")
    if not email:
        raise ValueError("Email is required")
    # Email uniqueness check (if changed)
    if email != user.email:
        existing = get_user_by_email(db, email)
        if existing and existing.id != user.id:
            raise ValueError("Email already registered")
        user.email = email
        # If email changes, require verification again (when enabled)
        user.email_verified = False
    user.full_name = full_name
    db.commit()
    db.refresh(user)
    return user


def change_user_password(db: Session, *, user: User, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user.password_hash):
        raise ValueError("Current password is incorrect")
    user.password_hash = hash_password(new_password)
    db.commit()

