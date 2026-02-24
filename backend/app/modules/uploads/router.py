"""Uploads API routes."""

import os

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


@router.put("/{file_id}", status_code=204)
async def upload_file_content(
    file_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Upload the actual file binary for an existing upload record."""
    record = await service.get_upload_record(db, file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File record not found")
    if record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your file")

    data = await file.read()
    await service.save_upload_file(file_id, record.filename, data)


@router.get("/files/{file_id}")
async def serve_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    """Serve an uploaded file for playback or download."""
    record = await service.get_upload_record(db, file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File not found")

    file_path = service.get_upload_file_path(file_id, record.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not on disk")

    return FileResponse(file_path, media_type=record.mime_type, filename=record.filename)
