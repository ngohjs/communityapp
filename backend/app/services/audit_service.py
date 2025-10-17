from __future__ import annotations

from typing import Any, Optional

import uuid

from sqlalchemy.orm import Session

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
