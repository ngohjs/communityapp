from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from uuid import uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import get_settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def _create_token(
    subject: str,
    expires_delta: timedelta,
    purpose: str,
    *,
    additional_claims: Optional[Dict[str, Any]] = None,
) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload: Dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
        "purpose": purpose,
    }
    if additional_claims:
        payload.update(additional_claims)
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def create_access_token(subject: str, *, extra_claims: Optional[Dict[str, Any]] = None) -> str:
    settings = get_settings()
    claims: Dict[str, Any] = {"jti": uuid4().hex}
    if extra_claims:
        claims.update(extra_claims)
    return _create_token(
        subject,
        timedelta(minutes=settings.access_token_expiry_minutes),
        purpose="access",
        additional_claims=claims,
    )


def create_refresh_token(subject: str, *, session_id: str) -> str:
    settings = get_settings()
    return _create_token(
        subject,
        timedelta(days=settings.refresh_token_expiry_days),
        purpose="refresh",
        additional_claims={"sid": session_id, "jti": uuid4().hex},
    )


def create_verification_token(subject: str) -> str:
    settings = get_settings()
    return _create_token(
        subject,
        timedelta(hours=settings.verification_token_expiry_hours),
        purpose="verify",
    )


def create_password_reset_token(subject: str) -> tuple[str, str]:
    settings = get_settings()
    token_id = uuid4().hex
    token = _create_token(
        subject,
        timedelta(minutes=settings.password_reset_token_expiry_minutes),
        purpose="reset",
        additional_claims={"jti": token_id},
    )
    return token, token_id


def hash_token(token: str) -> str:
    return pwd_context.hash(token)


def verify_token_hash(token: str, token_hash: str) -> bool:
    return pwd_context.verify(token, token_hash)


class TokenError(ValueError):
    """Raised when a JWT cannot be validated for the requested purpose."""


def decode_token(token: str, *, purpose: str) -> Dict[str, Any]:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except JWTError as exc:  # includes ExpiredSignatureError
        raise TokenError("invalid_token") from exc

    if payload.get("purpose") != purpose:
        raise TokenError("invalid_purpose")
    return payload
