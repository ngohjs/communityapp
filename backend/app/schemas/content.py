from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from ..models.content import ContentStatus


class AdminContentResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    status: ContentStatus
    file_type: str
    file_size: Optional[int]
    category_id: Optional[UUID]
    owner_id: Optional[UUID]
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    file_path: str = Field(description="Relative path to stored content file")

    model_config = {"from_attributes": True}


class AdminContentListResponse(BaseModel):
    items: List[AdminContentResponse]


class ContentUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    status: Optional[ContentStatus] = None


class ContentUpdateResponse(AdminContentResponse):
    message: str = "Content updated successfully"


class MemberContentResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    file_type: str
    file_size: Optional[int]
    category_id: Optional[UUID]
    published_at: Optional[datetime]
    created_at: datetime
    owner_id: Optional[UUID]
    updated_at: datetime
    likes_count: int
    comments_count: int

    model_config = {"from_attributes": True}


class MemberContentListResponse(BaseModel):
    items: List[MemberContentResponse]
    total: int
    page: int
    page_size: int


class MemberContentDetailResponse(MemberContentResponse):
    status: ContentStatus


class ContentDownloadResponse(BaseModel):
    token: str
    expires_in: int = 300


class ContentCategoryResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]

    model_config = {"from_attributes": True}


class ContentCategoryListResponse(BaseModel):
    items: List[ContentCategoryResponse]
