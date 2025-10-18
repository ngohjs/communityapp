from __future__ import annotations

from datetime import datetime, timedelta, timezone

import backend.app.models  # noqa: F401 - ensure metadata import
import pytest
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.dependencies import get_current_admin
from backend.app.main import app
from backend.app.models.audit import AuditLog
from backend.app.models.user import User, UserStatus


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

    app.dependency_overrides.pop(get_db, None)


def _create_user(session, *, email="admin@example.com", is_admin=True) -> User:
    user = User(
        email=email,
        password_hash="hashed",
        first_name="Admin",
        last_name="User",
        status=UserStatus.active.value,
        is_admin=is_admin,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _create_log(
    session,
    *,
    actor_id,
    action_type: str,
    target_type: str,
    created_at: datetime,
    metadata: dict | None = None,
):
    entry = AuditLog(
        actor_id=actor_id,
        action_type=action_type,
        target_type=target_type,
        metadata_json=metadata or {},
        created_at=created_at,
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


def test_admin_can_list_audit_logs_with_filters(client: TestClient, session):
    admin = _create_user(session)
    actor = _create_user(session, email="member@example.com", is_admin=False)

    now = datetime.now(timezone.utc)
    older = _create_log(
        session,
        actor_id=actor.id,
        action_type="auth.register",
        target_type="user",
        created_at=now - timedelta(days=2),
        metadata={"email": actor.email},
    )
    newest = _create_log(
        session,
        actor_id=admin.id,
        action_type="content.create",
        target_type="content_item",
        created_at=now - timedelta(days=1),
        metadata={"title": "Deck"},
    )
    _create_log(
        session,
        actor_id=None,
        action_type="auth.login",
        target_type="session",
        created_at=now,
    )

    app.dependency_overrides[get_current_admin] = lambda: session.get(User, admin.id)

    response = client.get("/admin/audit/logs", params={"page": 1, "page_size": 2})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    assert len(body["items"]) == 2
    # Ensure newest first
    assert body["items"][0]["action_type"] == "auth.login"

    filter_response = client.get(
        "/admin/audit/logs",
        params={
            "action_type": "auth.register",
            "start_at": (now - timedelta(days=3)).isoformat(),
            "end_at": (now - timedelta(days=1, seconds=1)).isoformat(),
        },
    )
    assert filter_response.status_code == 200
    filter_body = filter_response.json()
    assert filter_body["total"] == 1
    assert filter_body["items"][0]["action_type"] == "auth.register"
    assert filter_body["items"][0]["actor"]["email"] == actor.email

    app.dependency_overrides.pop(get_current_admin, None)


def test_audit_logs_forbidden_for_non_admin(client: TestClient):
    app.dependency_overrides[get_current_admin] = lambda: (_ for _ in ()).throw(
        HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    )

    response = client.get("/admin/audit/logs")
    assert response.status_code == 403

    app.dependency_overrides.pop(get_current_admin, None)
