"""Minimal application settings.

Kept intentionally small: no database or auth configuration yet, since this
pass covers only the Scheme Navigator. Workstream 1 owns the shared
foundation and may extend this file.

Values come from ``backend/.env`` when present, falling back to the real
environment. That file is gitignored and holds the actual secrets; the
tracked ``.env.example`` carries placeholders only.

The explainer settings are optional on purpose -- with no API key the
Scheme Navigator still works end to end using deterministic explanations.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# backend/app/core/config.py -> backend/.env
_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"

# override=False so a variable already exported in the shell wins over the
# file, which is the behaviour deployment tooling expects.
load_dotenv(_ENV_PATH, override=False)

_LOCAL_FRONTEND_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


class Settings:
    configured_origins = os.environ.get(
        "CORS_ALLOW_ORIGINS",
        os.environ.get("FRONTEND_ORIGIN", ""),
    ).split(",")
    cors_allow_origins: list[str] = list(
        dict.fromkeys(
            [*_LOCAL_FRONTEND_ORIGINS, *(origin.strip() for origin in configured_origins)]
        )
    )
    cors_allow_origins = [origin for origin in cors_allow_origins if origin]

    groq_api_key: str = os.environ.get("GROQ_API_KEY", "").strip()
    explainer_model: str = os.environ.get("EXPLAINER_MODEL", "openai/gpt-oss-120b").strip()


settings = Settings()
