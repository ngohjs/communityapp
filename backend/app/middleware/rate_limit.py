from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

from ..config import get_settings
from ..utils.rate_limiter import auth_rate_limiter


class AuthRateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limit selected auth endpoints using an in-process store."""

    _LIMITED_PATHS = {
        ("POST", "/auth/login"),
        ("POST", "/auth/register"),
        ("POST", "/auth/forgot-password"),
        ("POST", "/auth/reset-password"),
    }

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        settings = get_settings()
        self.limit = settings.auth_rate_limit_attempts
        self.window = settings.auth_rate_limit_window_minutes * 60

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        if (request.method, request.url.path) in self._LIMITED_PATHS:
            client_host = request.client.host if request.client else "unknown"
            key = f"{client_host}:{request.url.path}"
            retry_after = auth_rate_limiter.check(key)
            if retry_after is not None:
                headers = {"Retry-After": str(int(retry_after))}
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Too many requests. Please try again later.",
                        "limit": self.limit,
                        "window_seconds": self.window,
                    },
                    headers=headers,
                )

        response = await call_next(request)
        return response
