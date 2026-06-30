"""Order request/response schemas."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.orders.models import OrderStatus


class OrderItemCreate(BaseModel):
    """Order item in create request."""

    menu_id: int
    quantity: int = Field(..., ge=1)


class OrderCreateRequest(BaseModel):
    """Create order request."""

    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderItemResponse(BaseModel):
    """Order item response."""

    id: int
    menu_name: str
    quantity: int
    unit_price: int

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    """Order response."""

    id: int
    order_number: str
    table_id: int
    session_id: str
    status: OrderStatus
    total_amount: int
    items: list[OrderItemResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    """Update order status request."""

    status: OrderStatus


class OrderHistoryResponse(BaseModel):
    """Archived order history response."""

    id: int
    order_number: str
    table_id: int
    session_id: str
    items_json: str
    total_amount: int
    ordered_at: datetime
    completed_at: datetime

    model_config = {"from_attributes": True}


class DateFilter(BaseModel):
    """Date filter for history queries."""

    start_date: str | None = None
    end_date: str | None = None
