from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models.password_reset import PasswordResetToken
from ..models.session import UserSession
from ..models.user import User, UserStatus
from ..services.audit_service import log_action
from ..services.notification_service import (
    send_account_verified_email,
    send_password_reset_email,
)
from ..security import (
    TokenError,
    create_access_token,
    create_password_reset_token,
    create_verification_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
    verify_token_hash,
    create_refresh_token,
)


class AuthService:
    @staticmethod
    def register_user(
        db: Session,
        *,
        email: str,
        first_name: str,
        last_name: str,
        password: str,
        actor_id: Optional[str] = None,
    ) -> User:
        existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if existing:
            raise ValueError("email_already_registered")

        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            password_hash=hash_password(password),
            status=UserStatus.pending.value,
        )
        db.add(user)
        db.flush()  # so user.id is available for audit

        actor_uuid: Optional[UUID] = None
        if actor_id:
            actor_uuid = UUID(str(actor_id))

        log_action(
            db,
            actor_id=actor_uuid,
            action_type="auth.register",
            target_type="user",
            target_id=str(user.id),
            metadata={"email": email},
        )

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def generate_verification_token(user: User) -> str:
        return create_verification_token(str(user.id))

    @staticmethod
    def verify_user(db: Session, token: str) -> tuple[User, bool]:
        try:
            payload = decode_token(token, purpose="verify")
        except TokenError as exc:
            raise ValueError("invalid_token") from exc

        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("invalid_token")

        try:
            user_uuid = UUID(str(user_id))
        except ValueError as exc:
            raise ValueError("invalid_token") from exc

        user = db.get(User, user_uuid)
        if not user:
            raise ValueError("user_not_found")

        activated = False

        if user.status != UserStatus.active.value:
            user.status = UserStatus.active.value
            db.add(user)
            log_action(
                db,
                actor_id=user.id,
                action_type="auth.verify_email",
                target_type="user",
                target_id=str(user.id),
                metadata={"verification": "success"},
            )
            db.commit()
            db.refresh(user)
            activated = True
            send_account_verified_email(user)

        return user, activated

    @staticmethod
    def login(
        db: Session,
        *,
        email: str,
        password: str,
        device_info: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> tuple[User, str, str, UserSession]:
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if not user or not verify_password(password, user.password_hash):
            raise ValueError("invalid_credentials")

        if user.status != UserStatus.active.value:
            raise ValueError("user_not_active")

        settings = get_settings()
        session_id = uuid4()
        refresh_token = create_refresh_token(str(user.id), session_id=str(session_id))
        refresh_token_hash = hash_token(refresh_token)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expiry_days)

        session = UserSession(
            id=session_id,
            user_id=user.id,
            refresh_token_hash=refresh_token_hash,
            expires_at=expires_at,
            device_info=device_info,
            ip_address=ip_address,
        )
        db.add(session)

        log_action(
            db,
            actor_id=user.id,
            action_type="auth.login",
            target_type="session",
            target_id=str(session_id),
            metadata={"email": email},
        )

        access_token = create_access_token(str(user.id), extra_claims={"sid": str(session_id)})
        db.commit()
        db.refresh(user)
        db.refresh(session)
        return user, access_token, refresh_token, session

    @staticmethod
    def refresh(db: Session, *, refresh_token: str) -> tuple[User, str, str, UserSession]:
        try:
            payload = decode_token(refresh_token, purpose="refresh")
        except TokenError as exc:
            raise ValueError("invalid_token") from exc

        user_id = payload.get("sub")
        session_id = payload.get("sid")

        if not user_id or not session_id:
            raise ValueError("invalid_token")

        try:
            user_uuid = UUID(str(user_id))
            session_uuid = UUID(str(session_id))
        except ValueError as exc:
            raise ValueError("invalid_token") from exc

        session = db.get(UserSession, session_uuid)
        if not session or session.user_id != user_uuid:
            raise ValueError("session_not_found")

        expires_at = session.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
            session.expires_at = expires_at

        if expires_at <= datetime.now(timezone.utc):
            db.delete(session)
            db.commit()
            raise ValueError("session_expired")

        if not verify_token_hash(refresh_token, session.refresh_token_hash):
            db.delete(session)
            db.commit()
            raise ValueError("invalid_token")

        user = db.get(User, user_uuid)
        if not user:
            db.delete(session)
            db.commit()
            raise ValueError("user_not_found")

        if user.status != UserStatus.active.value:
            raise ValueError("user_not_active")

        settings = get_settings()
        new_refresh_token = create_refresh_token(str(user.id), session_id=str(session.id))
        session.refresh_token_hash = hash_token(new_refresh_token)
        session.expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.refresh_token_expiry_days
        )

        log_action(
            db,
            actor_id=user.id,
            action_type="auth.refresh",
            target_type="session",
            target_id=str(session.id),
        )

        access_token = create_access_token(str(user.id), extra_claims={"sid": str(session.id)})
        db.add(session)
        db.commit()
        db.refresh(session)

        return user, access_token, new_refresh_token, session

    @staticmethod
    def logout(db: Session, *, refresh_token: str) -> None:
        try:
            payload = decode_token(refresh_token, purpose="refresh")
        except TokenError as exc:
            raise ValueError("invalid_token") from exc

        session_id = payload.get("sid")
        user_id = payload.get("sub")

        if not session_id or not user_id:
            raise ValueError("invalid_token")

        try:
            session_uuid = UUID(str(session_id))
        except ValueError as exc:
            raise ValueError("invalid_token") from exc

        session = db.get(UserSession, session_uuid)
        if not session:
            return

        if not verify_token_hash(refresh_token, session.refresh_token_hash):
            db.delete(session)
            db.commit()
            raise ValueError("invalid_token")

        actor_id = session.user_id
        db.delete(session)

        log_action(
            db,
            actor_id=actor_id,
            action_type="auth.logout",
            target_type="session",
            target_id=str(session_uuid),
        )
        db.commit()

    @staticmethod
    def request_password_reset(
        db: Session,
        *,
        email: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Optional[str]:
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if not user:
            return None

        settings = get_settings()
        now = datetime.now(timezone.utc)

        # Clean up expired tokens for this user
        for existing in db.scalars(
            select(PasswordResetToken).where(PasswordResetToken.user_id == user.id)
        ):
            expires_at = existing.expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
                existing.expires_at = expires_at
            if existing.used_at is not None or expires_at <= now:
                db.delete(existing)

        token, token_id = create_password_reset_token(str(user.id))
        reset_entry = PasswordResetToken(
            user_id=user.id,
            token_id=token_id,
            token_hash=hash_token(token),
            expires_at=now + timedelta(minutes=settings.password_reset_token_expiry_minutes),
        )
        db.add(reset_entry)

        log_action(
            db,
            actor_id=user.id,
            action_type="auth.password_reset.request",
            target_type="user",
            target_id=str(user.id),
            metadata={
                "email": email,
                "ip": ip_address,
                "user_agent": user_agent,
            },
        )

        db.commit()
        send_password_reset_email(user.email, token)
        return token

    @staticmethod
    def reset_password(db: Session, *, token: str, new_password: str) -> User:
        try:
            payload = decode_token(token, purpose="reset")
        except TokenError as exc:
            raise ValueError("invalid_token") from exc

        user_id = payload.get("sub")
        token_id = payload.get("jti")
        if not user_id or not token_id:
            raise ValueError("invalid_token")

        try:
            user_uuid = UUID(str(user_id))
        except ValueError as exc:
            raise ValueError("invalid_token") from exc

        reset_entry = db.execute(
            select(PasswordResetToken).where(PasswordResetToken.token_id == str(token_id))
        ).scalar_one_or_none()
        if not reset_entry:
            raise ValueError("token_not_found")

        if reset_entry.used_at is not None:
            raise ValueError("token_used")

        if reset_entry.user_id != user_uuid:
            raise ValueError("invalid_token")

        expires_at = reset_entry.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
            reset_entry.expires_at = expires_at

        now = datetime.now(timezone.utc)
        if expires_at <= now:
            reset_entry.used_at = now
            db.add(reset_entry)
            db.commit()
            raise ValueError("token_expired")

        if not verify_token_hash(token, reset_entry.token_hash):
            reset_entry.used_at = now
            db.add(reset_entry)
            db.commit()
            raise ValueError("invalid_token")

        user = db.get(User, user_uuid)
        if not user:
            reset_entry.used_at = now
            db.add(reset_entry)
            db.commit()
            raise ValueError("user_not_found")

        user.password_hash = hash_password(new_password)
        reset_entry.used_at = now
        db.add_all([user, reset_entry])

        log_action(
            db,
            actor_id=user.id,
            action_type="auth.password_reset.complete",
            target_type="user",
            target_id=str(user.id),
        )

        db.commit()
        db.refresh(user)

        # Invalidate other outstanding tokens for the user
        for remaining in db.scalars(
            select(PasswordResetToken).where(PasswordResetToken.user_id == user.id)
        ):
            if remaining.used_at is None and remaining.id != reset_entry.id:
                db.delete(remaining)
        db.commit()

        return user
