"""Upload business logic."""

from __future__ import annotations

from pathlib import Path

import aiofiles
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.uploads.models import UploadedFile


def classify_mime_type(mime_type: str) -> str | None:
    """Return file category based on MIME type, or None if unsupported."""
    normalized = mime_type.split(";")[0].strip().lower()
    alias_map = {
        "image/jpg": "image/jpeg",
        "audio/m4a": "audio/x-m4a",
    }
    normalized = alias_map.get(normalized, normalized)

    if normalized in settings.ALLOWED_IMAGE_TYPES:
        return "image"
    if normalized in settings.ALLOWED_VOICE_TYPES:
        return "voice"
    if normalized in settings.ALLOWED_VIDEO_TYPES:
        return "video"
    return None


def _max_size(category: str) -> int:
    """Return the max allowed size for a category."""
    if category == "image":
        return settings.MAX_IMAGE_SIZE
    if category == "voice":
        return settings.MAX_VOICE_SIZE
    if category == "video":
        return settings.MAX_VIDEO_SIZE
    return 0


def _safe_filename(filename: str) -> str:
    """Keep filename safe for filesystem usage."""
    normalized = filename.replace("\\", "_").replace("/", "_").strip()
    return normalized or "upload.bin"


def build_content_url(file_id: str) -> str:
    """Build API endpoint URL for reading upload content."""
    return f"/uploads/{file_id}/content"


def ensure_upload_dir() -> Path:
    """Create upload directory if needed and return it as Path."""
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


async def presign_upload(
    db: AsyncSession, user_id: str, filename: str, mime_type: str, size: int
) -> dict:
    """Validate and create a presigned upload record.

    Returns dict with file_id, upload_url, and category.
    """
    category = classify_mime_type(mime_type)
    if category is None:
        raise ValueError(f"Unsupported file type: {mime_type}")

    max_allowed = _max_size(category)
    if size > max_allowed:
        raise ValueError(
            f"File too large for {category}: {size} bytes exceeds {max_allowed} bytes"
        )

    record = UploadedFile(
        user_id=user_id,
        filename=filename,
        mime_type=mime_type,
        size=size,
        category=category,
    )
    db.add(record)
    await db.flush()

    return {
        "file_id": record.id,
        "upload_url": build_content_url(record.id),
        "category": category,
    }


async def get_uploaded_file(db: AsyncSession, file_id: str) -> UploadedFile | None:
    """Fetch uploaded file metadata by ID."""
    result = await db.execute(select(UploadedFile).where(UploadedFile.id == file_id))
    return result.scalar_one_or_none()


def _resolve_storage_path(record: UploadedFile) -> Path:
    """Resolve absolute file path from persisted metadata."""
    if not record.storage_path:
        raise FileNotFoundError("Uploaded content is not available")
    return ensure_upload_dir() / record.storage_path


async def save_upload_content(
    db: AsyncSession,
    *,
    record: UploadedFile,
    uploaded_filename: str | None,
    file_bytes: bytes,
) -> dict:
    """Persist upload bytes to local storage and return metadata response."""
    max_allowed = _max_size(record.category)
    actual_size = len(file_bytes)
    if actual_size > max_allowed:
        raise ValueError(
            f"File too large for {record.category}: {actual_size} bytes exceeds {max_allowed} bytes"
        )

    safe_name = _safe_filename(uploaded_filename or record.filename)
    relative_path = Path(record.user_id) / f"{record.id}-{safe_name}"
    final_path = ensure_upload_dir() / relative_path
    final_path.parent.mkdir(parents=True, exist_ok=True)

    async with aiofiles.open(final_path, "wb") as f:
        await f.write(file_bytes)

    record.storage_path = relative_path.as_posix()
    record.size = actual_size
    await db.flush()

    return {
        "file_id": record.id,
        "file_url": build_content_url(record.id),
        "category": record.category,
        "mime_type": record.mime_type,
        "size": record.size,
    }


def get_upload_content_path(record: UploadedFile) -> Path:
    """Return content path of an uploaded file and ensure it exists."""
    path = _resolve_storage_path(record)
    if not path.exists() or not path.is_file():
        raise FileNotFoundError("Uploaded content is not available")
    return path
