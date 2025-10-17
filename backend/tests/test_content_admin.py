
from __future__ import annotations

from pathlib import Path

import backend.app.models  # noqa: F401 - ensure metadata import
import pytest
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.config import get_settings
from backend.app.database import Base, get_db
from backend.app.dependencies import get_current_admin
from backend.app.main import app
from backend.app.models.category import Category
from backend.app.models.content import ContentItem, ContentStatus
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
def client(session, tmp_path):
    def override_get_db():
        try:
            yield session
        finally:
            session.rollback()

    app.dependency_overrides[get_db] = override_get_db

    settings = get_settings()
    original_media_root = settings.media_root
    settings.media_root = str(tmp_path)

    with TestClient(app) as test_client:
        yield test_client

    settings.media_root = original_media_root
    app.dependency_overrides.pop(get_db, None)


def _create_user(
    session,
    *,
    email: str = "admin@example.com",
    first_name: str = "Admin",
    last_name: str = "User",
    is_admin: bool = True,
) -> User:
    user = User(
        email=email,
        password_hash="hashed",
        first_name=first_name,
        last_name=last_name,
        status=UserStatus.active.value,
        is_admin=is_admin,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def test_admin_can_create_content(client: TestClient, session):
    admin = _create_user(session)
    category = Category(name="Playbooks")
    session.add(category)
    session.commit()
    session.refresh(category)

    app.dependency_overrides[get_current_admin] = lambda: session.get(User, admin.id)

    pdf_bytes = b"%PDF-1.4 minimal"

    response = client.post(
        "/admin/content",
        data={
            "title": "Onboarding Deck",
            "description": "Overview",
            "status_value": "published",
            "category_id": str(category.id),
        },
        files={"file": ("deck.pdf", pdf_bytes, "application/pdf")},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Onboarding Deck"
    assert body["status"] == ContentStatus.published.value

    stored = session.query(ContentItem).one()
    assert stored.title == "Onboarding Deck"
    assert stored.category_id == category.id

    settings = get_settings()
    assert (Path(settings.media_root) / stored.file_path).exists()

    app.dependency_overrides.pop(get_current_admin, None)


def test_non_admin_forbidden(client: TestClient, session):
    _create_user(session, email="viewer@example.com", is_admin=False)

    def override_admin():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    app.dependency_overrides[get_current_admin] = override_admin

    response = client.post(
        "/admin/content",
        data={"title": "Doc"},
        files={"file": ("doc.pdf", b"data", "application/pdf")},
    )

    assert response.status_code == 403
    app.dependency_overrides.pop(get_current_admin, None)


def test_update_content_metadata(client: TestClient, session):
    admin = _create_user(session)
    app.dependency_overrides[get_current_admin] = lambda: session.get(User, admin.id)

    create_response = client.post(
        "/admin/content",
        data={"title": "Doc"},
        files={"file": ("file.pdf", b"%PDF", "application/pdf")},
    )
    content_id = create_response.json()["id"]

    update_response = client.patch(
        f"/admin/content/{content_id}",
        json={"title": "Updated Doc", "status": "draft"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["title"] == "Updated Doc"
    assert update_response.json()["status"] == ContentStatus.draft.value

    stored = session.query(ContentItem).one()
    assert stored.title == "Updated Doc"
    assert stored.status == ContentStatus.draft.value

    app.dependency_overrides.pop(get_current_admin, None)


def test_archive_content(client: TestClient, session):
    admin = _create_user(session)
    app.dependency_overrides[get_current_admin] = lambda: session.get(User, admin.id)

    response = client.post(
        "/admin/content",
        data={"title": "Archive"},
        files={"file": ("file.pdf", b"%PDF", "application/pdf")},
    )
    content_id = response.json()["id"]

    archive_response = client.patch(f"/admin/content/{content_id}/archive")
    assert archive_response.status_code == 200
    assert archive_response.json()["status"] == ContentStatus.archived.value

    app.dependency_overrides.pop(get_current_admin, None)


def test_create_content_invalid_type(client: TestClient, session):
    admin = _create_user(session)
    app.dependency_overrides[get_current_admin] = lambda: session.get(User, admin.id)

    response = client.post(
        "/admin/content",
        data={"title": "Invalid"},
        files={"file": ("file.txt", b"hello", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported file type"

    app.dependency_overrides.pop(get_current_admin, None)

    app.dependency_overrides.pop(get_current_admin, None)
