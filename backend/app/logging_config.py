from __future__ import annotations

import logging
import os
from logging.config import dictConfig


def configure_logging(level: str | None = None) -> None:
    """Configure structured logging for the application and uvicorn."""

    log_level = (level or os.getenv("LOG_LEVEL", "INFO")).upper()

    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "json": {
                    "class": "pythonjsonlogger.jsonlogger.JsonFormatter",
                    "format": "%(asctime)s %(levelname)s %(name)s %(message)s %(module)s %(funcName)s %(lineno)d",
                }
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "json",
                }
            },
            "root": {"handlers": ["console"], "level": log_level},
            "loggers": {
                "uvicorn": {"handlers": ["console"], "level": log_level, "propagate": False},
                "uvicorn.access": {"handlers": ["console"], "level": log_level, "propagate": False},
                "httpx": {"handlers": ["console"], "level": "WARNING", "propagate": False},
            },
        }
    )

    logging.getLogger(__name__).debug("Logging configured", extra={"level": log_level})
