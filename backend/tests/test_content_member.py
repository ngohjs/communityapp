
from __future__ import annotations

import backend.app.models  # noqa: F401 - ensure metadata import
import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from typing import Optional
from uuid import UUID

from backend.app.config import get_settings
from backend.app.database import Base, get_db
from backend.app.dependencies import get_current_user
from backend.app.main import app
from backend.app.models.audit import AuditLog
from backend.app.models.category import Category
from backend.app.models.comment import Comment, CommentStatus
from backend.app.models.content import ContentItem, ContentStatus
from backend.app.models.like import Like
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


def _create_user(session) -> User:
    user = User(
        email="member@example.com",
        password_hash="hashed",
        first_name="Member",
        last_name="User",
        status=UserStatus.active.value,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


from typing import Optional


def _create_content(session, *, title: str, status: ContentStatus, category: Optional[Category] = None):
    content = ContentItem(
        title=title,
        description=f"Description for {title}",
        status=status.value,
        file_path=f"content/{title}.pdf",
        file_type="pdf",
        category_id=category.id if category else None,
    )
    session.add(content)
    session.commit()
    session.refresh(content)
    return content


def test_list_content_defaults(client: TestClient, session):
    user = _create_user(session)
    app.dependency_overrides[get_current_user] = lambda: session.get(User, user.id)

    _create_content(session, title="Doc A", status=ContentStatus.published)
    _create_content(session, title="Doc B", status=ContentStatus.published)
    _create_content(session, title="Draft Doc", status=ContentStatus.draft)

    response = client.get("/content")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    titles = [item["title"] for item in body["items"]]
    assert "Draft Doc" not in titles

    app.dependency_overrides.pop(get_current_user, None)


def test_list_content_filters_and_search(client: TestClient, session):
    user = _create_user(session)
    app.dependency_overrides[get_current_user] = lambda: session.get(User, user.id)

    marketing = Category(name="Marketing")
    sales = Category(name="Sales")
    session.add_all([marketing, sales])
    session.commit()
    session.refresh(marketing)
    session.refresh(sales)

    _create_content(session, title="Marketing Playbook", status=ContentStatus.published, category=marketing)
    _create_content(session, title="Sales Deck", status=ContentStatus.published, category=sales)

    response = client.get("/content", params={"category_id": str(marketing.id)})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "Marketing Playbook"

    response = client.get("/content", params={"search": "sales"})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "Sales Deck"

    app.dependency_overrides.pop(get_current_user, None)


def test_content_detail_and_download(client: TestClient, session):
    user = _create_user(session)
    app.dependency_overrides[get_current_user] = lambda: session.get(User, user.id)

    content = _create_content(session, title="Reference Guide", status=ContentStatus.published)

    detail = client.get(f"/content/{content.id}")
    assert detail.status_code == 200
    assert detail.json()["title"] == "Reference Guide"

    download = client.post(f"/content/{content.id}/download")
    assert download.status_code == 200
    token = download.json()["token"]

    settings = get_settings()
    decoded = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    assert decoded["sub"] == str(content.id)
    assert decoded["actor"] == str(user.id)
    assert decoded["type"] == "download"

    audit_entries = session.query(AuditLog).filter(AuditLog.action_type == "content.download.request").all()
    assert len(audit_entries) == 1

    app.dependency_overrides.pop(get_current_user, None)


def test_unpublished_content_not_accessible(client: TestClient, session):
    user = _create_user(session)
    app.dependency_overrides[get_current_user] = lambda: session.get(User, user.id)

    content = _create_content(session, title="Draft Only", status=ContentStatus.draft)

    response = client.get(f"/content/{content.id}")
    assert response.status_code == 404

    response = client.post(f"/content/{content.id}/download")
    assert response.status_code == 404

    app.dependency_overrides.pop(get_current_user, None)


def test_like_and_unlike_content(client: TestClient, session):
    user = _create_user(session)
    app.dependency_overrides[get_current_user] = lambda: session.get(User, user.id)

    content = _create_content(session, title="Likeable", status=ContentStatus.published)

    like_response = client.post(f"/content/{content.id}/likes")
    assert like_response.status_code == 201
    like_body = like_response.json()
    assert like_body["content_id"] == str(content.id)

    likes = session.query(Like).filter(Like.content_id == content.id).all()
    assert len(likes) == 1

    unlike_response = client.delete(f"/content/{content.id}/likes")
    assert unlike_response.status_code == 204
    assert session.query(Like).filter(Like.content_id == content.id).count() == 0

    like_logs = (
        session.query(AuditLog)
        .filter(AuditLog.action_type.in_(["content.like", "content.unlike"]))
        .all()
    )
    assert len(like_logs) == 2

    app.dependency_overrides.pop(get_current_user, None)


def test_comment_lifecycle(client: TestClient, session):
    user = _create_user(session)
    app.dependency_overrides[get_current_user] = lambda: session.get(User, user.id)

    content = _create_content(session, title="Commentable", status=ContentStatus.published)

    create_response = client.post(
        f"/content/{content.id}/comments",
        json={"body": "<b>Hello</b> world"},
    )
    assert create_response.status_code == 201
    comment_id = create_response.json()["id"]
    assert create_response.json()["body"] == "Hello world"

    list_response = client.get(f"/content/{content.id}/comments")
    assert list_response.status_code == 200
    assert len(list_response.json()["items"]) == 1

    update_response = client.patch(
        f"/content/comments/{comment_id}",
        json={"body": "Updated"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["body"] == "Updated"

    delete_response = client.delete(f"/content/comments/{comment_id}")
    assert delete_response.status_code == 204
    comment_uuid = UUID(comment_id)
    assert (
        session.query(Comment)
        .filter(Comment.id == comment_uuid, Comment.status == CommentStatus.deleted.value)
        .count()
    ) == 1

    audit_actions = session.query(AuditLog).filter(AuditLog.action_type.like("content.comment%"))
    assert audit_actions.count() == 3

    app.dependency_overrides.pop(get_current_user, None)
