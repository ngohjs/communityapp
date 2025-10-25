from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import FileResponse
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from ...dependencies import get_current_user, get_db
from ...config import get_settings
from ...models.comment import Comment, CommentStatus
from ...models.content import ContentItem, ContentStatus
from ...models.category import Category
from ...models.like import Like
from ...models.user import User
from ...schemas.content import (
    ContentCategoryListResponse,
    ContentCategoryResponse,
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
from ...services.download_service import decode_download_token, generate_download_token
from ...services.like_service import add_like, remove_like

EXTENSION_CONTENT_TYPES = {
    "pdf": "application/pdf",
    "ppt": "application/vnd.ms-powerpoint",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "png": "image/png",
    "jpg": "image/jpeg",
    "mp4": "video/mp4",
}


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
    content_type: Optional[str] = Query(None),
    uploaded_after: Optional[datetime] = Query(None),
    uploaded_before: Optional[datetime] = Query(None),
) -> MemberContentListResponse:
    filters = [ContentItem.status == ContentStatus.published.value]

    if category_id:
        filters.append(ContentItem.category_id == category_id)

    if search:
        ilike = f"%{search}%"
        filters.append(ContentItem.title.ilike(ilike) | ContentItem.description.ilike(ilike))

    if content_type:
        filters.append(ContentItem.file_type == content_type.lower())

    if uploaded_after:
        filters.append(ContentItem.created_at >= uploaded_after)

    if uploaded_before:
        filters.append(ContentItem.created_at <= uploaded_before)

    likes_subq = (
        db.query(Like.content_id.label("content_id"), func.count(Like.id).label("likes_count"))
        .group_by(Like.content_id)
        .subquery()
    )
    comments_subq = (
        db.query(
            Comment.content_id.label("content_id"),
            func.count(Comment.id).label("comments_count"),
        )
        .filter(Comment.status == CommentStatus.active.value)
        .group_by(Comment.content_id)
        .subquery()
    )

    query = (
        db.query(
            ContentItem,
            func.coalesce(likes_subq.c.likes_count, 0).label("likes_count"),
            func.coalesce(comments_subq.c.comments_count, 0).label("comments_count"),
            Category.name.label("category_name"),
        )
        .filter(*filters)
        .outerjoin(likes_subq, ContentItem.id == likes_subq.c.content_id)
        .outerjoin(comments_subq, ContentItem.id == comments_subq.c.content_id)
        .outerjoin(Category, ContentItem.category_id == Category.id)
    )

    base_total_query = db.query(func.count(ContentItem.id)).filter(*filters)
    total = base_total_query.scalar()
    records = (
        query.order_by(desc(ContentItem.published_at), desc(ContentItem.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return MemberContentListResponse(
        items=[
            MemberContentResponse(
                id=content.id,
                title=content.title,
                description=content.description,
                file_type=content.file_type,
                file_size=content.file_size,
                category_id=content.category_id,
                category_name=category_name,
                published_at=content.published_at,
                created_at=content.created_at,
                updated_at=content.updated_at,
                owner_id=content.owner_id,
                likes_count=likes_count,
                comments_count=comments_count,
            )
            for content, likes_count, comments_count, category_name in records
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/categories", response_model=ContentCategoryListResponse)
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ContentCategoryListResponse:
    categories = db.query(Category).order_by(Category.name.asc()).all()
    return ContentCategoryListResponse(
        items=[ContentCategoryResponse.model_validate(category) for category in categories]
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
    liked_by_me = (
        db.query(Like)
        .filter(Like.content_id == content.id, Like.user_id == current_user.id)
        .first()
        is not None
    )
    category_name = content.category.name if content.category else None
    owner_name = None
    if content.owner:
        owner_name = " ".join(
            filter(None, [content.owner.first_name, content.owner.last_name])
        ).strip()
        if not owner_name:
            owner_name = content.owner.email

    return MemberContentDetailResponse(
        id=content.id,
        title=content.title,
        description=content.description,
        file_type=content.file_type,
        file_size=content.file_size,
        category_id=content.category_id,
        category_name=category_name,
        published_at=content.published_at,
        created_at=content.created_at,
        updated_at=content.updated_at,
        owner_id=content.owner_id,
        status=ContentStatus(content.status),
        likes_count=likes_count,
        comments_count=comments_count,
        liked_by_me=liked_by_me,
        owner_name=owner_name,
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


@router.get("/{content_id}/download")
def stream_download(content_id: UUID, token: str = Query(...), db: Session = Depends(get_db)) -> FileResponse:
    try:
        payload = decode_download_token(token)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid download token") from exc

    if payload.get("sub") != str(content_id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Token does not match content")

    content = _get_published_content_or_404(db, content_id)

    settings = get_settings()
    file_path = Path(settings.media_root) / content.file_path
    if not file_path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="File not found")

    media_type = EXTENSION_CONTENT_TYPES.get(content.file_type.lower(), "application/octet-stream")
    filename = Path(content.file_path).name
    return FileResponse(file_path, media_type=media_type, filename=filename)


@router.post(
    "/{content_id}/likes", response_model=LikeResponse, status_code=status.HTTP_201_CREATED
)
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


@router.post(
    "/{content_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED
)
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
