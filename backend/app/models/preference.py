from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class PrivacyLevel(str, Enum):
    private = "private"
    community = "community"
    admin = "admin"


class UserPreference(Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    privacy_level: Mapped[str] = mapped_column(
        String(32), nullable=False, default=PrivacyLevel.private.value
    )
    notify_content: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_community: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_account: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="preferences")
