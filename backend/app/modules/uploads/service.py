"""Upload business logic."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.uploads.models import UploadedFile


def _classify(mime_type: str) -> str | None:
    """Return file category based on MIME type, or None if unsupported."""
    if mime_type in settings.ALLOWED_IMAGE_TYPES:
        return "image"
    if mime_type in settings.ALLOWED_VOICE_TYPES:
        return "voice"
    if mime_type in settings.ALLOWED_VIDEO_TYPES:
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


async def presign_upload(
    db: AsyncSession, user_id: str, filename: str, mime_type: str, size: int
) -> dict:
    """Validate and create a presigned upload record.

    Returns dict with file_id, upload_url, and category.
    """
    category = _classify(mime_type)
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

    # Placeholder upload URL – in production this would be a cloud storage presigned URL
    upload_url = f"/uploads/{record.id}/{filename}"

    return {"file_id": record.id, "upload_url": upload_url, "category": category}
