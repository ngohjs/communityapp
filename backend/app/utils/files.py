from __future__ import annotations

from io import BytesIO
import secrets
from pathlib import Path
from typing import Tuple

from PIL import Image

from ..config import get_settings


def _media_root() -> Path:
    settings = get_settings()
    root = Path(settings.media_root)
    root.mkdir(parents=True, exist_ok=True)
    return root


def get_media_subdir(subdir: str) -> Path:
    directory = _media_root() / subdir
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def save_avatar(image_data: bytes, filename_suffix: str | None = None) -> Tuple[str, Path]:
    settings = get_settings()
    avatar_dir = get_media_subdir(settings.avatar_subdir)
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


def save_content_file(file_bytes: bytes, extension: str) -> Tuple[str, Path, int]:
    settings = get_settings()
    content_dir = get_media_subdir(settings.content_subdir)
    unique_name = f"{secrets.token_hex(16)}.{extension}"
    output_path = content_dir / unique_name

    with output_path.open("wb") as file_obj:
        file_obj.write(file_bytes)

    return unique_name, output_path, len(file_bytes)


def remove_file(path: Path) -> None:
    try:
        path.unlink()
    except FileNotFoundError:
        pass
