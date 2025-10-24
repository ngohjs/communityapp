from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from ..models.comment import CommentStatus


class CommentCreateRequest(BaseModel):
    body: str = Field(..., min_length=1, max_length=1000)


class CommentUpdateRequest(BaseModel):
    body: str = Field(..., min_length=1, max_length=1000)


class CommentResponse(BaseModel):
    id: UUID
    content_id: UUID
    author_id: Optional[UUID]
    body: str
    status: CommentStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CommentListResponse(BaseModel):
    items: List[CommentResponse]
