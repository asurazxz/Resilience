"""FastAPI application entrypoint.

Minimal on purpose: this pass adds just enough app shell to run the Scheme
Navigator questionnaire and evaluator end to end. Workstream 1 owns the
long-term foundation (database wiring, auth, other feature routers) and may
extend or restructure this file.
"""

from __future__ import annotations

# Trust the operating system's certificate store rather than only certifi's
# bundled roots. Antivirus and corporate proxies (Norton, Zscaler, and
# similar) terminate TLS locally and re-sign it with a private root that is
# installed in the OS store but is absent from certifi -- which makes
# outbound HTTPS from the SDKs fail with CERTIFICATE_VERIFY_FAILED on some
# machines and not others. This must run before any HTTPS client is built.
try:
    import truststore

    truststore.inject_into_ssl()
except ImportError:  # pragma: no cover - optional dependency
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.scheme_navigator import router as scheme_navigator_router
from app.core.config import settings

app = FastAPI(title="Resilience API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scheme_navigator_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
