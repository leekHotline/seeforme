"""Upload business logic."""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from pathlib import Path

import aiofiles
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.uploads.models import UploadedFile

MIME_ALIAS_MAP = {
    "image/jpg": "image/jpeg",
    "audio/m4a": "audio/x-m4a",
    "audio/x-wav": "audio/wav",
}

MIME_EXTENSION_MAP = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
    "audio/x-m4a": "m4a",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/aac": "aac",
    "audio/webm": "webm",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
}


def normalize_mime_type(mime_type: str) -> str:
    """Normalize MIME type aliases and parameters."""
    normalized = mime_type.split(";")[0].strip().lower()
    return MIME_ALIAS_MAP.get(normalized, normalized)


ALLOWED_IMAGE_MIME_TYPES = {normalize_mime_type(v) for v in settings.ALLOWED_IMAGE_TYPES}
ALLOWED_VOICE_MIME_TYPES = {normalize_mime_type(v) for v in settings.ALLOWED_VOICE_TYPES}
ALLOWED_VIDEO_MIME_TYPES = {normalize_mime_type(v) for v in settings.ALLOWED_VIDEO_TYPES}


def classify_mime_type(mime_type: str) -> str | None:
    """Return file category based on MIME type, or None if unsupported."""
    normalized = normalize_mime_type(mime_type)

    if normalized in ALLOWED_IMAGE_MIME_TYPES:
        return "image"
    if normalized in ALLOWED_VOICE_MIME_TYPES:
        return "voice"
    if normalized in ALLOWED_VIDEO_MIME_TYPES:
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


def _ensure_extension(filename: str, preferred_extension: str) -> str:
    """Normalize filename extension to match MIME type."""
    safe_name = _safe_filename(filename)
    extension = preferred_extension.strip(".").lower()
    if not extension:
        return safe_name

    stem = Path(safe_name).stem
    if not stem:
        stem = "upload"
    return f"{stem}.{extension}"


def _preferred_extension(mime_type: str, fallback_filename: str) -> str:
    """Return preferred extension for MIME type, or fallback extension."""
    normalized = normalize_mime_type(mime_type)
    preferred = MIME_EXTENSION_MAP.get(normalized)
    if preferred:
        return preferred

    fallback_suffix = Path(_safe_filename(fallback_filename)).suffix.lstrip(".").lower()
    return fallback_suffix or "bin"


def _date_folder(created_at: datetime | None) -> str:
    """Return storage date folder in YYYY-MM-DD format."""
    timestamp = created_at or datetime.now(timezone.utc)
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    return timestamp.date().isoformat()


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
    normalized_mime = normalize_mime_type(mime_type)
    category = classify_mime_type(normalized_mime)
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
        mime_type=normalized_mime,
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
    detected_mime_type: str | None = None,
) -> dict:
    """Persist upload bytes to local storage and return metadata response."""
    max_allowed = _max_size(record.category)
    actual_size = len(file_bytes)
    if actual_size > max_allowed:
        raise ValueError(
            f"File too large for {record.category}: {actual_size} bytes exceeds {max_allowed} bytes"
        )

    final_mime_type = normalize_mime_type(record.mime_type)
    if detected_mime_type:
        normalized_detected_mime = normalize_mime_type(detected_mime_type)
        detected_category = classify_mime_type(normalized_detected_mime)
        if detected_category and detected_category != record.category:
            raise ValueError("Uploaded content type does not match presigned file category")
        if detected_category:
            final_mime_type = normalized_detected_mime

    source_name = uploaded_filename or record.filename
    extension = _preferred_extension(final_mime_type, source_name)
    safe_name = _ensure_extension(source_name, extension)
    sha_prefix = hashlib.sha256(file_bytes).hexdigest()[:12]
    relative_path = (
        Path(record.user_id)
        / _date_folder(record.created_at)
        / f"{record.id}-{sha_prefix}-{safe_name}"
    )
    final_path = ensure_upload_dir() / relative_path
    final_path.parent.mkdir(parents=True, exist_ok=True)

    async with aiofiles.open(final_path, "wb") as f:
        await f.write(file_bytes)

    record.mime_type = final_mime_type
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
