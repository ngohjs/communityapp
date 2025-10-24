from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from jose import JWTError, jwt

from ..config import get_settings


def generate_download_token(*, content_id: UUID, actor_id: UUID) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(content_id),
        "actor": str(actor_id),
        "type": "download",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=5)).timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_download_token(token: str) -> dict[str, str]:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except JWTError as exc:
        raise ValueError("invalid_token") from exc

    if payload.get("type") != "download":
        raise ValueError("invalid_token")
    if "sub" not in payload or "actor" not in payload:
        raise ValueError("invalid_token")
    return payload
