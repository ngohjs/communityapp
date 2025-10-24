from __future__ import annotations

import logging
import uuid

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base
from backend.app.models.content import ContentItem, ContentStatus
from backend.app.models.preference import PrivacyLevel, UserPreference
from backend.app.models.user import User, UserStatus
from backend.app.services.notification_service import (
    LoggingNotificationProvider,
    NotificationChannel,
    NotificationMessage,
    NotificationProvider,
    broadcast_content_published,
    send_account_verified_email,
    send_password_reset_email,
    send_verification_email,
    set_notification_provider,
)


class DummyProvider(NotificationProvider):
    def __init__(self) -> None:
        self.messages: list[NotificationMessage] = []

    def send(self, message: NotificationMessage) -> None:
        self.messages.append(message)


engine = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


@pytest.fixture(autouse=True)
def prepare_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_logging_notification_provider_logs_payload(caplog):
    provider = LoggingNotificationProvider()
    message = NotificationMessage(
        channel=NotificationChannel.EMAIL,
        recipient="member@example.com",
        template="test.template",
        subject="Hello",
        context={"code": "1234"},
        metadata={"event": "test"},
    )

    with caplog.at_level(logging.INFO):
        provider.send(message)

    assert any(record.message == "Notification dispatched" for record in caplog.records)
    record = next(
        record for record in caplog.records if record.message == "Notification dispatched"
    )
    assert record.channel == message.channel.value
    assert record.recipient == message.recipient
    assert record.template == message.template
    assert record.context == message.context


def test_send_password_reset_email_uses_active_provider():
    dummy = DummyProvider()
    try:
        set_notification_provider(dummy)
        send_password_reset_email("user@example.com", "token-123")

        assert len(dummy.messages) == 1
        message = dummy.messages[0]
        assert message.channel == NotificationChannel.EMAIL
        assert message.recipient == "user@example.com"
        assert message.template == "auth.password_reset"
        assert message.context["token"] == "token-123"
    finally:
        set_notification_provider(None)


def test_verification_and_account_notifications_respect_preferences():
    dummy = DummyProvider()
    set_notification_provider(dummy)
    try:
        user = User(
            id=uuid.uuid4(),
            email="member@example.com",
            password_hash="hashed",
            first_name="Member",
            last_name="Example",
            status=UserStatus.active.value,
        )
        preference = UserPreference(
            user_id=user.id,
            privacy_level=PrivacyLevel.private.value,
            notify_account=False,
            notify_content=True,
            notify_community=True,
        )
        user.preferences = preference

        send_verification_email(user, "token-1")
        send_account_verified_email(user)
        assert not dummy.messages

        preference.notify_account = True
        send_verification_email(user, "token-2")
        send_account_verified_email(user)
        assert len(dummy.messages) == 2
        templates = [message.template for message in dummy.messages]
        assert templates == ["auth.verify_email", "auth.account_verified"]
    finally:
        set_notification_provider(None)


def test_broadcast_content_published_notifies_only_opted_in(session):
    dummy = DummyProvider()
    set_notification_provider(dummy)
    try:
        admin = User(
            id=uuid.uuid4(),
            email="admin@example.com",
            password_hash="hashed",
            first_name="Admin",
            last_name="User",
            status=UserStatus.active.value,
            is_admin=True,
        )
        member_opt_in = User(
            id=uuid.uuid4(),
            email="member@example.com",
            password_hash="hashed",
            first_name="Member",
            last_name="OptIn",
            status=UserStatus.active.value,
        )
        member_opt_out = User(
            id=uuid.uuid4(),
            email="silent@example.com",
            password_hash="hashed",
            first_name="Member",
            last_name="OptOut",
            status=UserStatus.active.value,
        )
        session.add_all([admin, member_opt_in, member_opt_out])
        session.commit()

        pref_in = UserPreference(
            user_id=member_opt_in.id,
            privacy_level=PrivacyLevel.private.value,
            notify_content=True,
            notify_account=True,
            notify_community=True,
        )
        pref_out = UserPreference(
            user_id=member_opt_out.id,
            privacy_level=PrivacyLevel.private.value,
            notify_content=False,
            notify_account=True,
            notify_community=True,
        )
        session.add_all([pref_in, pref_out])
        session.commit()

        content = ContentItem(
            title="New Playbook",
            description="Overview",
            file_path="content/file.pdf",
            file_type="pdf",
            status=ContentStatus.published.value,
            owner_id=admin.id,
        )
        session.add(content)
        session.commit()
        session.refresh(content)

        delivered = broadcast_content_published(session, content=content, actor_id=admin.id)
        assert delivered == 1
        assert len(dummy.messages) == 1
        assert dummy.messages[0].recipient == member_opt_in.email
        assert dummy.messages[0].template == "content.published"
    finally:
        set_notification_provider(None)
