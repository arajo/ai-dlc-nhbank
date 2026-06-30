"""Table management API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.sse.manager import sse_manager
from app.tables.schemas import (
    EndSessionResponse,
    TableResponse,
    TableSetupRequest,
    TableSummaryResponse,
)
from app.tables.service import TableService

router = APIRouter(prefix="/api/tables", tags=["Tables"])


@router.post("", response_model=TableResponse, status_code=201)
async def setup_table(
    request: TableSetupRequest,
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Setup a new table (admin only)."""
    store_id = admin["sub"]
    service = TableService(db)
    table = await service.setup_table(store_id, request.table_number, request.password)
    return table


@router.get("", response_model=list[TableResponse])
async def get_tables(
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get all tables for the store (admin)."""
    store_id = admin["sub"]
    service = TableService(db)
    tables = await service.get_tables(store_id)
    return tables


@router.get("/{table_id}/summary", response_model=TableSummaryResponse)
async def get_table_summary(
    table_id: int,
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get table summary with total orders (admin)."""
    store_id = admin["sub"]
    service = TableService(db)
    summary = await service.get_table_summary(store_id, table_id)
    return summary


@router.post("/{table_id}/end-session", response_model=EndSessionResponse)
async def end_table_session(
    table_id: int,
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """End table session - archive orders and reset (admin)."""
    store_id = admin["sub"]
    service = TableService(db)
    result = await service.end_session(store_id, table_id)

    # Broadcast SSE event
    if result["orders_archived"] > 0:
        await sse_manager.broadcast(
            store_id,
            "session_ended",
            {
                "table_id": table_id,
                "session_id": result["session_id"],
                "orders_archived": result["orders_archived"],
            },
        )

    return result
