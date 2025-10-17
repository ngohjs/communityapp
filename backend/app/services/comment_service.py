
from __future__ import annotations

from typing import Optional
from uuid import UUID

import bleach
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.comment import Comment, CommentStatus


def create_comment(
    db: Session,
    *,
    content_id: UUID,
    author_id: Optional[UUID],
    body: str,
) -> Comment:
    sanitized = _sanitize(body)
    comment = Comment(
        content_id=content_id,
        author_id=author_id,
        body=sanitized,
        status=CommentStatus.active.value,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def update_comment(
    db: Session,
    *,
    comment: Comment,
    body: str,
) -> Comment:
    comment.body = _sanitize(body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def delete_comment(db: Session, *, comment: Comment) -> Comment:
    comment.status = CommentStatus.deleted.value
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def _sanitize(body: str) -> str:
    return bleach.clean(body, tags=[], strip=True).strip()
