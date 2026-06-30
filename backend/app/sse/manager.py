"""SSE (Server-Sent Events) connection manager."""

import asyncio
import json
from collections import defaultdict

import structlog

from app.core.config import settings

logger = structlog.get_logger()


class SSEManager:
    """Manages SSE connections and event broadcasting."""

    def __init__(self):
        # store_id -> set of (client_id, queue)
        self._connections: dict[str, dict[str, asyncio.Queue]] = defaultdict(dict)

    @property
    def connection_count(self) -> int:
        """Total number of active connections."""
        return sum(len(clients) for clients in self._connections.values())

    def store_connection_count(self, store_id: str) -> int:
        """Number of active connections for a store."""
        return len(self._connections.get(store_id, {}))

    async def connect(self, store_id: str, client_id: str) -> asyncio.Queue | None:
        """Register a new SSE connection. Returns queue or None if limit reached."""
        if self.connection_count >= settings.SSE_MAX_CONNECTIONS:
            logger.warning(
                "sse_connection_rejected",
                store_id=store_id,
                reason="max_connections_reached",
                current=self.connection_count,
            )
            return None

        queue: asyncio.Queue = asyncio.Queue()
        self._connections[store_id][client_id] = queue
        logger.info(
            "sse_client_connected",
            store_id=store_id,
            client_id=client_id,
            total_connections=self.connection_count,
        )
        return queue

    async def disconnect(self, store_id: str, client_id: str) -> None:
        """Remove an SSE connection."""
        if store_id in self._connections:
            self._connections[store_id].pop(client_id, None)
            if not self._connections[store_id]:
                del self._connections[store_id]
        logger.info(
            "sse_client_disconnected",
            store_id=store_id,
            client_id=client_id,
            total_connections=self.connection_count,
        )

    async def broadcast(self, store_id: str, event_type: str, data: dict) -> None:
        """Broadcast an event to all connections for a store."""
        clients = self._connections.get(store_id, {})
        payload = json.dumps(data, ensure_ascii=False, default=str)
        message = f"event: {event_type}\ndata: {payload}\n\n"

        disconnected = []
        for client_id, queue in clients.items():
            try:
                queue.put_nowait(message)
            except asyncio.QueueFull:
                disconnected.append(client_id)
                logger.warning(
                    "sse_queue_full", store_id=store_id, client_id=client_id
                )

        # Clean up full queues
        for client_id in disconnected:
            await self.disconnect(store_id, client_id)


# Singleton instance
sse_manager = SSEManager()
