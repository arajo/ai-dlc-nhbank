"""Application configuration using pydantic-settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "Table Order API"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./table_order.db"

    # JWT
    SECRET_KEY: str = "change-this-secret-key-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 16

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Security
    LOGIN_MAX_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 5

    # SSE
    SSE_MAX_CONNECTIONS: int = 20
    SSE_HEARTBEAT_SECONDS: int = 30

    # Data Retention
    ORDER_HISTORY_RETENTION_DAYS: int = 30
    BACKUP_RETENTION_DAYS: int = 7

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
