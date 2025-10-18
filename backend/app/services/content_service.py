from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from ..config import get_settings
from ..models.category import Category
from ..models.content import ContentItem, ContentStatus
from ..models.user import User
from ..services.audit_service import log_action
from ..services.notification_service import broadcast_content_published
from ..utils.files import remove_file, save_content_file

ALLOWED_CONTENT_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "image/png": "png",
    "image/jpeg": "jpg",
    "video/mp4": "mp4",
}


class ContentService:
    @staticmethod
    def create_content(
        db: Session,
        *,
        title: str,
        description: Optional[str],
        category_id: Optional[UUID],
        status: ContentStatus,
        file_bytes: bytes,
        content_type: str,
        owner: User,
    ) -> ContentItem:
        ContentService._validate_file_size(file_bytes)
        extension = ContentService._ensure_allowed_type(content_type)
        category_uuid = ContentService._validate_category(db, category_id) if category_id else None

        filename, saved_path, file_size = save_content_file(file_bytes, extension)
        settings = get_settings()
        relative_path = f"{settings.content_subdir}/{filename}"

        content = ContentItem(
            title=title,
            description=description,
            category_id=category_uuid,
            status=status.value,
            file_path=relative_path,
            file_type=extension,
            file_size=file_size,
            owner_id=owner.id,
            published_at=datetime.now(timezone.utc) if status == ContentStatus.published else None,
        )
        db.add(content)

        log_action(
            db,
            actor_id=owner.id,
            action_type="content.create",
            target_type="content_item",
            target_id=str(content.id),
            metadata={"title": title, "file": relative_path},
        )

        db.commit()
        db.refresh(content)

        if status == ContentStatus.published:
            broadcast_content_published(db, content=content, actor_id=owner.id)
        return content

    @staticmethod
    def update_content(
        db: Session,
        *,
        content: ContentItem,
        actor: User,
        title: Optional[str] = None,
        description: Optional[str] = None,
        category_id: Optional[UUID] = None,
        status: Optional[ContentStatus] = None,
    ) -> ContentItem:
        updates: dict[str, object] = {}
        original_status = ContentStatus(content.status)
        publish_now = False

        if title is not None:
            content.title = title
            updates["title"] = title
        if description is not None:
            content.description = description
            updates["description"] = description
        if category_id is not None:
            category_uuid = ContentService._validate_category(db, category_id)
            content.category_id = category_uuid
            updates["category_id"] = str(category_uuid) if category_uuid else None
        if status is not None:
            content.status = status.value
            if status == ContentStatus.published and content.published_at is None:
                content.published_at = datetime.now(timezone.utc)
            if status == ContentStatus.draft:
                content.published_at = None
            publish_now = status == ContentStatus.published and original_status != ContentStatus.published
            updates["status"] = status.value

        if updates:
            db.add(content)
            log_action(
                db,
                actor_id=actor.id,
                action_type="content.update",
                target_type="content_item",
                target_id=str(content.id),
                metadata=updates,
            )
            db.commit()
            db.refresh(content)

            if publish_now:
                broadcast_content_published(db, content=content, actor_id=actor.id)

        return content

    @staticmethod
    def archive_content(db: Session, *, content: ContentItem, actor: User) -> ContentItem:
        return ContentService.update_content(
            db,
            content=content,
            actor=actor,
            status=ContentStatus.archived,
        )

    @staticmethod
    def remove_content_file(relative_path: str) -> None:
        settings = get_settings()
        absolute_path = Path(settings.media_root) / relative_path
        remove_file(absolute_path)

    @staticmethod
    def _ensure_allowed_type(content_type: str) -> str:
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise ValueError("unsupported_file_type")
        return ALLOWED_CONTENT_TYPES[content_type]

    @staticmethod
    def _validate_file_size(file_bytes: bytes) -> None:
        settings = get_settings()
        limit = settings.content_max_file_size_mb * 1024 * 1024
        if len(file_bytes) > limit:
            raise ValueError("file_too_large")

    @staticmethod
    def _validate_category(db: Session, category_id: UUID) -> Optional[UUID]:
        if category_id is None:
            return None
        category = db.get(Category, category_id)
        if not category:
            raise ValueError("category_not_found")
        return category.id
