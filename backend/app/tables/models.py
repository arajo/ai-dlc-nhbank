"""Table domain models."""

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Table(Base):
    """Table (테이블) entity."""

    __tablename__ = "tables"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    store_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("stores.id"), nullable=False
    )
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    current_session_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        UniqueConstraint("store_id", "number", name="uq_store_table_number"),
    )


class TableSession(Base):
    """Table session (테이블 세션) entity."""

    __tablename__ = "table_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    store_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("stores.id"), nullable=False
    )
    table_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tables.id"), nullable=False
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
