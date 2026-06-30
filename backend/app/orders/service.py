"""Order service for creation, status management, and history."""

import json
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundException, ValidationException
from app.menus.models import MenuItem
from app.orders.models import Order, OrderCounter, OrderHistory, OrderItem, OrderStatus
from app.orders.schemas import OrderItemCreate
from app.tables.models import Table, TableSession


class OrderService:
    """Service for order operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_order(
        self,
        store_id: str,
        table_id: int,
        items: list[OrderItemCreate],
    ) -> Order:
        """Create a new order. Automatically starts a session if none active."""
        if not items:
            raise ValidationException("Order must have at least one item")

        # Get table and ensure it exists
        table = await self._get_table(store_id, table_id)

        # Get or create active session
        session_id = await self._ensure_session(store_id, table)

        # Resolve menu items and build order items
        order_items: list[OrderItem] = []
        total_amount = 0

        for item_req in items:
            menu_item = await self._get_active_menu_item(store_id, item_req.menu_id)
            order_item = OrderItem(
                menu_name=menu_item.name,
                quantity=item_req.quantity,
                unit_price=menu_item.price,
            )
            order_items.append(order_item)
            total_amount += menu_item.price * item_req.quantity

        # Generate order number
        order_number = await self._generate_order_number(store_id)

        # Create order
        order = Order(
            store_id=store_id,
            table_id=table_id,
            session_id=session_id,
            order_number=order_number,
            status=OrderStatus.PENDING,
            total_amount=total_amount,
            items=order_items,
        )
        self.db.add(order)
        await self.db.flush()

        # Reload with items
        result = await self.db.execute(
            select(Order).where(Order.id == order.id).options(selectinload(Order.items))
        )
        return result.scalar_one()

    async def get_orders_by_session(self, session_id: str) -> list[Order]:
        """Get all orders for a session."""
        result = await self.db.execute(
            select(Order)
            .where(Order.session_id == session_id)
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_active_orders(self, store_id: str) -> list[Order]:
        """Get all active orders for a store (current sessions)."""
        result = await self.db.execute(
            select(Order)
            .where(Order.store_id == store_id)
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc())
        )
        return list(result.scalars().all())

    async def update_order_status(self, order_id: int, status: OrderStatus) -> Order:
        """Update order status (flexible transitions allowed)."""
        result = await self.db.execute(
            select(Order).where(Order.id == order_id).options(selectinload(Order.items))
        )
        order = result.scalar_one_or_none()
        if not order:
            raise NotFoundException(f"Order {order_id} not found")

        order.status = status
        order.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        return order

    async def delete_order(self, order_id: int) -> dict:
        """Delete an order (admin privilege)."""
        result = await self.db.execute(
            select(Order).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        if not order:
            raise NotFoundException(f"Order {order_id} not found")

        order_info = {
            "order_id": order.id,
            "order_number": order.order_number,
            "table_id": order.table_id,
        }
        await self.db.delete(order)
        return order_info

    async def archive_session_orders(
        self, store_id: str, table_id: int, session_id: str
    ) -> int:
        """Archive all orders from a session to history and delete originals."""
        result = await self.db.execute(
            select(Order)
            .where(Order.session_id == session_id)
            .options(selectinload(Order.items))
        )
        orders = list(result.scalars().all())

        now = datetime.now(timezone.utc)
        count = 0

        for order in orders:
            # Serialize items to JSON
            items_data = [
                {
                    "menu_name": item.menu_name,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                }
                for item in order.items
            ]

            history = OrderHistory(
                store_id=store_id,
                table_id=table_id,
                session_id=session_id,
                order_number=order.order_number,
                items_json=json.dumps(items_data, ensure_ascii=False),
                total_amount=order.total_amount,
                ordered_at=order.created_at,
                completed_at=now,
            )
            self.db.add(history)
            await self.db.delete(order)
            count += 1

        return count

    async def get_order_history(
        self,
        store_id: str,
        table_id: int,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> list[OrderHistory]:
        """Get archived order history for a table."""
        query = select(OrderHistory).where(
            OrderHistory.store_id == store_id,
            OrderHistory.table_id == table_id,
        )

        if start_date:
            query = query.where(OrderHistory.completed_at >= start_date)
        if end_date:
            query = query.where(OrderHistory.completed_at <= end_date)

        query = query.order_by(OrderHistory.completed_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_all_history(
        self,
        store_id: str,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> list[OrderHistory]:
        """Get all archived order history for a store."""
        query = select(OrderHistory).where(OrderHistory.store_id == store_id)

        if start_date:
            query = query.where(OrderHistory.completed_at >= start_date)
        if end_date:
            query = query.where(OrderHistory.completed_at <= end_date)

        query = query.order_by(OrderHistory.completed_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    # --- Helpers ---

    async def _get_table(self, store_id: str, table_id: int) -> Table:
        """Get table, ensure it exists and belongs to store."""
        result = await self.db.execute(
            select(Table).where(Table.id == table_id, Table.store_id == store_id)
        )
        table = result.scalar_one_or_none()
        if not table:
            raise NotFoundException(f"Table {table_id} not found")
        return table

    async def _ensure_session(self, store_id: str, table: Table) -> str:
        """Get active session or create one (first order starts session)."""
        if table.current_session_id:
            return table.current_session_id

        # Create new session
        session_id = str(uuid.uuid4())
        session = TableSession(
            id=session_id,
            store_id=store_id,
            table_id=table.id,
            is_active=True,
        )
        self.db.add(session)
        table.current_session_id = session_id
        await self.db.flush()
        return session_id

    async def _get_active_menu_item(self, store_id: str, menu_id: int) -> MenuItem:
        """Get active menu item for the store."""
        result = await self.db.execute(
            select(MenuItem).where(
                MenuItem.id == menu_id,
                MenuItem.store_id == store_id,
                MenuItem.is_active == True,  # noqa: E712
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise ValidationException(f"Menu item {menu_id} not found or inactive")
        return item

    async def _generate_order_number(self, store_id: str) -> str:
        """Generate order number in format YYYYMMDD-NNN."""
        today = date.today()
        date_str = today.strftime("%Y%m%d")

        result = await self.db.execute(
            select(OrderCounter).where(
                OrderCounter.store_id == store_id,
                OrderCounter.date == str(today),
            )
        )
        counter = result.scalar_one_or_none()

        if not counter:
            counter = OrderCounter(store_id=store_id, date=str(today), counter=0)
            self.db.add(counter)

        counter.counter += 1
        await self.db.flush()

        return f"{date_str}-{counter.counter:03d}"
