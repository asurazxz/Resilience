# Resilience

A mobile-first PWA that helps Singapore platform workers plan around income that changes every week.

Team Zephyrries' prototype for the Singapore Management University Ellipsis Tech Series 2026 Hackathon.

> Resilience provides estimates and navigation, not financial advice. Scheme eligibility is pre-screening only and is confirmed solely by the relevant agency.

## The problem

A delivery rider or private-hire driver earns a different amount every week. Almost every budgeting tool assumes a monthly salary, so it asks for one number the worker does not have, then reports a monthly surplus that no real week matches. The advice that follows is built on a figure that was never true.

The same workers are also the ones government support schemes are aimed at, and those schemes are hard to navigate: scattered across agencies, written in eligibility language, and easy to give up on before finding the one that applies.

## What Resilience does

| Area | What the user gets |
|---|---|
| Transactions | Records income and costs against a date, or a date range — a month's insurance or a multi-day gig is spread evenly across every day it covers, so it lands in the weeks it actually belongs to. |
| Income overview | Weekly net work income and surplus after work costs, recurring costs and essentials, with a trend across recent weeks and every deduction shown. |
| Emergency fund | A database-backed fund with a default goal of 26 weeks — about six months — of essential expenses. Deposits, recorded emergency use, coverage in weeks, and a projected completion date. |
| Savings goals | Named goals beside the fund, each with its own contributions and cumulative-progress chart. Savings-goal money never touches the emergency fund. |
| Financial score | A deterministic score out of 100 over emergency fund, savings habit and cash flow, with a component breakdown and a named next step. |
| Setback planner | Simulates an income shock — earnings drop, weeks affected, a one-off cost — and reports weekly cash flow, buffer runway and any shortfall. |
| Scheme navigator | A short questionnaire drives a deterministic eligibility pre-screen against versioned rules, with official sources and links. An AI assistant explains the results in plain language. |
| Landing page | A public front door for signed-out visitors, with one call to action. |

Everything sits behind Supabase email/password authentication. Access tokens are verified locally by the API.

## What makes it different

**Every displayed figure traces to a documented formula.** The emergency fund, the financial score and the weekly surplus are each specified in `documentation/features/`, down to the rounding. Nothing on screen is a number the user cannot follow back to their own inputs.

**AI never calculates money and never decides eligibility.** The scheme evaluator is a pure function over versioned rules; the assistant receives its decisions and rephrases them. Switch the model off entirely and the whole core journey still works — the assistant answers from the evaluator's own matched facts and unmatched reasons instead of a generated summary.

**One definition of weekly surplus, pinned by a fixture.** The API and the Income overview screen compute a week's surplus from the same three deductions, and both implementations of the date-range spread are checked against the committed fixture `contracts/fixtures/transaction-week-split.json`. The two cannot drift apart without a test failing.

**It works offline.** Bootstrap data is cached in IndexedDB and writes go into an ordered mutation queue with idempotency keys, replayed in sequence on reconnect. These users are frequently on patchy mobile data, which is exactly when they are between jobs and have a moment to record one.

## Stack

- **Client:** React 19, TypeScript 5.9, Vite 8, Tailwind CSS 4, React Router 7, Recharts, Dexie, vite-plugin-pwa.
- **API:** Python 3.13 (3.12 supported), FastAPI, Pydantic, SQLAlchemy, psycopg. Every route is mounted under `/api/v1` and every failure renders one error envelope.
- **Database:** Supabase-managed PostgreSQL, reached only through FastAPI. The browser never receives database credentials.
- **AI:** Google Gemini (`gemini-3.6-flash`), optional. Configured by `GEMINI_API_KEY`; without it the assistant falls back to deterministic answers.

Deployment, containers and CI are out of scope for this prototype.

## Getting started

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Git | any recent | |
| Node.js | 24.x (`.nvmrc` pins `24`) | npm 11 or newer |
| Python | 3.13, or 3.12 | Python 3.14 does not work — the pinned `psycopg-binary`, `pydantic-core` and Uvicorn extras have no compatible wheels for it |
| Docker | Desktop, running | Required by the local Supabase stack |
| Supabase CLI | 2.116.0 | Installed by `npm install` at the repository root. Do not install a different global version |

### 1. Clone and install the root tooling

```bash
git clone <repository-url>
cd Resilience
npm install
```

`npm install` installs the frontend workspace and the pinned Supabase CLI.

### 2. Create and activate a Python virtual environment

Windows (PowerShell):

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS and Linux:

