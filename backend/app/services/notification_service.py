from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Optional, Protocol
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..config import get_settings
from ..models.content import ContentItem
from ..models.user import User, UserStatus


logger = logging.getLogger(__name__)


class NotificationChannel(str, Enum):
    EMAIL = "email"
    WHATSAPP = "whatsapp"


@dataclass(frozen=True)
class NotificationMessage:
    channel: NotificationChannel
    recipient: str
    template: str
    subject: Optional[str] = None
    context: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


class NotificationProvider(Protocol):
    def send(self, message: NotificationMessage) -> None:
        """Dispatch a notification message via the provider."""


class LoggingNotificationProvider:
    """Default provider that logs notification payloads for development."""

    def send(
        self, message: NotificationMessage
    ) -> None:  # pragma: no cover - thin wrapper around logger
        logger.info(
            "Notification dispatched",
            extra={
                "channel": message.channel.value,
                "recipient": message.recipient,
                "template": message.template,
                "subject": message.subject,
                "context": message.context,
                "metadata": message.metadata,
            },
        )


_provider: Optional[NotificationProvider] = None


def get_notification_provider() -> NotificationProvider:
    global _provider
    if _provider is None:
        settings = get_settings()
        provider_name = settings.notification_provider.lower()
        if provider_name in {"logging", "stub", "development"}:
            _provider = LoggingNotificationProvider()
        else:  # pragma: no cover - defensive branch for future providers
            logger.warning(
                "Unknown notification provider '%s', falling back to logging stub", provider_name
            )
            _provider = LoggingNotificationProvider()
    return _provider


def set_notification_provider(provider: NotificationProvider | None) -> None:
    """Override the notification provider (primarily for tests)."""

    global _provider
    _provider = provider


def send_message(message: NotificationMessage) -> None:
    provider = get_notification_provider()
    provider.send(message)


def send_password_reset_email(email: str, token: str) -> None:
    """Dispatch password reset notification through the active provider."""

    message = NotificationMessage(
        channel=NotificationChannel.EMAIL,
        recipient=email,
        template="auth.password_reset",
        subject="Community App Password Reset",
        context={"token": token},
        metadata={"event": "auth.password_reset"},
    )
    send_message(message)


def _allows_account_notifications(user: User) -> bool:
    preferences = getattr(user, "preferences", None)
    if preferences is None:
        return True
    return getattr(preferences, "notify_account", True)


def _allows_content_notifications(user: User) -> bool:
    preferences = getattr(user, "preferences", None)
    if preferences is None:
        return True
    return getattr(preferences, "notify_content", True)


def send_verification_email(user: User, token: str) -> None:
    """Send email verification instructions if the user permits account notifications."""

    if not _allows_account_notifications(user):
        return

    message = NotificationMessage(
        channel=NotificationChannel.EMAIL,
        recipient=user.email,
        template="auth.verify_email",
        subject="Verify your Community App account",
        context={"token": token, "user_id": str(user.id)},
        metadata={"event": "auth.verify_requested"},
    )
    send_message(message)


def send_account_verified_email(user: User) -> None:
    """Notify the member that their account is now active if allowed."""

    if not _allows_account_notifications(user):
        return

    message = NotificationMessage(
        channel=NotificationChannel.EMAIL,
        recipient=user.email,
        template="auth.account_verified",
        subject="Your Community App account is verified",
        context={"user_id": str(user.id)},
        metadata={"event": "auth.account_verified"},
    )
    send_message(message)


def broadcast_content_published(
    db: Session,
    *,
    content: ContentItem,
    actor_id: Optional[UUID] = None,
) -> int:
    """Notify opted-in members when new content is published."""

    recipients = (
        db.execute(
            select(User)
            .options(selectinload(User.preferences))
            .where(User.status == UserStatus.active.value)
        )
        .scalars()
        .all()
    )

    delivered = 0
    for user in recipients:
        if actor_id and user.id == actor_id:
            continue
        if not _allows_content_notifications(user):
            continue
        if not user.email:
            continue

        message = NotificationMessage(
            channel=NotificationChannel.EMAIL,
            recipient=user.email,
            template="content.published",
            subject=f"New content available: {content.title}",
            context={
                "content_id": str(content.id),
                "title": content.title,
                "description": content.description,
                "owner_id": str(content.owner_id) if content.owner_id else None,
            },
            metadata={
                "event": "content.published",
                "content_id": str(content.id),
            },
        )
        send_message(message)
        delivered += 1

    return delivered
