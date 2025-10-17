from __future__ import annotations

import threading
import time
from collections import deque
from typing import Deque, Dict, Optional

from ..config import get_settings


class InMemoryRateLimiter:
    def __init__(self, limit: int, window_seconds: int) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._lock = threading.Lock()
        self._entries: Dict[str, Deque[float]] = {}

    def check(self, key: str) -> Optional[float]:
        """Register a request for the key.

        Returns the retry-after seconds if the limit is exceeded, otherwise None.
        """
        now = time.monotonic()
        with self._lock:
            queue = self._entries.setdefault(key, deque())
            cutoff = now - self.window_seconds
            while queue and queue[0] <= cutoff:
                queue.popleft()

            if len(queue) >= self.limit:
                retry_after = self.window_seconds - (now - queue[0]) if queue else self.window_seconds
                return max(retry_after, 1.0)

            queue.append(now)
            return None

    def reset(self) -> None:
        with self._lock:
            self._entries.clear()


_settings = get_settings()
auth_rate_limiter = InMemoryRateLimiter(
    limit=_settings.auth_rate_limit_attempts,
    window_seconds=_settings.auth_rate_limit_window_minutes * 60,
)


def reset_auth_rate_limiter() -> None:
    auth_rate_limiter.reset()
