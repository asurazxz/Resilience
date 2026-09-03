"""The single application settings module.

Values come from the process environment, falling back to ``backend/.env`` and
``backend/.env.auth``. Those files are gitignored and hold the real secrets;
the tracked ``backend/.env.example`` carries placeholders only.

Paths are resolved from ``__file__`` so the settings load identically whether
the process starts at the repository root or inside ``backend/``.
"""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[2]

LOCAL_FRONTEND_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_BACKEND_DIR / ".env", _BACKEND_DIR / ".env.auth"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    database_url: str = "postgresql+psycopg://postgres:postgres@127.0.0.1:54322/postgres"
    frontend_origin: str = "http://localhost:5173"
    # Comma-separated extra origins allowed to call this API.
    cors_allow_origins: str = ""
    supabase_url: str = ""
    supabase_publishable_key: str = ""
    supabase_jwt_secret: str = ""
    supabase_jwt_audience: str = "authenticated"
    db_pool_size: int = Field(default=5, ge=1, le=20)
    db_max_overflow: int = Field(default=5, ge=0, le=20)
    groq_api_key: str = ""
    explainer_model: str = "openai/gpt-oss-120b"

    @property
    def allowed_origins(self) -> list[str]:
        """Local dev origins plus the configured frontend and extra origins."""
        candidates = [
            *LOCAL_FRONTEND_ORIGINS,
            self.frontend_origin,
            *self.cors_allow_origins.split(","),
        ]
        return list(dict.fromkeys(origin.strip() for origin in candidates if origin.strip()))


@lru_cache
def get_settings() -> Settings:
    return Settings()
