from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Query, status
from sqlalchemy.orm import Session

from ...dependencies import get_current_admin, get_db
from ...models.content import ContentItem, ContentStatus
from ...models.user import User
from ...schemas.audit import AuditLogActor, AuditLogEntry, AuditLogListResponse
from ...schemas.content import (
    AdminContentListResponse,
    AdminContentResponse,
    ContentUpdateRequest,
    ContentUpdateResponse,
)
from ...services.audit_service import list_logs as list_audit_logs
from ...services.content_service import ContentService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/content", response_model=AdminContentListResponse)
def list_content(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> AdminContentListResponse:
    items = db.query(ContentItem).order_by(ContentItem.created_at.desc()).all()
    return AdminContentListResponse(items=items)


@router.post("/content", response_model=AdminContentResponse, status_code=status.HTTP_201_CREATED)
async def create_content(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    status_value: str = Form(ContentStatus.draft.value),
    category_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> AdminContentResponse:
    title = title.strip()
    if not title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Title is required"
        )

    try:
        status_enum = ContentStatus(status_value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status"
        ) from exc

    try:
        category_uuid = UUID(category_id) if category_id else None
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category id"
        ) from exc
    file_bytes = await file.read()

    try:
        content = ContentService.create_content(
            db,
            title=title,
            description=description,
            category_id=category_uuid,
            status=status_enum,
            file_bytes=file_bytes,
            content_type=file.content_type or "",
            owner=admin,
        )
    except ValueError as exc:
        message = str(exc)
        if message == "unsupported_file_type":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type"
            ) from exc
        if message == "file_too_large":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds 200MB limit"
            ) from exc
        if message == "category_not_found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
            ) from exc
        raise

    return AdminContentResponse.model_validate(content)


@router.patch("/content/{content_id}", response_model=ContentUpdateResponse)
def update_content(
    content_id: UUID,
    payload: ContentUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> ContentUpdateResponse:
    content = db.get(ContentItem, content_id)
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

    status_enum = payload.status

    try:
        updated = ContentService.update_content(
            db,
            content=content,
            actor=admin,
            title=payload.title,
            description=payload.description,
            category_id=payload.category_id,
            status=status_enum,
        )
    except ValueError as exc:
        message = str(exc)
        if message == "category_not_found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
            ) from exc
        raise

    return ContentUpdateResponse.model_validate(updated)


@router.patch("/content/{content_id}/archive", response_model=AdminContentResponse)
def archive_content(
    content_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> AdminContentResponse:
    content = db.get(ContentItem, content_id)
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

    archived = ContentService.archive_content(db, content=content, actor=admin)
    return AdminContentResponse.model_validate(archived)


@router.get("/audit/logs", response_model=AuditLogListResponse)
def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    action_type: Optional[str] = None,
    start_at: Optional[datetime] = None,
    end_at: Optional[datetime] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> AuditLogListResponse:
    logs, total = list_audit_logs(
        db,
        page=page,
        page_size=page_size,
        action_type=action_type,
        start_at=start_at,
        end_at=end_at,
    )

    items = [
        AuditLogEntry(
            id=str(log.id),
            action_type=log.action_type,
            target_type=log.target_type,
            target_id=log.target_id,
            metadata=log.metadata_json,
            created_at=log.created_at,
            actor=(
                AuditLogActor(
                    id=str(log.actor.id) if log.actor else None,
                    email=log.actor.email if log.actor else None,
                    first_name=log.actor.first_name if log.actor else None,
                    last_name=log.actor.last_name if log.actor else None,
                )
                if log.actor
                else None
            ),
        )
        for log in logs
    ]

    return AuditLogListResponse(items=items, page=page, page_size=page_size, total=total)
