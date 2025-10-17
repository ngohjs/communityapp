from __future__ import annotations

from datetime import datetime, timedelta

import backend.app.models  # noqa: F401 - ensure models are imported for metadata
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.config import get_settings
from backend.app.utils.rate_limiter import reset_auth_rate_limiter


PASSWORD_RESET_LOGGER = "backend.app.services.notification_service"


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
    reset_auth_rate_limiter()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    session = TestingSessionLocal()

    def override_get_db():
        try:
            yield session
        finally:
            session.rollback()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client

    session.close()
    app.dependency_overrides.clear()


def test_register_and_verify_flow(client: TestClient):
    payload = {
        "email": "user@example.com",
        "first_name": "User",
        "last_name": "Example",
        "password": "Password123!",
    }

    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending"
    assert "verification_token" in body

    token = body["verification_token"]

    verify_response = client.get("/auth/verify", params={"token": token})
    assert verify_response.status_code == 200
    verify_body = verify_response.json()
    assert verify_body["status"] == "active"
    assert verify_body["verified"] is True

    second_verify = client.get("/auth/verify", params={"token": token})
    assert second_verify.status_code == 200
    assert second_verify.json()["verified"] is False


def test_register_duplicate_email(client: TestClient):
    payload = {
        "email": "dupe@example.com",
        "first_name": "Dupe",
        "last_name": "Example",
        "password": "Password123!",
    }

    first = client.post("/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/auth/register", json=payload)
    assert second.status_code == 400
    assert second.json()["detail"] == "Email already registered"


def test_verify_invalid_token(client: TestClient):
    response = client.get("/auth/verify", params={"token": "invalid"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired token"


def _bootstrap_active_user(client: TestClient, email: str, password: str = "Password123!") -> None:
    payload = {
        "email": email,
        "first_name": "Active",
        "last_name": "User",
        "password": password,
    }

    register = client.post("/auth/register", json=payload)
    token = register.json()["verification_token"]
    client.get("/auth/verify", params={"token": token})


def test_login_refresh_logout_flow(client: TestClient):
    settings = get_settings()
    email = "login@example.com"
    password = "Password123!"
    _bootstrap_active_user(client, email, password)

    login_response = client.post("/auth/login", json={"email": email, "password": password})
    assert login_response.status_code == 200
    login_body = login_response.json()
    assert login_body["access_token"]
    assert login_body["user"]["email"] == email
    assert login_body["user"]["status"] == "active"

    refresh_cookie = client.cookies.get(settings.refresh_token_cookie_name)
    assert refresh_cookie is not None

    refresh_response = client.post("/auth/refresh")
    assert refresh_response.status_code == 200
    refresh_body = refresh_response.json()
    assert refresh_body["access_token"] != login_body["access_token"]
    new_cookie = client.cookies.get(settings.refresh_token_cookie_name)
    assert new_cookie is not None
    assert new_cookie != refresh_cookie

    logout_response = client.post("/auth/logout")
    assert logout_response.status_code == 204
    assert client.cookies.get(settings.refresh_token_cookie_name) is None


def test_login_requires_active_user(client: TestClient):
    email = "pending@example.com"
    payload = {
        "email": email,
        "first_name": "Pending",
        "last_name": "User",
        "password": "Password123!",
    }

    client.post("/auth/register", json=payload)

    response = client.post("/auth/login", json={"email": email, "password": "Password123!"})
    assert response.status_code == 403
    assert response.json()["detail"] == "Account not active"


def test_login_invalid_credentials(client: TestClient):
    _bootstrap_active_user(client, "auth@example.com")

    response = client.post(
        "/auth/login",
        json={"email": "auth@example.com", "password": "WrongPass123!"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_refresh_requires_cookie(client: TestClient):
    response = client.post("/auth/refresh")
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing refresh token"


def _extract_reset_token(caplog) -> str:
    for record in caplog.records:
        token = getattr(record, "token", None)
        if token:
            return token
    raise AssertionError("Password reset token not logged")


def test_forgot_password_and_reset_flow(client: TestClient, caplog):
    settings = get_settings()
    email = "reset@example.com"
    password = "Password123!"
    new_password = "NewPass456!"
    _bootstrap_active_user(client, email, password)

    with caplog.at_level("INFO", logger=PASSWORD_RESET_LOGGER):
        response = client.post("/auth/forgot-password", json={"email": email})
    assert response.status_code == 202
    assert "reset link" in response.json()["message"].lower()

    token = _extract_reset_token(caplog)
    caplog.clear()

    reset_response = client.post(
        "/auth/reset-password",
        json={"token": token, "new_password": new_password},
    )
    assert reset_response.status_code == 200
    assert "reset" in reset_response.json()["message"].lower()

    # Old password should no longer work
    old_login = client.post("/auth/login", json={"email": email, "password": password})
    assert old_login.status_code == 401

    # New password succeeds
    new_login = client.post(
        "/auth/login", json={"email": email, "password": new_password}
    )
    assert new_login.status_code == 200
    assert new_login.json()["user"]["email"] == email

    # Refresh token cookie set during login
    assert client.cookies.get(settings.refresh_token_cookie_name) is not None


def test_forgot_password_nonexistent_email_is_accepted(client: TestClient, caplog):
    with caplog.at_level("INFO", logger=PASSWORD_RESET_LOGGER):
        response = client.post("/auth/forgot-password", json={"email": "missing@example.com"})
    assert response.status_code == 202
    # No token should be logged because user does not exist
    assert not caplog.records


def test_reset_password_with_invalid_token(client: TestClient):
    response = client.post(
        "/auth/reset-password",
        json={"token": "invalid", "new_password": "Password123!"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired token"


def test_login_rate_limit_exceeded(client: TestClient):
    settings = get_settings()
    email = "throttle@example.com"
    _bootstrap_active_user(client, email)

    for _ in range(settings.auth_rate_limit_attempts):
        response = client.post(
            "/auth/login",
            json={"email": email, "password": "WrongPassword123!"},
        )
        assert response.status_code == 401

    blocked = client.post(
        "/auth/login",
        json={"email": email, "password": "WrongPassword123!"},
    )
    assert blocked.status_code == 429
    assert blocked.json()["detail"].startswith("Too many requests")
