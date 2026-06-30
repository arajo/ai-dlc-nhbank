"""Order API endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_current_table
from app.orders.schemas import (
    OrderCreateRequest,
    OrderHistoryResponse,
    OrderResponse,
    OrderStatusUpdate,
)
from app.orders.service import OrderService
from app.sse.manager import sse_manager

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(
    request: OrderCreateRequest,
    table: dict = Depends(get_current_table),
    db: AsyncSession = Depends(get_db),
):
    """Create a new order (table/customer)."""
    store_id = table["sub"]
    table_id = table["table_id"]
    service = OrderService(db)
    order = await service.create_order(store_id, table_id, request.items)

    # Broadcast SSE event
    await sse_manager.broadcast(
        store_id,
        "order_created",
        {
            "order_id": order.id,
            "order_number": order.order_number,
            "table_id": order.table_id,
            "table_number": table["table_number"],
            "items": [
                {"menu_name": i.menu_name, "quantity": i.quantity, "unit_price": i.unit_price}
                for i in order.items
            ],
            "total_amount": order.total_amount,
            "status": order.status.value,
            "created_at": order.created_at.isoformat(),
        },
    )

    return order


@router.get("/session/{session_id}", response_model=list[OrderResponse])
async def get_session_orders(
    session_id: str,
    _table: dict = Depends(get_current_table),
    db: AsyncSession = Depends(get_db),
):
    """Get all orders for a session (table/customer)."""
    service = OrderService(db)
    orders = await service.get_orders_by_session(session_id)
    return orders


@router.get("/active", response_model=list[OrderResponse])
async def get_active_orders(
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get all active orders for the store (admin)."""
    store_id = admin["sub"]
    service = OrderService(db)
    orders = await service.get_active_orders(store_id)
    return orders


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    request: OrderStatusUpdate,
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update order status (admin)."""
    store_id = admin["sub"]
    service = OrderService(db)
    order = await service.update_order_status(order_id, request.status)

    # Broadcast SSE event
    await sse_manager.broadcast(
        store_id,
        "order_updated",
        {
            "order_id": order.id,
            "order_number": order.order_number,
            "table_id": order.table_id,
            "status": order.status.value,
            "updated_at": order.updated_at.isoformat(),
        },
    )

    return order


@router.delete("/{order_id}", status_code=204)
async def delete_order(
    order_id: int,
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete an order (admin privilege)."""
    store_id = admin["sub"]
    service = OrderService(db)
    order_info = await service.delete_order(order_id)

    # Broadcast SSE event
    await sse_manager.broadcast(store_id, "order_deleted", order_info)


@router.get("/history/{table_id}", response_model=list[OrderHistoryResponse])
async def get_order_history(
    table_id: int,
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get archived order history for a table (admin)."""
    store_id = admin["sub"]
    service = OrderService(db)
    history = await service.get_order_history(store_id, table_id, start_date, end_date)
    return history
