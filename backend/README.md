# Backend

This directory contains the provisional FastAPI service. Its application shell mounts the Scenario Simulator, Scheme Navigator, and synthetic Emergency Fund routers while the shared database and authentication foundations remain pending.
This directory contains the Python 3.12/3.13 FastAPI service. Product logic is grouped by feature, while cross-cutting infrastructure and external services have explicit boundaries.

## Placement rules

- Put API router composition and health endpoints in `app/api/`; feature endpoints stay inside their feature module and are mounted here.
- Put settings, logging, and application-wide concerns in `app/core/`.
- Put connection management and shared persistence primitives in `app/db/`.
- Put feature routes, schemas, services, and deterministic functions in `app/features/<feature>/`.
- Put LLM and OCR clients in `app/integrations/`; integrations may explain or extract data but must not own financial or eligibility decisions.
- Put fast deterministic tests in `tests/unit/` and tests crossing API/database boundaries in `tests/integration/`.

The initial FastAPI package, dependency manifest, and application entry point are owned by `feature/01-foundation-input`.

## Run and check

From the repository root:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
cd backend && ../.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

Run all backend tests from the repository root with:

```bash
PYTHONPATH=backend:. .venv/bin/python -m pytest backend/tests -q
```
## Run and verify

From the repository root after creating a Python 3.12 or 3.13 `.venv` and copying `backend/.env.example` to `backend/.env`:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8000
.\.venv\Scripts\python.exe -m pytest backend\tests -q
.\.venv\Scripts\python.exe -m ruff check backend
```

`DATABASE_URL` must use SQLAlchemy's psycopg dialect, for example `postgresql+psycopg://...`. Production/shared environments should use the Supabase transaction-pooler connection string with SSL and conservative pool settings. Keep direct database credentials server-side only.

Python 3.14 is not currently supported by the pinned dependency set on Windows because required binary wheels are unavailable. Create the environment explicitly with `py -3.13 -m venv .venv` (or `py -3.12`) before running these commands.
