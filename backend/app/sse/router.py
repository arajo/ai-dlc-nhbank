"""SSE endpoint for real-time order events."""

import asyncio
import uuid

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.exceptions import ServiceUnavailableException
from app.sse.manager import sse_manager

router = APIRouter(prefix="/api/sse", tags=["SSE"])


@router.get("/orders")
async def stream_orders(
    store_id: str = Query(...),
    token: str = Query(default=""),
):
    """Stream order events via SSE for the admin dashboard."""
    # Validate token from query param (EventSource can't send headers)
    if token:
        from app.core.security import decode_access_token
        payload = decode_access_token(token)
        if not payload or payload.get("type") not in ("admin", "table"):
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=401, content={"detail": "Invalid token"})
    else:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=401, content={"detail": "Token required"})

    client_id = str(uuid.uuid4())

    queue = await sse_manager.connect(store_id, client_id)
    if queue is None:
        raise ServiceUnavailableException("Too many SSE connections")

    async def event_generator():
        try:
            while True:
                try:
                    message = await asyncio.wait_for(
                        queue.get(), timeout=settings.SSE_HEARTBEAT_SECONDS
                    )
                    yield message
                except asyncio.TimeoutError:
                    # Send heartbeat
                    yield ": heartbeat\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            await sse_manager.disconnect(store_id, client_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
