from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user
from app.modules.auth.models import User
from app.modules.uploads import schemas, service

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/presign", response_model=schemas.PresignResponse)
async def presign_upload(
    payload: schemas.PresignRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> schemas.PresignResponse:
    """Get a presigned upload URL for image, voice, or video files."""
    try:
        result = await service.presign_upload(
            db, current_user.id, payload.filename, payload.mime_type, payload.size
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return schemas.PresignResponse(**result)


@router.put("/{file_id}/content", response_model=schemas.UploadContentResponse)
async def upload_file_content(
    file_id: str,
    content: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> schemas.UploadContentResponse:
    """Upload actual file bytes for a presigned file ID."""
    record = await service.get_uploaded_file(db, file_id)
    if not record:
        raise HTTPException(status_code=404, detail="Upload record not found")
    if record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot upload content for this file")

    detected_mime_type: str | None = None
    # Enforce coarse category consistency while tolerating client MIME variations
    # (e.g. iOS can send `audio/m4a`, `image/jpg`, or generic values).
    if content.content_type:
        normalized = service.normalize_mime_type(content.content_type)
        detected_mime_type = normalized
        actual_category = service.classify_mime_type(normalized)
        if actual_category is None:
            if normalized.startswith("image/"):
                actual_category = "image"
            elif normalized.startswith("audio/"):
                actual_category = "voice"
            elif normalized.startswith("video/"):
                actual_category = "video"
        if actual_category and actual_category != record.category:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"MIME type mismatch: expected {record.mime_type} "
                    f"({record.category}), got {content.content_type}"
                ),
            )

    try:
        file_bytes = await content.read()
        result = await service.save_upload_content(
            db,
            record=record,
            uploaded_filename=content.filename,
            file_bytes=file_bytes,
            detected_mime_type=detected_mime_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return schemas.UploadContentResponse(**result)


@router.get("/{file_id}/content")
async def get_file_content(
    file_id: str,
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    """Read uploaded file content by file ID."""
    record = await service.get_uploaded_file(db, file_id)
    if not record:
        raise HTTPException(status_code=404, detail="Upload record not found")

    try:
        file_path = service.get_upload_content_path(record)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Uploaded content is not available")

    media_type = service.resolve_serving_mime_type(record, file_path)
    if media_type != record.mime_type:
        record.mime_type = media_type
        await db.flush()

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=file_path.name,
        content_disposition_type="inline",
    )
