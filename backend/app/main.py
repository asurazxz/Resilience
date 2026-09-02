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
from uuid import uuid4

from backend.app.core.errors import DomainError
from backend.app.core.settings import get_settings
from backend.app.db.session import get_engine
from backend.app.features.foundation_input.routes import router as foundation_router
from backend.app.features.income_reality.router import router as income_reality_router
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

settings = get_settings()
app = FastAPI(
    title="Resilience API",
    version="0.1.0",
    description="Deterministic application boundary for the Resilience prototype.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Idempotency-Key", "X-Confirm-Reset"],
)
app.include_router(foundation_router, prefix="/api/v1")
app.include_router(
    income_reality_router,
    prefix="/api/v1/income-reality",
    tags=["income-reality"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid4()))
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.exception_handler(DomainError)
async def domain_error_handler(request: Request, error: DomainError) -> JSONResponse:
    return JSONResponse(
        status_code=error.status_code,
        content={
            "error": {
                "code": error.code,
                "message": error.message,
                "details": error.details,
                "requestId": request.state.request_id,
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, error: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Check the highlighted fields.",
                "fieldErrors": [
                    {
                        "path": ".".join(str(value) for value in item["loc"] if value != "body"),
                        "message": item["msg"],
                    }
                    for item in error.errors()
                ],
                "requestId": request.state.request_id,
            }
        },
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, error: ValueError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "code": "INVALID_INPUT",
                "message": str(error),
                "requestId": request.state.request_id,
            }
        },
    )


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready", tags=["health"])
def ready() -> dict[str, str]:
    with get_engine().connect() as connection:
        connection.execute(text("select 1"))
    return {"status": "ready"}
