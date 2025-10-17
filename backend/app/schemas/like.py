from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class LikeResponse(BaseModel):
    id: UUID
    content_id: UUID
    user_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
