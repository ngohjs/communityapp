from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.like import Like
from ..models.content import ContentItem


def add_like(db: Session, *, content: ContentItem, user_id: UUID) -> Like:
    existing = db.execute(
        select(Like).where(Like.content_id == content.id, Like.user_id == user_id)
    ).scalar_one_or_none()
    if existing:
        return existing
    like = Like(content_id=content.id, user_id=user_id)
    db.add(like)
    db.commit()
    db.refresh(like)
    return like


def remove_like(db: Session, *, content: ContentItem, user_id: UUID) -> None:
    like = db.execute(
        select(Like).where(Like.content_id == content.id, Like.user_id == user_id)
    ).scalar_one_or_none()
    if not like:
        return
    db.delete(like)
    db.commit()
