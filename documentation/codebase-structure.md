# Codebase Structure

**Date:** 2026-09-01

**Scope:** Shared folder scaffold for the one-week prototype; no application packages or deployment configuration

## Decision

Resilience uses a feature-first monorepo. The frontend and backend mirror the five development workstreams so each owner can deliver a vertical slice with fewer shared-file conflicts. Cross-cutting code is promoted into a shared directory only when multiple features actually need it.

Supabase is the managed PostgreSQL environment for shared integration and the demo. It does not replace PostgreSQL in the architecture. FastAPI remains the application boundary and connects through a standard `DATABASE_URL`, preserving portability to local or another hosted PostgreSQL instance.

## Directory map

```text
.
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── foundation-input/
│   │   │   ├── income-reality/
│   │   │   ├── resilience-jar/
│   │   │   ├── scheme-navigator/
│   │   │   └── scenario-simulator/
│   │   ├── lib/
│   │   └── types/
│   └── tests/
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   ├── core/
│   │   ├── db/
│   │   ├── features/
│   │   │   ├── foundation_input/
│   │   │   ├── income_reality/
│   │   │   ├── resilience_jar/
│   │   │   ├── scheme_navigator/
│   │   │   └── scenario_simulator/
│   │   └── integrations/
│   │       ├── ai/
│   │       └── ocr/
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

## Workstream ownership

| Branch | Frontend | Backend | Additional ownership |
|---|---|---|---|
| `feature/01-foundation-input` | `frontend/src/app/`, `frontend/src/features/foundation-input/` | `backend/app/api/`, `backend/app/core/`, `backend/app/db/`, `backend/app/features/foundation_input/` | Initial package manifests, shared database baseline, OCR integration, local setup |
| `feature/02-income-reality` | `frontend/src/features/income-reality/` | `backend/app/features/income_reality/` | Deterministic income tests and transparent breakdown contracts |
| `feature/03-resilience-jar` | `frontend/src/features/resilience-jar/` | `backend/app/features/resilience_jar/` | Savings recommendation and goal-progress tests |
| `feature/04-scheme-navigator` | `frontend/src/features/scheme-navigator/` | `backend/app/features/scheme_navigator/` | Versioned rules, official sources, and `backend/app/integrations/ai/` |
| `feature/05-scenario-simulator` | `frontend/src/features/scenario-simulator/` | `backend/app/features/scenario_simulator/` | Deterministic scenario and buffer-runway tests |

Ownership identifies the primary editor, not exclusive access. Changes to `contracts/`, `supabase/migrations/`, shared components, or shared database code require coordination with affected workstreams.

## Dependency boundaries

- React calls FastAPI; it does not connect directly to PostgreSQL or use privileged Supabase credentials.
- FastAPI routes validate transport data and delegate to feature services.
- Deterministic financial, savings, scenario, and eligibility logic stays inside feature modules and remains testable without FastAPI, Supabase, OCR, or an LLM.
- LLM code receives deterministic results and curated sources only. It does not calculate financial results or decide scheme eligibility.
- OCR returns proposed values for user confirmation; it does not silently persist extracted financial data.
- `contracts/fixtures/` contains synthetic examples only and is safe to commit.
- Schema changes are migrations under `supabase/migrations/`, not undocumented dashboard edits.

## Validation performed

- Confirmed every documented directory is represented by a tracked file.
- Confirmed environment examples contain placeholders only and real `.env` files remain ignored.
- Confirmed the private root `context/` directory remains ignored and absent from Git history.
- Confirmed no dependency installation, runnable application code, or deployment configuration was introduced.

## Deferred work

- React/Vite, Tailwind, PWA, Python, and FastAPI package manifests and runtime pins.
- FastAPI entry point, health endpoint, database connection, and migration baseline.
- Generated OpenAPI client/types and executable synthetic fixtures.
- Supabase project linking and optional Auth, Storage, Realtime, or Edge Functions.
- CI, containers, and hosted application deployment.
