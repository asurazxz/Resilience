# Codebase Structure

**Updated:** 2026-09-03

**Scope:** The integrated prototype on `dev`

## Decision

Resilience uses a feature-first monorepo. The frontend and backend mirror the same product boundaries so each vertical slice keeps its UI, transport, deterministic logic and tests together. Cross-cutting code is promoted into a shared directory only when more than one feature needs it.

Supabase is the managed PostgreSQL environment and the authentication provider. It does not replace PostgreSQL in the architecture: FastAPI remains the application boundary and connects through a standard `DATABASE_URL`, so the service stays portable to a local or another hosted PostgreSQL instance.

## Directory map

```text
.
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/                      routing, shell, navigation, sync status
│   │   ├── components/               shared presentational components
│   │   ├── features/
│   │   │   ├── auth/                 Supabase sign-in and session handling
│   │   │   ├── foundation-input/     bootstrap context and shared foundation state
│   │   │   ├── home/                 financial score dial, key figures, weekly trend
│   │   │   ├── income-reality/       income overview and the foundation adapter
│   │   │   ├── landing/              public landing page
│   │   │   ├── resilience-jar/       emergency fund
│   │   │   ├── savings/              savings goals
│   │   │   ├── scenario-simulator/   setback planner
│   │   │   └── scheme-navigator/     questionnaire, results, chat widget
│   │   ├── lib/                      api client, offline queue, money, dates, chart theme
│   │   └── types/                    cross-feature and generated API types
│   └── tests/
├── backend/
│   ├── app/
│   │   ├── api/routes/               scheme navigator router
│   │   ├── core/                     settings, auth, errors
│   │   ├── db/                       engine, session, ORM models
│   │   ├── features/
│   │   │   ├── emergency_fund_ledger.py   shared balance and expense aggregates
│   │   │   ├── transaction_spread.py      shared dated-range day split
│   │   │   ├── financial_score/
│   │   │   ├── foundation_input/
│   │   │   ├── income_reality/
│   │   │   ├── resilience_jar/
│   │   │   ├── savings_goals/
│   │   │   ├── scenario_simulator/
│   │   │   └── scheme_navigator/
│   │   └── integrations/ai/          provider-neutral LLM transport
│   ├── scripts/                      OpenAPI export
│   └── tests/
│       ├── integration/
│       └── unit/
├── supabase/
│   ├── migrations/
│   └── tests/
├── contracts/
│   ├── fixtures/
│   ├── openapi/
│   └── schemas/
└── documentation/
    └── features/
```

## Feature map

| Feature | Frontend | Backend |
|---|---|---|
| Foundation Input | `src/app/`, `src/features/foundation-input/`, `src/lib/offline.ts` | `features/foundation_input/`, `core/`, `db/` |
| Income Reality | `src/features/income-reality/` | `features/income_reality/` |
| Emergency Fund | `src/features/resilience-jar/` | `features/resilience_jar/`, `features/emergency_fund_ledger.py` |
| Savings Goals | `src/features/savings/` | `features/savings_goals/` |
| Financial Score | `src/features/home/` | `features/financial_score/` |
| Scheme Navigator | `src/features/scheme-navigator/` | `features/scheme_navigator/`, `api/routes/scheme_navigator.py`, `integrations/ai/` |
| Setback Planner | `src/features/scenario-simulator/` | `features/scenario_simulator/` |
| Auth and landing | `src/features/auth/`, `src/features/landing/` | `core/auth.py` |

Changes to `contracts/`, `supabase/migrations/`, the app shell or shared database code affect multiple features and require corresponding tests and documentation in the same change.

## Shared modules

Two backend modules are deliberately shared rather than owned by one feature, because duplicating them is exactly how the figures drifted before:

- `app/features/emergency_fund_ledger.py` — `emergency_fund_balance()`, `weekly_essential_expenses_cents()`, `weekly_recurring_work_costs_cents()`. Each is a single SQL aggregate, called by the Foundation bootstrap, the Emergency Fund summary and the surplus calculation.
- `app/features/transaction_spread.py` — spreads a dated-range transaction evenly across its calendar days. Mirrored by `transactionDailyAmounts` in `frontend/src/features/income-reality/foundationAdapter.ts`, with both pinned to `contracts/fixtures/transaction-week-split.json`.

The formulas themselves live in [`features/emergency-fund-model.md`](features/emergency-fund-model.md).

## Dependency boundaries

- React calls FastAPI. It never connects to PostgreSQL and never holds a privileged Supabase credential; the browser's only Supabase contact is the Auth endpoint.
- FastAPI routes validate transport data and delegate to feature services.
- Every module and test imports through the single `backend.app…` root. Nothing imports a top-level `app.*`.
- Every feature route is mounted under the one `/api/v1` prefix: `/api/v1/foundation/…`, `/api/v1/income-reality/breakdown`, `/api/v1/resilience-jar/…`, `/api/v1/savings-goals/…`, `/api/v1/financial-score`, `/api/v1/scheme-navigator/…`, `/api/v1/scenario-simulator/simulate`. Only `/health`, `/ready` and `/docs` sit outside it.
- Deterministic financial, savings, scoring, scenario and eligibility logic stays inside feature modules and remains testable without FastAPI, Supabase or a model.
- LLM code receives deterministic results and curated sources only. It never calculates a financial result and never decides scheme eligibility.
- `contracts/fixtures/` holds synthetic examples only and is safe to commit.
- Schema changes are migrations under `supabase/migrations/`, never undocumented dashboard edits.

## Error envelope

Every failure the API returns uses one shape, rendered by the global handlers in `app/main.py`:

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

`details` and `fieldErrors` appear only when present. `app.core.errors.DomainError(status_code, code, message, details=None, field_errors=None)` is the single application error type; request-shape failures render as `VALIDATION_ERROR` (422), and authentication failures as `UNAUTHENTICATED` (401) or `AUTH_UNAVAILABLE` (503).

Every response carries an `X-Request-ID` header. A client-supplied one is used when it matches `^[A-Za-z0-9._-]{1,128}$`; otherwise the middleware generates a UUID.

## Validation performed

At the last full verification pass on `dev`:

- Backend suite green with `RUN_DATABASE_TESTS=1` against local Supabase, and Ruff clean.
- Frontend suite green; `tsc -b` and the production PWA build clean.
- OpenAPI exported and the frontend TypeScript contract regenerated from it.
- Migrations and the synthetic seed applied to local Supabase; pgTAP checks and `supabase db lint` clean.
- Environment examples confirmed to contain local placeholders and defaults only, with real `.env` files ignored.

## Deferred work

- End-user RLS policies matching the verified Supabase Auth subject. Ownership is currently enforced in the API layer, and the backend connects as a trusted role.
- Persisting Setback Planner scenarios; the endpoint is stateless.
- OCR, CSV import (retired), Storage, Realtime and Edge Functions.
- CI, containers and hosted deployment.
