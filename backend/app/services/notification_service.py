from __future__ import annotations

import logging


logger = logging.getLogger(__name__)


def send_password_reset_email(email: str, token: str) -> None:
    """Stub notification sender for password reset emails."""
    logger.info("Password reset link generated", extra={"email": email, "token": token})
