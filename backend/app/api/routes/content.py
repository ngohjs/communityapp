from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from ...dependencies import get_current_user, get_db
from ...models.comment import Comment, CommentStatus
from ...models.content import ContentItem, ContentStatus
from ...models.like import Like
from ...models.user import User
from ...schemas.content import (
    ContentDownloadResponse,
    MemberContentDetailResponse,
    MemberContentListResponse,
    MemberContentResponse,
)
from ...schemas.comment import (
    CommentCreateRequest,
    CommentListResponse,
    CommentResponse,
    CommentUpdateRequest,
)
from ...schemas.like import LikeResponse
from ...services.audit_service import log_action
from ...services.comment_service import create_comment, delete_comment, update_comment
from ...services.download_service import generate_download_token
from ...services.like_service import add_like, remove_like


router = APIRouter(prefix="/content", tags=["content"])


@router.get("", response_model=MemberContentListResponse)
def list_content(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    category_id: Optional[UUID] = Query(None),
    search: Optional[str] = Query(None),
) -> MemberContentListResponse:
    query = db.query(ContentItem).filter(ContentItem.status == ContentStatus.published.value)

    if category_id:
        query = query.filter(ContentItem.category_id == category_id)

    if search:
        ilike = f"%{search}%"
        query = query.filter(
            ContentItem.title.ilike(ilike) | ContentItem.description.ilike(ilike)
        )

    total = query.count()
    items = (
        query.order_by(desc(ContentItem.published_at), desc(ContentItem.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return MemberContentListResponse(
        items=[MemberContentResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{content_id}", response_model=MemberContentDetailResponse)
def get_content_detail(
    content_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MemberContentDetailResponse:
    content = _get_published_content_or_404(db, content_id)

    likes_count = db.query(Like).filter(Like.content_id == content.id).count()
    comments_count = (
        db.query(Comment)
        .filter(Comment.content_id == content.id, Comment.status == CommentStatus.active.value)
        .count()
    )

    return MemberContentDetailResponse(
        id=content.id,
        title=content.title,
        description=content.description,
        file_type=content.file_type,
        file_size=content.file_size,
        category_id=content.category_id,
        published_at=content.published_at,
        created_at=content.created_at,
        owner_id=content.owner_id,
        status=ContentStatus(content.status),
        likes_count=likes_count,
        comments_count=comments_count,
    )


@router.post("/{content_id}/download", response_model=ContentDownloadResponse)
def generate_download(
    content_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ContentDownloadResponse:
    content = _get_published_content_or_404(db, content_id)

    token = generate_download_token(content_id=content.id, actor_id=current_user.id)

    log_action(
        db,
        actor_id=current_user.id,
        action_type="content.download.request",
        target_type="content_item",
        target_id=str(content.id),
        metadata={"file_path": content.file_path},
    )
    db.commit()

    return ContentDownloadResponse(token=token)


@router.post("/{content_id}/likes", response_model=LikeResponse, status_code=status.HTTP_201_CREATED)
def like_content(
    content_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LikeResponse:
    content = _get_published_content_or_404(db, content_id)

    like = add_like(db, content=content, user_id=current_user.id)

    log_action(
        db,
        actor_id=current_user.id,
        action_type="content.like",
        target_type="content_item",
        target_id=str(content.id),
        metadata={},
    )
    db.commit()

    return LikeResponse.model_validate(like)


@router.delete(
    "/{content_id}/likes",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
)
def unlike_content(
    content_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    content = _get_published_content_or_404(db, content_id)

    remove_like(db, content=content, user_id=current_user.id)

    log_action(
        db,
        actor_id=current_user.id,
        action_type="content.unlike",
        target_type="content_item",
        target_id=str(content.id),
        metadata={},
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{content_id}/comments", response_model=CommentListResponse)
def list_comments(
    content_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommentListResponse:
    content = _get_published_content_or_404(db, content_id)

    comments = (
        db.query(Comment)
        .filter(Comment.content_id == content.id, Comment.status == CommentStatus.active.value)
        .order_by(Comment.created_at.asc())
        .all()
    )

    return CommentListResponse(items=[CommentResponse.model_validate(c) for c in comments])


@router.post("/{content_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment_endpoint(
    content_id: UUID,
    payload: CommentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommentResponse:
    content = _get_published_content_or_404(db, content_id)

    comment = create_comment(
        db,
        content_id=content.id,
        author_id=current_user.id,
        body=payload.body,
    )

    log_action(
        db,
        actor_id=current_user.id,
        action_type="content.comment.create",
        target_type="comment",
        target_id=str(comment.id),
        metadata={"content_id": str(content.id)},
    )
    db.commit()

    return CommentResponse.model_validate(comment)


@router.patch("/comments/{comment_id}", response_model=CommentResponse)
def update_comment_endpoint(
    comment_id: UUID,
    payload: CommentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommentResponse:
    comment = db.get(Comment, comment_id)
    if not comment or comment.status != CommentStatus.active.value:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your comment")

    updated = update_comment(db, comment=comment, body=payload.body)

    log_action(
        db,
        actor_id=current_user.id,
        action_type="content.comment.update",
        target_type="comment",
        target_id=str(comment.id),
        metadata={},
    )
    db.commit()

    return CommentResponse.model_validate(updated)


@router.delete(
    "/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    response_model=None,
)
def delete_comment_endpoint(
    comment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    comment = db.get(Comment, comment_id)
    if not comment or comment.status != CommentStatus.active.value:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your comment")

    delete_comment(db, comment=comment)

    log_action(
        db,
        actor_id=current_user.id,
        action_type="content.comment.delete",
        target_type="comment",
        target_id=str(comment.id),
        metadata={},
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _get_published_content_or_404(db: Session, content_id: UUID) -> ContentItem:
    content = db.get(ContentItem, content_id)
    if not content or content.status != ContentStatus.published.value:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
    return content
