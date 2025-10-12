from __future__ import annotations

from datetime import datetime
import uuid
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255))
    interests: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    avatar_path: Mapped[Optional[str]] = mapped_column(String(512))
    last_completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="profile")
