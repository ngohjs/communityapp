from __future__ import annotations

import bcrypt
from dotenv import load_dotenv
from sqlalchemy import select

from backend.app.config import get_settings
from backend.app.database import session_scope
from backend.app.models import (
    Category,
    User,
    UserPreference,
    UserProfile,
    UserStatus,
)
from backend.app.models.preference import PrivacyLevel


def seed_categories(session) -> None:
    settings = get_settings()
    existing = {
        name for (name,) in session.execute(select(Category.name))
    }
    for name in settings.seed_categories:
        if name not in existing:
            session.add(Category(name=name))


def seed_super_admin(session) -> None:
    settings = get_settings()

    user = session.execute(
        select(User).where(User.email == settings.seed_admin_email)
    ).scalar_one_or_none()

    if user:
        return

    password_hash = bcrypt.hashpw(
        settings.seed_admin_password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    user = User(
        email=settings.seed_admin_email,
        first_name=settings.seed_admin_first_name,
        last_name=settings.seed_admin_last_name,
        password_hash=password_hash,
        status=UserStatus.active.value,
    )
    session.add(user)
    session.flush()

    session.add(
        UserProfile(
            user_id=user.id,
            bio="Community super administrator.",
        )
    )
    session.add(
        UserPreference(
            user_id=user.id,
            privacy_level=PrivacyLevel.admin.value,
            notify_account=True,
            notify_content=True,
            notify_community=True,
        )
    )


def main() -> None:
    load_dotenv()
    with session_scope() as session:
        seed_categories(session)
        seed_super_admin(session)
    print("Development seed completed.")


if __name__ == "__main__":
    main()
