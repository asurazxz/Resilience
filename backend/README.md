# Backend

The FastAPI service. It mounts Foundation Input, Income Reality, Emergency Fund, Savings Goals, Financial Score, Setback Planner and Scheme Navigator routes. Product logic stays grouped by feature, with explicit infrastructure and external-service boundaries.

Python 3.13 or 3.12. Python 3.14 is not supported: the pinned `psycopg-binary`, `pydantic-core` and Uvicorn extras have no compatible wheels for it.

## Placement rules

- Put API router composition and health endpoints in `app/api/`; feature endpoints stay inside their feature module and are mounted from `app/main.py`.
- Put settings, authentication, logging and application-wide concerns in `app/core/`.
- Put connection management and shared persistence primitives in `app/db/`.
- Put feature routes, schemas, services and deterministic functions in `app/features/<feature>/`.
- Put LLM clients in `app/integrations/`; an integration may explain data but must never own a financial or eligibility decision.
- Import everything through the single `backend.app…` root. Nothing imports a top-level `app.*`.
- Put fast deterministic tests in `tests/unit/` and tests crossing an API or database boundary in `tests/integration/`.

Two modules are deliberately shared across features rather than owned by one:

- `app/features/emergency_fund_ledger.py` — `emergency_fund_balance()`, `weekly_essential_expenses_cents()` and `weekly_recurring_work_costs_cents()`, each a single SQL aggregate. The Foundation bootstrap, the Emergency Fund summary and the surplus calculation all call these, so they cannot drift.
- `app/features/transaction_spread.py` — spreads a dated-range transaction evenly over its calendar days. Mirrored on the client and pinned by `contracts/fixtures/transaction-week-split.json`.

## Run and verify

From the repository root, with a Python 3.13 or 3.12 virtual environment active and `backend/.env` created from `backend/.env.example`:

```bash
python -m pip install -r backend/requirements-dev.txt
python -m uvicorn backend.app.main:app --reload --port 8000
python -m pytest backend/tests -q
python -m ruff check backend
python -m backend.scripts.export_openapi
```

Start Uvicorn from the repository root, not from `backend/`. `backend/pyproject.toml` puts the repository root on `sys.path`, so `python -m pytest tests -q` run from inside `backend/` collects exactly the same suite.

Set `RUN_DATABASE_TESTS=1` to include the tests that need a running local Supabase. They each run as a throwaway user that is deleted afterwards.

`DATABASE_URL` must use SQLAlchemy's psycopg dialect, for example `postgresql+psycopg://…`. A shared or hosted environment should use the Supabase transaction-pooler connection string with SSL and conservative pool settings. Database credentials stay server-side only.

## URL prefixes and errors

Every feature route is mounted under one prefix, `/api/v1`:

| Feature | Path |
|---|---|
| Foundation Input | `/api/v1/foundation/…` (profile, assumptions, weeks, transactions) |
| Income Reality | `/api/v1/income-reality/breakdown` |
| Emergency Fund | `/api/v1/resilience-jar/…` |
| Savings Goals | `/api/v1/savings-goals/…` |
| Financial Score | `/api/v1/financial-score` |
| Scheme Navigator | `/api/v1/scheme-navigator/…` |
| Setback Planner | `/api/v1/scenario-simulator/simulate` |

Only `/health`, `/ready` and `/docs` sit outside it. Every failure renders one envelope:

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

`details` and `fieldErrors` are present only when they apply. Raise `app.core.errors.DomainError(status_code, code, message, details=None, field_errors=None)` for anything the application decides; request-shape failures become `VALIDATION_ERROR` (422) automatically, and authentication failures become `UNAUTHENTICATED` (401) or `AUTH_UNAVAILABLE` (503).

## Authentication

Access tokens are verified locally: HS256 against `SUPABASE_JWT_SECRET`, other algorithms against the project's published JWKS, checking signature, `exp`, audience and issuer. The remote `GET /auth/v1/user` call remains only as a fallback for tokens neither key source can serve. Local Supabase signs HS256 — copy the `JWT_SECRET` printed by `npx supabase status` into `SUPABASE_JWT_SECRET`.

Every feature route resolves the caller through `current_user_id`. A record belonging to another user answers `404 NOT_FOUND` rather than `403`, so ownership is not leaked.

## AI configuration

The Scheme Navigator assistant is optional and powered by Groq: `GROQ_API_KEY`, `GROQ_MODEL` and `GROQ_BASE_URL` in `backend/.env` (gitignored). Without a key, the explainer and the chat widget return deterministic answers built from the evaluator's own matched facts and unmatched reasons, so the core journey never depends on the model. See [`documentation/features/scheme-navigator.md`](../documentation/features/scheme-navigator.md).

The model is reached through the `LLMClient` protocol in `app/integrations/ai/client.py`, which wraps the official `groq` SDK. That layer owns transport only — no rules, no prompt content — which is what has let the provider change without `explainer.py`, `chat.py`, the prompts or any test changing. `GROQ_BASE_URL` is the host root; the SDK appends its own OpenAI-compatible path.

## Environment

`app/core/settings.py` is the single settings module. Values come from the process environment, falling back to `backend/.env` and `backend/.env.auth`. Both are gitignored; the tracked `backend/.env.example` carries placeholders only. The full variable table is in the [root README](../README.md#4-create-the-environment-files).
