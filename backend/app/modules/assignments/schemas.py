"""Assignment schemas."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class ClaimResponse(BaseModel):
    """Response after claiming a request."""
    id: str
    request_id: str
    volunteer_id: str
    claimed_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
