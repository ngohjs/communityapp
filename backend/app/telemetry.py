from __future__ import annotations

from datetime import datetime, timezone
from importlib.metadata import version


def collect_runtime_metrics() -> dict[str, str]:
    """Return simple placeholder metrics for future observability integration."""

    try:
        app_version = version("communityapp-backend")
    except Exception:
        app_version = "0.0.0"

    return {
        "app": "community-app-backend",
        "version": app_version,
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
    }
