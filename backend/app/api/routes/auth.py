from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    UserOut,
)
from app.services.auth_service import authenticate_user, create_user, get_user_by_email

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenPair:
    existing = get_user_by_email(db, payload.email.lower())
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = create_user(db, full_name=payload.full_name, email=payload.email, password=payload.password)
    return TokenPair(
        access_token=create_access_token(subject=str(user.id)),
        refresh_token=create_refresh_token(subject=str(user.id)),
    )


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenPair:
    user = authenticate_user(db, email=payload.email, password=payload.password)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    return TokenPair(
        access_token=create_access_token(subject=str(user.id)),
        refresh_token=create_refresh_token(subject=str(user.id)),
    )


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest) -> TokenPair:
    try:
        decoded = decode_token(payload.refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if decoded.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token type")

    sub = decoded.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid refresh token subject")

    return TokenPair(
        access_token=create_access_token(subject=str(sub)),
        refresh_token=create_refresh_token(subject=str(sub)),
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut(id=current_user.id, full_name=current_user.full_name, email=current_user.email)

