"""Health check endpoints (shallow and deep)."""

from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import text

from app.core.database import AsyncSessionLocal

router = APIRouter(prefix="/api/health", tags=["Health"])


@router.get("")
async def health_check():
    """Shallow health check - confirms process is running."""
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/deep")
async def deep_health_check():
    """Deep health check - verifies database connectivity."""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    status = "ok" if db_status == "connected" else "degraded"

    return {
        "status": status,
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
