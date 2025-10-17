from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from jose import jwt

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
