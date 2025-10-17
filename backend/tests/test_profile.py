from __future__ import annotations

import backend.app.models  # noqa: F401 - ensure metadata import
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models.audit import AuditLog
from backend.app.models.preference import UserPreference
from backend.app.models.profile import UserProfile
from backend.app.models.user import User, UserStatus
from backend.app.dependencies import get_current_user
from backend.app.config import get_settings

from io import BytesIO
from pathlib import Path
from typing import Optional

from PIL import Image


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


@pytest.fixture
def client(session):
    def override_get_db():
        try:
            yield session
        finally:
            session.rollback()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.pop(get_current_user, None)


def _create_user(session, *, email="member@example.com", is_admin=False) -> User:
    user = User(
        email=email,
        password_hash="hashed",
        first_name="Member",
        last_name="Example",
        status=UserStatus.active.value,
        is_admin=is_admin,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _create_test_image_bytes(size=(1024, 1024), color="blue", fmt="PNG") -> bytes:
    image = Image.new("RGB", size, color=color)
    buffer = BytesIO()
    image.save(buffer, format=fmt)
    return buffer.getvalue()


def test_get_profile_returns_defaults(client: TestClient, session):
    user = _create_user(session)

    def override_current_user(token: Optional[str] = None):
        return session.get(User, user.id)

    app.dependency_overrides[get_current_user] = override_current_user

    response = client.get("/profile/me")
    assert response.status_code == 200
    body = response.json()
    assert body["first_name"] == "Member"
    assert body["bio"] is None

    app.dependency_overrides.pop(get_current_user, None)


def test_update_profile_updates_fields_and_logs(client: TestClient, session):
    user = _create_user(session)
    profile = UserProfile(user_id=user.id)
    session.add(profile)
    session.commit()

    def override_current_user(token: Optional[str] = None):
        return session.get(User, user.id)

    app.dependency_overrides[get_current_user] = override_current_user

    payload = {
        "first_name": "Updated",
        "last_name": "User",
        "phone": "+12345678901",
        "bio": "Hello world",
        "location": "Singapore",
        "interests": ["Sales", "Enablement"],
    }

    response = client.patch("/profile/me", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["first_name"] == "Updated"
    assert body["bio"] == "Hello world"
    assert body["interests"] == payload["interests"]

    session.refresh(user)
    session.refresh(profile)
    assert user.phone == payload["phone"]
    assert profile.location == payload["location"]

    audit_entries = session.query(AuditLog).filter(AuditLog.action_type == "profile.update").all()
    assert len(audit_entries) == 1

    app.dependency_overrides.pop(get_current_user, None)


def test_update_profile_rejects_duplicate_phone(client: TestClient, session):
    user = _create_user(session)
    other = User(
        email="other@example.com",
        password_hash="hashed",
        first_name="Other",
        last_name="User",
        status=UserStatus.active.value,
        phone="+12345678901",
    )
    session.add(other)
    session.commit()

    def override_current_user(token: Optional[str] = None):
        return session.get(User, user.id)

    app.dependency_overrides[get_current_user] = override_current_user

    response = client.patch(
        "/profile/me",
        json={"phone": "+12345678901"},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Phone already in use"

    app.dependency_overrides.pop(get_current_user, None)


def test_upload_avatar_resizes_and_saves(client: TestClient, session, tmp_path):
    user = _create_user(session)
    profile = UserProfile(user_id=user.id)
    session.add(profile)
    session.commit()

    settings = get_settings()
    original_media_root = settings.media_root
    settings.media_root = str(tmp_path)

    def override_current_user(token: Optional[str] = None):
        return session.get(User, user.id)

    app.dependency_overrides[get_current_user] = override_current_user

    image_bytes = _create_test_image_bytes()

    response = client.post(
        "/profile/me/avatar",
        files={"file": ("avatar.png", image_bytes, "image/png")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["avatar_path"] is not None

    avatar_path = Path(settings.media_root) / settings.avatar_subdir / body["avatar_path"]
    assert avatar_path.exists()

    with Image.open(avatar_path) as img:
        assert max(img.size) <= 512

    settings.media_root = original_media_root
    app.dependency_overrides.pop(get_current_user, None)


def test_privacy_private_blocks_other_users(client: TestClient, session):
    owner = _create_user(session, email="owner@example.com")
    viewer = _create_user(session, email="viewer@example.com")
    session.add(UserProfile(user_id=owner.id))
    session.add(UserProfile(user_id=viewer.id))
    session.commit()

    def override_current_user(token: Optional[str] = None):
        return session.get(User, owner.id)

    app.dependency_overrides[get_current_user] = override_current_user
    client.get("/profile/me")  # ensure preferences initialized
    app.dependency_overrides.pop(get_current_user, None)

    def override_viewer(token: Optional[str] = None):
        return session.get(User, viewer.id)

    app.dependency_overrides[get_current_user] = override_viewer
    response = client.get(f"/profile/{owner.id}")
    assert response.status_code == 403
    app.dependency_overrides.pop(get_current_user, None)


def test_privacy_community_allows_other_members(client: TestClient, session):
    owner = _create_user(session, email="owner2@example.com")
    viewer = _create_user(session, email="viewer2@example.com")
    session.add(UserProfile(user_id=owner.id))
    session.add(UserProfile(user_id=viewer.id))
    session.commit()

    def override_owner(token: Optional[str] = None):
        return session.get(User, owner.id)

    app.dependency_overrides[get_current_user] = override_owner
    response = client.patch("/profile/me/privacy", json={"privacy_level": "community"})
    assert response.status_code == 200
    app.dependency_overrides.pop(get_current_user, None)

    def override_viewer(token: Optional[str] = None):
        return session.get(User, viewer.id)

    app.dependency_overrides[get_current_user] = override_viewer
    response = client.get(f"/profile/{owner.id}")
    assert response.status_code == 200
    body = response.json()
    assert body["privacy_level"] == "community"
    app.dependency_overrides.pop(get_current_user, None)


def test_privacy_admin_requires_admin_user(client: TestClient, session):
    owner = _create_user(session, email="owner3@example.com")
    admin = _create_user(session, email="admin@example.com", is_admin=True)
    viewer = _create_user(session, email="viewer3@example.com")
    session.add_all([UserProfile(user_id=owner.id), UserProfile(user_id=admin.id), UserProfile(user_id=viewer.id)])
    session.commit()

    def override_owner(token: Optional[str] = None):
        return session.get(User, owner.id)

    app.dependency_overrides[get_current_user] = override_owner
    client.patch("/profile/me/privacy", json={"privacy_level": "admin"})
    app.dependency_overrides.pop(get_current_user, None)

    def override_viewer(token: Optional[str] = None):
        return session.get(User, viewer.id)

    app.dependency_overrides[get_current_user] = override_viewer
    response = client.get(f"/profile/{owner.id}")
    assert response.status_code == 403
    app.dependency_overrides.pop(get_current_user, None)

    def override_admin(token: Optional[str] = None):
        return session.get(User, admin.id)

    app.dependency_overrides[get_current_user] = override_admin
    response = client.get(f"/profile/{owner.id}")
    assert response.status_code == 200
    app.dependency_overrides.pop(get_current_user, None)


def test_update_notification_preferences(client: TestClient, session):
    user = _create_user(session, email="prefs@example.com")
    session.add(UserProfile(user_id=user.id))
    session.add(UserPreference(user_id=user.id))
    session.commit()

    def override_user(token: Optional[str] = None):
        return session.get(User, user.id)

    app.dependency_overrides[get_current_user] = override_user

    response = client.patch(
        "/profile/me/preferences",
        json={"notify_content": False, "notify_community": True},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["privacy_level"] == "private"

    prefs = session.get(UserPreference, user.id)
    assert prefs.notify_content is False
    assert prefs.notify_community is True

    audit_entries = session.query(AuditLog).filter(AuditLog.action_type == "profile.preferences.update").all()
    assert len(audit_entries) == 1

    app.dependency_overrides.pop(get_current_user, None)
