"""Upload schemas."""

from pydantic import BaseModel


class PresignRequest(BaseModel):
    """Request a presigned upload URL."""
    filename: str
    mime_type: str
    size: int


class PresignResponse(BaseModel):
    """Presigned upload response."""
    file_id: str
    upload_url: str
    category: str


class UploadContentResponse(BaseModel):
    """Uploaded file metadata after content is stored."""

    file_id: str
    file_url: str
    category: str
    mime_type: str
    size: int
