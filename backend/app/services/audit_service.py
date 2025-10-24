from __future__ import annotations

from datetime import datetime
from typing import Any, Optional, Sequence

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..models.audit import AuditLog


def log_action(
    db: Session,
    *,
    actor_id: Optional[uuid.UUID],
    action_type: str,
    target_type: str,
    target_id: Optional[str] = None,
    metadata: Optional[dict[str, Any]] = None,
) -> AuditLog:
    entry = AuditLog(
        actor_id=actor_id,
        action_type=action_type,
        target_type=target_type,
        target_id=target_id,
        metadata_json=metadata or {},
    )
    db.add(entry)
    db.flush()
    return entry


def list_logs(
    db: Session,
    *,
    page: int = 1,
    page_size: int = 50,
    action_type: Optional[str] = None,
    start_at: Optional[datetime] = None,
    end_at: Optional[datetime] = None,
) -> tuple[Sequence[AuditLog], int]:
    if page < 1:
        raise ValueError("page_must_be_positive")
    page_size = max(1, min(page_size, 100))

    query = (
        select(AuditLog).options(selectinload(AuditLog.actor)).order_by(AuditLog.created_at.desc())
    )
    count_query = select(func.count(AuditLog.id))

    if action_type:
        query = query.where(AuditLog.action_type == action_type)
        count_query = count_query.where(AuditLog.action_type == action_type)
    if start_at:
        query = query.where(AuditLog.created_at >= start_at)
        count_query = count_query.where(AuditLog.created_at >= start_at)
    if end_at:
        query = query.where(AuditLog.created_at <= end_at)
        count_query = count_query.where(AuditLog.created_at <= end_at)

    total = db.execute(count_query).scalar_one()

    logs = db.execute(query.offset((page - 1) * page_size).limit(page_size)).scalars().all()

    return logs, total