```bash
python3.13 -m venv .venv
source .venv/bin/activate
```

If only Python 3.12 is available, substitute it. If an existing `.venv` was created with Python 3.14, leave it and create a separate one (`py -3.13 -m venv .venv313`), then use that path everywhere below.

### 3. Install the backend dependencies

```bash
.\.venv\Scripts\python.exe -m pip install -r backend/requirements-dev.txt
```

`requirements-dev.txt` includes `requirements.txt` plus pytest and Ruff.

### 4. Create the environment files

Windows (PowerShell):

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

macOS and Linux:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Both `.env` files are gitignored. Never commit one, and never paste a real key into documentation.

**`backend/.env`**

| Variable | Purpose | Required |
|---|---|---|
| `APP_ENV` | Environment marker. Defaults to `development`. | Optional |
| `DATABASE_URL` | SQLAlchemy connection string. Must use the psycopg dialect (`postgresql+psycopg://…`). The example already points at local Supabase. | Optional locally, required when pointing at a hosted database |
| `FRONTEND_ORIGIN` | Origin allowed by CORS. `localhost:5173` and `127.0.0.1:5173` are always allowed. | Optional |
| `CORS_ALLOW_ORIGINS` | Comma-separated extra allowed origins. | Optional |
| `SUPABASE_URL` | Supabase project URL. Used to build the JWKS URL and the `/auth/v1/user` fallback. | Required to sign in |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key sent as `apikey` on the remote token-check fallback. | Optional |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used to delete a signed-in user’s Supabase account. Never add it to the frontend environment. | Required to delete accounts |
| `SUPABASE_JWT_SECRET` | HS256 secret. Local Supabase signs HS256, so this is what makes local sign-in work. Copy `JWT_SECRET` from `npx supabase status`. | Required locally |
| `SUPABASE_JWT_AUDIENCE` | Expected `aud` claim. Defaults to `authenticated`. | Optional |
| `DB_POOL_SIZE` | SQLAlchemy pool size. Defaults to `5`. | Optional |
| `DB_MAX_OVERFLOW` | SQLAlchemy overflow. Defaults to `5`. | Optional |
| `GEMINI_API_KEY` | Enables AI-written scheme explanations and chat replies. Leave blank and both fall back to deterministic answers. | Optional |
| `GEMINI_MODEL` | Model id. Defaults to `gemini-3.6-flash`. Do not switch to `gemini-flash-latest` — it hangs indefinitely on this API. | Optional |
| `GEMINI_BASE_URL` | Gemini API host root. Has a default. | Optional |
| `GEMINI_TIMEOUT_SECONDS` | Request timeout in seconds, 0–180. Defaults to `90` (generous because thinking tokens are billed and invisible). Not in `.env.example`. | Optional |

**`frontend/.env`**

| Variable | Purpose | Required |
|---|---|---|
| `VITE_API_BASE_URL` | Public API origin for a built bundle. In development Vite proxies `/api` to `127.0.0.1:8000`, so leave it blank. | Optional locally |
| `VITE_SUPABASE_URL` | Supabase URL the browser signs in against. Local: `http://127.0.0.1:54321`. | Required to sign in |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key. Copy `PUBLISHABLE_KEY` from `npx supabase status`. | Required to sign in |

No database URL, password, secret key or service-role key belongs in `frontend/.env`. All persistence goes through FastAPI.

### 5. Start Supabase and apply the migrations

With Docker running, from the repository root:

```bash
npm run db:start
npm run db:reset
```

`db:reset` rebuilds the local database from every file in `supabase/migrations/` and applies the synthetic seed. Then read the local credentials and paste them into the two `.env` files:

```bash
npx supabase status
```

Copy `JWT_SECRET` into `SUPABASE_JWT_SECRET`, `PUBLISHABLE_KEY` into `VITE_SUPABASE_PUBLISHABLE_KEY`, and `SERVICE_ROLE_KEY` into the server-only `SUPABASE_SERVICE_ROLE_KEY`. Set `SUPABASE_URL` and `VITE_SUPABASE_URL` to `http://127.0.0.1:54321`.

### 6. Run the API

In its own terminal, from the repository root, with the virtual environment active:

```bash
npm run dev:backend
```

Run it from the repository root, not from `backend/` — every module imports through the single `backend.app…` root.

### 7. Run the client

In a third terminal, from the repository root:

```bash
npm run dev:frontend
```

### 8. Confirm it works

