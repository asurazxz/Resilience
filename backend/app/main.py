"""Provisional FastAPI application shell.

`feature/01-foundation-input` owns the real application entry point, settings,
and router composition. This module composes the currently merged feature
routers so the development branch can be exercised end to end.
"""

from __future__ import annotations

# Trust the operating system's certificate store before an HTTPS client is
# created. This keeps the optional AI explainer usable behind local TLS proxies.
try:
    import truststore

    truststore.inject_into_ssl()
except ImportError:  # pragma: no cover - optional dependency
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.scheme_navigator import router as scheme_navigator_router
from app.core.config import settings
from app.features.resilience_jar.routes import create_demo_router
from app.features.scenario_simulator.router import router as scenario_simulator_router

app = FastAPI(title="Resilience API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scheme_navigator_router)
app.include_router(scenario_simulator_router)
app.include_router(create_demo_router())


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
