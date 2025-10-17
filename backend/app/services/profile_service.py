from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from pathlib import Path

from ..models.profile import UserProfile
from ..models.preference import PrivacyLevel, UserPreference
from ..models.user import User
from ..services.audit_service import log_action
from ..utils.files import remove_file, save_avatar


class ProfileService:
    @staticmethod
    def get_profile(db: Session, user: User) -> Optional[UserProfile]:
        profile = user.profile
        if profile:
            return profile

        return db.get(UserProfile, user.id)

    @staticmethod
    def update_profile(
        db: Session,
        *,
        user: User,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        phone: Optional[str] = None,
        bio: Optional[str] = None,
        location: Optional[str] = None,
        interests: Optional[List[str]] = None,
    ) -> UserProfile:
        profile = ProfileService._ensure_profile(db, user)
        preferences = ProfileService._ensure_preferences(db, user)

        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if phone is not None:
            ProfileService._assert_phone_unique(db, user.id, phone)
            user.phone = phone

        if bio is not None:
            profile.bio = bio
        if location is not None:
            profile.location = location
        if interests is not None:
            profile.interests = interests

        if user.first_name and user.last_name and not profile.last_completed_at:
            profile.last_completed_at = datetime.now(timezone.utc)

        db.add_all([user, profile, preferences])

        log_action(
            db,
            actor_id=user.id,
            action_type="profile.update",
            target_type="user_profile",
            target_id=str(user.id),
            metadata={
                "fields": [
                    field
                    for field, value in (
                        ("first_name", first_name),
                        ("last_name", last_name),
                        ("phone", phone),
                        ("bio", bio),
                        ("location", location),
                        ("interests", interests),
                    )
                    if value is not None
                ]
            },
        )

        db.commit()
        db.refresh(user)
        db.refresh(profile)
        return profile

    @staticmethod
    def update_avatar(
        db: Session,
        *,
        user: User,
        file_bytes: bytes,
        extension: str,
    ) -> UserProfile:
        profile = ProfileService._ensure_profile(db, user)
        preferences = ProfileService._ensure_preferences(db, user)
        old_path: Optional[Path] = None
        if profile.avatar_path:
            from ..config import get_settings

            settings = get_settings()
            old_path = Path(settings.media_root) / settings.avatar_subdir / profile.avatar_path

        filename, saved_path = save_avatar(file_bytes, extension)
        profile.avatar_path = filename
        db.add_all([profile, preferences])

        log_action(
            db,
            actor_id=user.id,
            action_type="profile.avatar.update",
            target_type="user_profile",
            target_id=str(user.id),
            metadata={"avatar_path": filename},
        )

        db.commit()
        db.refresh(profile)

        if old_path:
            remove_file(old_path)

        return profile

    @staticmethod
    def update_privacy(
        db: Session,
        *,
        user: User,
        privacy_level: PrivacyLevel,
    ) -> UserPreference:
        preferences = ProfileService._ensure_preferences(db, user)
        preferences.privacy_level = privacy_level.value
        db.add(preferences)

        log_action(
            db,
            actor_id=user.id,
            action_type="profile.privacy.update",
            target_type="user_preference",
            target_id=str(user.id),
            metadata={"privacy_level": privacy_level.value},
        )

        db.commit()
        db.refresh(preferences)
        return preferences

    @staticmethod
    def update_notification_preferences(
        db: Session,
        *,
        user: User,
        notify_content: Optional[bool] = None,
        notify_community: Optional[bool] = None,
        notify_account: Optional[bool] = None,
    ) -> UserPreference:
        preferences = ProfileService._ensure_preferences(db, user)

        updates = {}
        if notify_content is not None:
            preferences.notify_content = notify_content
            updates["notify_content"] = notify_content
        if notify_community is not None:
            preferences.notify_community = notify_community
            updates["notify_community"] = notify_community
        if notify_account is not None:
            preferences.notify_account = notify_account
            updates["notify_account"] = notify_account

        if updates:
            db.add(preferences)

            log_action(
                db,
                actor_id=user.id,
                action_type="profile.preferences.update",
                target_type="user_preference",
                target_id=str(user.id),
                metadata=updates,
            )

            db.commit()
            db.refresh(preferences)

        return preferences

    @staticmethod
    def _ensure_profile(db: Session, user: User) -> UserProfile:
        profile = user.profile
        if profile:
            return profile

        profile = db.get(UserProfile, user.id)
        if profile:
            user.profile = profile
            return profile

        profile = UserProfile(user_id=user.id)
        db.add(profile)
        db.flush()
        db.refresh(profile)
        user.profile = profile
        return profile

    @staticmethod
    def _ensure_preferences(db: Session, user: User) -> UserPreference:
        preferences = user.preferences
        if preferences:
            return preferences

        preferences = db.get(UserPreference, user.id)
        if preferences:
            user.preferences = preferences
            return preferences

        preferences = UserPreference(user_id=user.id, privacy_level=PrivacyLevel.private.value)
        db.add(preferences)
        db.flush()
        db.refresh(preferences)
        user.preferences = preferences
        return preferences

    @staticmethod
    def ensure_preferences(db: Session, user: User) -> UserPreference:
        return ProfileService._ensure_preferences(db, user)

    @staticmethod
    def _assert_phone_unique(db: Session, user_id: UUID, phone: str) -> None:
        if not phone:
            return
        existing = db.execute(
            select(User).where(User.phone == phone, User.id != user_id)
        ).scalar_one_or_none()
        if existing:
            raise ValueError("phone_in_use")
