from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from ...database import get_db
from ...config import get_settings
from ...schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    TokenResponse,
    UserSummary,
    VerifyEmailResponse,
)
from ...services.auth_service import AuthService
from ...services.notification_service import send_verification_email


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> RegisterResponse:
    try:
        user = AuthService.register_user(
            db,
            email=payload.email,
            first_name=payload.first_name,
            last_name=payload.last_name,
            password=payload.password,
        )
    except ValueError as e:
        if str(e) == "email_already_registered":
            raise HTTPException(status_code=400, detail="Email already registered")
        raise

    verification_token = AuthService.generate_verification_token(user)
    send_verification_email(user, verification_token)

    return RegisterResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        status=user.status,
        created_at=user.created_at,
        verification_token=verification_token,
    )


@router.get("/verify", response_model=VerifyEmailResponse)
def verify_email(token: str, db: Session = Depends(get_db)) -> VerifyEmailResponse:
    try:
        user, activated = AuthService.verify_user(db, token)
    except ValueError as e:
        message = str(e)
        if message == "invalid_token":
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        if message == "user_not_found":
            raise HTTPException(status_code=404, detail="User not found")
        raise

    return VerifyEmailResponse(
        id=str(user.id),
        email=user.email,
        status=user.status,
        verified=activated,
    )


def _set_refresh_cookie(response: Response, refresh_token: str, *, expires_at: datetime) -> None:
    settings = get_settings()
    max_age = settings.refresh_token_expiry_days * 24 * 60 * 60
    if expires_at.tzinfo is None:
        expires = expires_at.replace(tzinfo=timezone.utc)
    else:
        expires = expires_at.astimezone(timezone.utc)
    response.set_cookie(
        key=settings.refresh_token_cookie_name,
        value=refresh_token,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
        path=settings.refresh_token_cookie_path,
        domain=settings.refresh_cookie_domain,
        max_age=max_age,
        expires=expires,
    )


def _clear_refresh_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        key=settings.refresh_token_cookie_name,
        path=settings.refresh_token_cookie_path,
        domain=settings.refresh_cookie_domain,
    )


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
) -> TokenResponse:
    device_info = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    try:
        user, access_token, refresh_token, session = AuthService.login(
            db,
            email=payload.email,
            password=payload.password,
            device_info=device_info,
            ip_address=ip_address,
        )
    except ValueError as exc:
        message = str(exc)
        if message == "invalid_credentials":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if message == "user_not_active":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account not active")
        raise

    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    _set_refresh_cookie(response, refresh_token, expires_at=expires_at)
    settings = get_settings()

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.access_token_expiry_minutes * 60,
        refresh_expires_at=expires_at,
        user=UserSummary(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            status=user.status,
        ),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(response: Response, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    settings = get_settings()
    refresh_token = request.cookies.get(settings.refresh_token_cookie_name)
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

    try:
        user, access_token, new_refresh_token, session = AuthService.refresh(
            db, refresh_token=refresh_token
        )
    except ValueError as exc:
        message = str(exc)
        if message in {"invalid_token", "session_not_found", "session_expired"}:
            _clear_refresh_cookie(response)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        if message == "user_not_active":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account not active")
        if message == "user_not_found":
            _clear_refresh_cookie(response)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        raise

    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    _set_refresh_cookie(response, new_refresh_token, expires_at=expires_at)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.access_token_expiry_minutes * 60,
        refresh_expires_at=expires_at,
        user=UserSummary(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            status=user.status,
        ),
    )


@router.post("/logout")
def logout(response: Response, request: Request, db: Session = Depends(get_db)) -> None:
    settings = get_settings()
    refresh_token = request.cookies.get(settings.refresh_token_cookie_name)
    if not refresh_token:
        _clear_refresh_cookie(response)
        response.status_code = status.HTTP_204_NO_CONTENT
        return None

    try:
        AuthService.logout(db, refresh_token=refresh_token)
    except ValueError as exc:
        message = str(exc)
        if message == "invalid_token":
            pass
        else:
            raise
    finally:
        _clear_refresh_cookie(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return None


@router.post("/forgot-password", response_model=MessageResponse, status_code=status.HTTP_202_ACCEPTED)
def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> MessageResponse:
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    AuthService.request_password_reset(
        db,
        email=payload.email,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    return MessageResponse(message="If an account exists for that email, a reset link has been sent.")


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    try:
        AuthService.reset_password(db, token=payload.token, new_password=payload.new_password)
    except ValueError as exc:
        message = str(exc)
        if message in {"invalid_token", "token_not_found", "token_used", "token_expired"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
        if message == "user_not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        raise

    return MessageResponse(message="Password has been reset successfully.")
