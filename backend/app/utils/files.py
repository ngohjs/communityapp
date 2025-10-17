from __future__ import annotations

from io import BytesIO
import secrets
from pathlib import Path
from typing import Tuple

from PIL import Image

from ..config import get_settings


def ensure_media_dirs() -> Path:
    settings = get_settings()
    root = Path(settings.media_root)
    avatar_dir = root / settings.avatar_subdir
    avatar_dir.mkdir(parents=True, exist_ok=True)
    return avatar_dir


def save_avatar(image_data: bytes, filename_suffix: str | None = None) -> Tuple[str, Path]:
    avatar_dir = ensure_media_dirs()
    suffix = filename_suffix or "png"
    unique_name = f"{secrets.token_hex(16)}.{suffix}"
    output_path = avatar_dir / unique_name

    with Image.open(BytesIO(image_data)) as img:
        img = img.convert("RGBA") if img.mode in ("P", "RGBA") else img.convert("RGB")
        img.thumbnail((512, 512))
        format_hint = suffix.upper() if suffix else "PNG"
        if format_hint not in {"PNG", "JPG", "JPEG"}:
            format_hint = "PNG"
        img.save(output_path, format=format_hint, optimize=True)

    return unique_name, output_path


def remove_file(path: Path) -> None:
    try:
        path.unlink()
    except FileNotFoundError:
        pass