| Check | Expected |
|---|---|
| `curl http://127.0.0.1:8000/health` | `{"status":"ok"}` |
| `curl http://127.0.0.1:8000/ready` | `{"status":"ready"}` — this one opens a database connection |
| `http://localhost:8000/docs` | Interactive API documentation listing routes under `/api/v1` |
| `http://127.0.0.1:54323` | Supabase Studio |
| `http://localhost:5173` | The landing page. Create an account, complete onboarding, add a transaction, and the Home page shows a financial score. |

On PowerShell use `Invoke-RestMethod http://127.0.0.1:8000/ready` instead of `curl`.

To stop: `Ctrl+C` in the API and client terminals, then `npm run db:stop`.

## Troubleshooting

**A route returns 404 that the code clearly defines.** `uvicorn --reload` picks up edits to existing files, but a process started before a route module existed will keep answering 404 for it. This cost real debugging time on the financial-score route. Restart the API process.

**The AI assistant answers, but blandly.** With no `GEMINI_API_KEY` configured, or when the provider is rate-limited (Gemini's free tier), the explainer and chat fall back to deterministic text built from the evaluator's own matched facts and never raise an error — by design, so the core journey cannot depend on a model. The response carries `is_ai_generated: false`; check that field before concluding the model is misbehaving.

**Sign-in fails or every API call returns 401.** The JWT secret in `backend/.env` must be the one the local Supabase instance is signing with. Re-run `npx supabase status` after any `db:start` and re-copy `JWT_SECRET`.

**Uvicorn will not start, or psycopg fails to import.** The virtual environment is probably Python 3.14. In this checkout, `.venv` is Python 3.14 and cannot run the app — use `.venv313` (Python 3.13), or recreate your own with 3.13 or 3.12.

**`ModuleNotFoundError: backend`.** The API was started from inside `backend/`. Start it from the repository root.

**Queued writes never clear.** The client queues mutations while offline and replays them in order; one failed mutation blocks the ones behind it. The sync status panel names the failure.

## Tests

```bash
# Backend: unit and integration tests, plus lint
python -m pytest backend/tests -q
python -m ruff check backend

# Backend including the tests that need a running local Supabase
RUN_DATABASE_TESTS=1 python -m pytest backend/tests -q

# Frontend: Vitest plus the Node test-runner suites
npm run test:frontend
npm run build:frontend

# Database
npm run db:test
npm run db:lint
```

On PowerShell, set the database-test flag with `$env:RUN_DATABASE_TESTS = "1"` before the pytest command.

After changing any FastAPI schema, regenerate the shared contract:

```bash
python -m backend.scripts.export_openapi
npm run generate:api
```

## Repository layout

```text
frontend/       React and TypeScript PWA, organised by product feature
backend/        FastAPI application and deterministic engines
supabase/       Ordered PostgreSQL migrations and database tests
contracts/      Shared OpenAPI export, JSON Schemas, and synthetic fixtures
documentation/  Architecture, feature specifications, and decisions
```

See [`documentation/codebase-structure.md`](documentation/codebase-structure.md) for the full directory map and dependency rules.

## Documentation

- [Codebase structure](documentation/codebase-structure.md) — architecture, boundaries, and placement rules.
- [Emergency fund and savings model](documentation/features/emergency-fund-model.md) — the single source of truth for the fund, weekly surplus, and date-range spread formulas.
- [Financial score](documentation/features/financial-score.md)
- [Foundation input](documentation/features/foundation-input.md) · [Income reality](documentation/features/income-reality.md) · [Emergency fund](documentation/features/resilience-jar.md) · [Savings goals](documentation/features/savings-goals.md) · [Scheme navigator](documentation/features/scheme-navigator.md) · [Setback planner](documentation/features/scenario-simulator.md)
- [Integration record](documentation/dev2-feature-03-05-integration.md) and [initial scaffold](documentation/initial-scaffold.md) — historical context.
- [`.agent/RULES.md`](.agent/RULES.md), [`.agent/session_log.md`](.agent/session_log.md), [`.agent/lessons_learnt.md`](.agent/lessons_learnt.md) — operating rules and project memory for coding agents.

## Contributing

Branch from `dev` as `feature/short-name`, `fix/short-name` or `docs/short-name`, and merge reviewed work back into `dev`. Never commit directly to `main`. Add tests for every deterministic calculation and rule change, mock the model in tests, and update `documentation/` in the same change.

Do not commit `.env` files, credentials, database dumps, or real financial data. The `context/` directory is gitignored because the source materials contain personal information; team members receive them privately.

## License

No open-source license has been selected. All rights are reserved until the team adds a license file.
