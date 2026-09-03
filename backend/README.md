# Backend

This directory contains the integrated Python 3.12/3.13 FastAPI service. It mounts Foundation Input, Income Reality, Emergency Fund, Scenario Simulator, and Scheme Navigator routes; product logic remains grouped by feature with explicit infrastructure and external-service boundaries.

## Placement rules

- Put API router composition and health endpoints in `app/api/`; feature endpoints stay inside their feature module and are mounted here.
- Put settings, logging, and application-wide concerns in `app/core/`.
- Put connection management and shared persistence primitives in `app/db/`.
- Put feature routes, schemas, services, and deterministic functions in `app/features/<feature>/`.
- Put LLM clients in `app/integrations/`; integrations may explain data but must not own financial or eligibility decisions.
- Import everything through the single `backend.app...` root. Nothing imports a top-level `app.*`.
- Put fast deterministic tests in `tests/unit/` and tests crossing API/database boundaries in `tests/integration/`.

## Run and verify

From the repository root after creating a Python 3.12 or 3.13 `.venv` and copying `backend/.env.example` to `backend/.env`:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8000
.\.venv\Scripts\python.exe -m pytest backend\tests -q
.\.venv\Scripts\python.exe -m ruff check backend
.\.venv\Scripts\python.exe backend\scripts\export_openapi.py
```

`backend/pyproject.toml` puts the repository root on `sys.path`, so `python -m pytest tests -q` run from inside `backend/` collects and passes exactly the same suite. Set `RUN_DATABASE_TESTS=1` to include the tests that need a running local Supabase.

`DATABASE_URL` must use SQLAlchemy's psycopg dialect, for example `postgresql+psycopg://...`. Production/shared environments should use the Supabase transaction-pooler connection string with SSL and conservative pool settings. Keep direct database credentials server-side only.

## URL prefixes and errors

Every feature route is mounted under one prefix, `/api/v1`:

| Feature | Path |
|---|---|
| Foundation Input | `/api/v1/foundation/...` |
| Income Reality | `/api/v1/income-reality/breakdown` |
| Emergency Fund | `/api/v1/resilience-jar/...` |
| Scheme Navigator | `/api/v1/scheme-navigator/...` |
| Scenario Simulator | `/api/v1/scenario-simulator/simulate` |

Only `/health` and `/ready` sit outside it. Every failure renders one envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Check the highlighted fields.",
    "details": { "optional": "structured context" },
    "fieldErrors": [{ "path": "amount_cents", "message": "Input should be greater than 0" }],
    "requestId": "5f0c..."
  }
}
```

`details` and `fieldErrors` are present only when they apply. Raise `app.core.errors.DomainError(status_code, code, message, details=None, field_errors=None)` for anything the application decides; request-shape failures become `VALIDATION_ERROR` (422) automatically.

## Authentication

Access tokens are verified locally: HS256 against `SUPABASE_JWT_SECRET`, other algorithms against the project's published JWKS, checking signature, `exp`, audience, and issuer. The remote `GET /auth/v1/user` call remains only as a fallback for tokens neither key source can serve. Local Supabase signs HS256 - copy the `JWT_SECRET` printed by `supabase status` into `SUPABASE_JWT_SECRET`.

The API exposes `/health`, database-aware `/ready`, and interactive documentation at `/docs`. Optional Scheme Navigator AI configuration uses `GROQ_API_KEY` and `EXPLAINER_MODEL`; without a key, deterministic fallbacks keep the feature usable.

Python 3.14 is not currently supported by the pinned dependency set on Windows because required binary wheels are unavailable. Create the environment explicitly with `py -3.13 -m venv .venv` (or `py -3.12`) before running these commands.
