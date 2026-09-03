import re
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from .api.routes.scheme_navigator import router as scheme_navigator_router
from .core.errors import DomainError
from .core.settings import get_settings
from .db.session import get_engine
from .features.foundation_input.routes import router as foundation_router
from .features.income_reality.router import router as income_reality_router
from .features.resilience_jar.routes import create_router
from .features.savings_goals.routes import router as savings_goals_router
from .features.scenario_simulator.router import router as scenario_simulator_router

API_PREFIX = "/api/v1"
_REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._-]{1,128}$")

settings = get_settings()
app = FastAPI(
    title="Resilience API",
    version="0.1.0",
    description="Deterministic application boundary for the Resilience prototype.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key", "X-Confirm-Reset"],
)
app.include_router(foundation_router, prefix=API_PREFIX)
app.include_router(
    income_reality_router,
    prefix=f"{API_PREFIX}/income-reality",
    tags=["income-reality"],
)
app.include_router(scheme_navigator_router, prefix=API_PREFIX)
app.include_router(scenario_simulator_router, prefix=API_PREFIX)
app.include_router(savings_goals_router, prefix=API_PREFIX)
app.include_router(create_router(), prefix=API_PREFIX)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    supplied = request.headers.get("X-Request-ID")
    request_id = supplied if supplied and _REQUEST_ID_PATTERN.match(supplied) else str(uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")


def _envelope(
    request: Request,
    code: str,
    message: str,
    *,
    details: dict[str, Any] | None = None,
    field_errors: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    error: dict[str, Any] = {"code": code, "message": message}
    if details is not None:
        error["details"] = details
    if field_errors:
        error["fieldErrors"] = field_errors
    error["requestId"] = _request_id(request)
    return {"error": error}


@app.exception_handler(DomainError)
async def domain_error_handler(request: Request, error: DomainError) -> JSONResponse:
    return JSONResponse(
        status_code=error.status_code,
        content=_envelope(
            request,
            error.code,
            error.message,
            details=error.details,
            field_errors=[
                {"path": path, "message": message}
                for path, message in (error.field_errors or {}).items()
            ],
        ),
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, error: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=_envelope(
            request,
            "VALIDATION_ERROR",
            "Check the highlighted fields.",
            field_errors=[
                {
                    "path": ".".join(str(value) for value in item["loc"] if value != "body"),
                    "message": item["msg"],
                }
                for item in error.errors()
            ],
        ),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, error: HTTPException) -> JSONResponse:
    codes = {401: "UNAUTHENTICATED", 503: "AUTH_UNAVAILABLE"}
    code = codes.get(error.status_code, f"HTTP_{error.status_code}")
    detail = error.detail
    message = detail if isinstance(detail, str) else str(detail)
    return JSONResponse(
        status_code=error.status_code,
        content=_envelope(request, code, message),
        headers=getattr(error, "headers", None),
    )


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready", tags=["health"])
def ready() -> dict[str, str]:
    with get_engine().connect() as connection:
        connection.execute(text("select 1"))
    return {"status": "ready"}
