# Backend

This directory contains the provisional FastAPI service. Its application shell mounts both the Scenario Simulator router and the synthetic Emergency Fund router while the shared database and authentication foundations remain pending.

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
PYTHONPATH=backend:. .venv/bin/python -m unittest discover -s backend/tests -p 'test_*.py'
```
