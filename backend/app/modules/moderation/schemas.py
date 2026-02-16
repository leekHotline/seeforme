"""Moderation schemas."""

from typing import Optional
from pydantic import BaseModel


class ReportRequest(BaseModel):
    """Submit a report."""
    target_user_id: Optional[str] = None
    target_request_id: Optional[str] = None
    reason: str


class ReportResponse(BaseModel):
    """Report submission response."""
    id: str
    message: str = "Report submitted successfully"


class BlockRequest(BaseModel):
    """Block a user."""
    target_user_id: str


class BlockResponse(BaseModel):
    """Block response."""
    id: str
    message: str = "User blocked successfully"
