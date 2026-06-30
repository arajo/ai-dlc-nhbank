"""Table service for setup, session management, and end-of-use."""

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException
from app.core.security import hash_password
from app.orders.models import Order
from app.orders.service import OrderService
from app.tables.models import Table, TableSession


class TableService:
    """Service for table operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.order_service = OrderService(db)

    async def setup_table(self, store_id: str, table_number: int, password: str) -> Table:
        """Setup a new table with number and password."""
        # Check if table number already exists
        existing = await self.db.execute(
            select(Table).where(
                Table.store_id == store_id, Table.number == table_number
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"Table number {table_number} already exists")

        table = Table(
            store_id=store_id,
            number=table_number,
            password_hash=hash_password(password),
        )
        self.db.add(table)
        await self.db.flush()
        return table

    async def get_tables(self, store_id: str) -> list[Table]:
        """Get all tables for a store."""
        result = await self.db.execute(
            select(Table)
            .where(Table.store_id == store_id, Table.is_active == True)  # noqa: E712
            .order_by(Table.number)
        )
        return list(result.scalars().all())

    async def get_table_summary(self, store_id: str, table_id: int) -> dict:
        """Get table summary with total order amount."""
        result = await self.db.execute(
            select(Table).where(Table.id == table_id, Table.store_id == store_id)
        )
        table = result.scalar_one_or_none()
        if not table:
            raise NotFoundException(f"Table {table_id} not found")

        # Calculate total from active orders
        total_result = await self.db.execute(
            select(
                func.coalesce(func.sum(Order.total_amount), 0),
                func.count(Order.id),
            ).where(
                Order.table_id == table_id,
                Order.session_id == table.current_session_id,
            )
        )
        row = total_result.one()
        total_amount = row[0]
        order_count = row[1]

        return {
            "id": table.id,
            "number": table.number,
            "current_session_id": table.current_session_id,
            "is_active": table.is_active,
            "total_order_amount": total_amount,
            "active_order_count": order_count,
        }

    async def end_session(self, store_id: str, table_id: int) -> dict:
        """End table session (이용 완료). Archive orders and reset."""
        result = await self.db.execute(
            select(Table).where(Table.id == table_id, Table.store_id == store_id)
        )
        table = result.scalar_one_or_none()
        if not table:
            raise NotFoundException(f"Table {table_id} not found")

        session_id = table.current_session_id
        if not session_id:
            return {"success": True, "orders_archived": 0, "session_id": ""}

        # Archive orders
        archived_count = await self.order_service.archive_session_orders(
            store_id, table_id, session_id
        )

        # End session
        session_result = await self.db.execute(
            select(TableSession).where(TableSession.id == session_id)
        )
        session = session_result.scalar_one_or_none()
        if session:
            session.ended_at = datetime.now(timezone.utc)
            session.is_active = False

        # Reset table
        table.current_session_id = None

        return {
            "success": True,
            "orders_archived": archived_count,
            "session_id": session_id,
        }
