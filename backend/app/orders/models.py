"""Order domain models."""

import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class OrderStatus(str, enum.Enum):
    """Order status enum."""

    PENDING = "pending"
    PREPARING = "preparing"
    COMPLETED = "completed"


class Order(Base):
    """Order (주문) entity."""

    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    store_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("stores.id"), nullable=False
    )
    table_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tables.id"), nullable=False
    )
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("table_sessions.id"), nullable=False
    )
    order_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), default=OrderStatus.PENDING
    )
    total_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    """Order item (주문 항목) entity."""

    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    menu_name: Mapped[str] = mapped_column(String(100), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[int] = mapped_column(Integer, nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="items")


class OrderHistory(Base):
    """Archived order history (과거 주문 이력) entity."""

    __tablename__ = "order_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    store_id: Mapped[str] = mapped_column(String(36), nullable=False)
    table_id: Mapped[int] = mapped_column(Integer, nullable=False)
    session_id: Mapped[str] = mapped_column(String(36), nullable=False)
    order_number: Mapped[str] = mapped_column(String(20), nullable=False)
    items_json: Mapped[str] = mapped_column(Text, nullable=False)
    total_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    ordered_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )


class OrderCounter(Base):
    """Daily order counter for generating order numbers."""

    __tablename__ = "order_counters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    store_id: Mapped[str] = mapped_column(String(36), nullable=False)
    date: Mapped[str] = mapped_column(String(10), nullable=False)
    counter: Mapped[int] = mapped_column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint("store_id", "date", name="uq_store_date_counter"),
    )
