"""Table request/response schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class TableSetupRequest(BaseModel):
    """Setup table request."""

    table_number: int = Field(..., ge=1)
    password: str = Field(..., min_length=1, max_length=100)


class TableResponse(BaseModel):
    """Table response."""

    id: int
    number: int
    current_session_id: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class TableSummaryResponse(BaseModel):
    """Table summary with total order amount."""

    id: int
    number: int
    current_session_id: str | None
    is_active: bool
    total_order_amount: int
    active_order_count: int


class EndSessionResponse(BaseModel):
    """End session response."""

    success: bool
    orders_archived: int
    session_id: str
