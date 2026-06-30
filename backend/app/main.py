"""FastAPI application entry point."""

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.core.config import settings
from app.core.database import init_db
from app.core.exceptions import register_exception_handlers
from app.core.middleware import RequestIDMiddleware, TimingMiddleware
from app.health.router import router as health_router
from app.menus.router import router as menus_router
from app.orders.router import router as orders_router
from app.sse.router import router as sse_router
from app.tables.router import router as tables_router

# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown."""
    # Startup
    await init_db()
    structlog.get_logger().info("application_started", app_name=settings.APP_NAME)
    yield
    # Shutdown
    structlog.get_logger().info("application_shutdown")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="테이블오더 서비스 API",
    lifespan=lifespan,
)

# Middleware (order matters: first added = outermost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TimingMiddleware)
app.add_middleware(RequestIDMiddleware)

# Exception handlers
register_exception_handlers(app)

# Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(menus_router)
app.include_router(orders_router)
app.include_router(tables_router)
app.include_router(sse_router)
