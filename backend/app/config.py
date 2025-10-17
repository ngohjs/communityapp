from __future__ import annotations

from functools import lru_cache
from typing import List, Literal, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "Community App API"
    description: str = "API for the Community App"
    version: str = "0.1.0"
    environment: str = Field(default="development", description="Current runtime environment")
    debug: bool = Field(default=True, description="Enable FastAPI debug mode")

    database_url: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/community_app",
        description="SQLAlchemy database URL",
    )

    # Security / auth defaults (placeholders for future subtasks)
    secret_key: str = Field(default="change-me", description="Secret key for signing tokens")
    access_token_expiry_minutes: int = Field(default=15, ge=5)
    refresh_token_expiry_days: int = Field(default=7, ge=1)
    verification_token_expiry_hours: int = Field(default=24, ge=1)
    password_reset_token_expiry_minutes: int = Field(default=30, ge=5)
    refresh_token_cookie_name: str = Field(default="community_refresh_token")
    refresh_token_cookie_path: str = Field(default="/auth")
    refresh_cookie_secure: bool = Field(default=False)
    refresh_cookie_samesite: Literal["lax", "strict", "none"] = Field(default="lax")
    refresh_cookie_domain: Optional[str] = Field(default=None)
    auth_rate_limit_attempts: int = Field(default=5, ge=1)
    auth_rate_limit_window_minutes: int = Field(default=15, ge=1)

    media_root: str = Field(default="storage", description="Root directory for uploaded media")
    avatar_subdir: str = Field(default="avatars", description="Subdirectory for avatar uploads")

    cors_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:5173"],
        description="Allowed CORS origins for the frontend application",
    )
    allowed_hosts: List[str] = Field(
        default_factory=lambda: ["*"],
        description="Hosts allowed to access the application",
    )

    seed_admin_email: str = Field(default="admin@example.com", description="Seed admin login email")
    seed_admin_first_name: str = Field(default="Super", description="Seed admin first name")
    seed_admin_last_name: str = Field(default="Admin", description="Seed admin last name")
    seed_admin_password: str = Field(
        default="ChangeMe123!",
        description="Seed admin password (plain text, used only for dev seeding)",
    )
    seed_categories: List[str] = Field(
        default_factory=lambda: [
            "Sales Playbooks",
            "Product Launch Kits",
            "Training & Enablement",
            "Case Studies",
        ],
        description="Default categories seeded in development",
    )

    @field_validator("cors_origins", "allowed_hosts", mode="before")
    @classmethod
    def split_comma_separated(cls, value: str | List[str]) -> List[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    """Return a cached instance of application settings."""
    return Settings()
