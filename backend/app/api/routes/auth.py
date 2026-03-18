from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    OkResponse,
    RefreshRequest,
    RegisterRequest,
    RequestVerificationRequest,
    ResetPasswordRequest,
    TokenPair,
    UserOut,
    VerifyEmailRequest,
)
from app.core.security import hash_password
from app.services.auth_service import authenticate_user, create_user, get_user_by_email
from app.services.email_service import send_email
from app.services.token_service import consume_token, create_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenPair:
    existing = get_user_by_email(db, payload.email.lower())
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = create_user(db, full_name=payload.full_name, email=payload.email, password=payload.password)
    # Send verification email (best-effort)
    token = create_token(db, user_id=user.id, token_type="verify_email")
    verify_url = f"{settings.frontend_base_url}/verify-email?token={token}"
    # fire and forget (sync endpoint): if email fails, user can request again
    # If Resend isn't configured, send_email() is a no-op.
    try:
        import anyio

        anyio.run(send_email, to_email=user.email, subject="Verify your email", html=f"<p>Verify your email: <a href='{verify_url}'>Verify</a></p>")
    except Exception:
        pass
    return TokenPair(
        access_token=create_access_token(subject=str(user.id)),
        refresh_token=create_refresh_token(subject=str(user.id)),
    )


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenPair:
    user = authenticate_user(db, email=payload.email, password=payload.password)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    if settings.require_email_verification and not user.email_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
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
    return UserOut(id=current_user.id, full_name=current_user.full_name, email=current_user.email, email_verified=current_user.email_verified)


@router.post("/request-verification", response_model=OkResponse)
def request_verification(payload: RequestVerificationRequest, db: Session = Depends(get_db)) -> OkResponse:
    user = get_user_by_email(db, payload.email.lower())
    if not user or user.email_verified:
        return OkResponse()
    token = create_token(db, user_id=user.id, token_type="verify_email")
    verify_url = f"{settings.frontend_base_url}/verify-email?token={token}"
    try:
        import anyio

        anyio.run(send_email, to_email=user.email, subject="Verify your email", html=f"<p>Verify your email: <a href='{verify_url}'>Verify</a></p>")
    except Exception:
        pass
    return OkResponse()


@router.post("/verify-email", response_model=OkResponse)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)) -> OkResponse:
    row = consume_token(db, token=payload.token, token_type="verify_email")
    if not row:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.get(User, row.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token user")
    user.email_verified = True
    db.commit()
    return OkResponse()


@router.post("/forgot-password", response_model=OkResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)) -> OkResponse:
    # Always return OK to avoid user enumeration
    user = get_user_by_email(db, payload.email.lower())
    if not user:
        return OkResponse()
    token = create_token(db, user_id=user.id, token_type="reset_password")
    reset_url = f"{settings.frontend_base_url}/reset-password?token={token}"
    try:
        import anyio

        anyio.run(send_email, to_email=user.email, subject="Reset your password", html=f"<p>Reset your password: <a href='{reset_url}'>Reset</a></p>")
    except Exception:
        pass
    return OkResponse()


@router.post("/reset-password", response_model=OkResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)) -> OkResponse:
    row = consume_token(db, token=payload.token, token_type="reset_password")
    if not row:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.get(User, row.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token user")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return OkResponse()

