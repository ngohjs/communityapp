from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class AuditLogActor(BaseModel):
    id: Optional[str]
    email: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]


class AuditLogEntry(BaseModel):
    id: str
    action_type: str
    target_type: str
    target_id: Optional[str]
    metadata: Optional[dict[str, Any]]
    created_at: datetime
    actor: Optional[AuditLogActor]


class AuditLogListResponse(BaseModel):
    items: list[AuditLogEntry]
    page: int
    page_size: int
    total: int
