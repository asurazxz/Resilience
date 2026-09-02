# Codebase Structure

**Updated:** 2026-09-02

**Scope:** Integrated five-feature prototype on `dev`

## Decision

Resilience uses a feature-first monorepo. The frontend and backend mirror the five product features so each vertical slice keeps its UI, transport, deterministic logic, and tests together. Cross-cutting code is promoted into a shared directory only when multiple features need it.

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

## Feature map

| Feature | Frontend | Backend | Shared integration |
|---|---|---|---|
| Foundation Input | `src/app/`, `src/features/foundation-input/` | `features/foundation_input/`, `core/`, `db/` | App shell, offline queue, PostgreSQL foundation, shared API client |
| Income Reality | `src/features/income-reality/` | `features/income_reality/` | Foundation adapter and deterministic breakdown contract |
| Emergency Fund | `src/features/resilience-jar/` | `features/resilience_jar/` | Fixture adapter, summary schema, recommendation and ledger service |
| Scheme Navigator | `src/features/scheme-navigator/` | `features/scheme_navigator/`, `api/routes/scheme_navigator.py` | Versioned rules, official sources, and optional AI transport |
| Scenario Simulator | `src/features/scenario-simulator/` | `features/scenario_simulator/` | Deterministic shock model and stateless simulation endpoint |

Changes to `contracts/`, `supabase/migrations/`, the app shell, or shared database code affect multiple features and require corresponding tests and documentation in the same change.

## Dependency boundaries

- React calls FastAPI; it does not connect directly to PostgreSQL or use privileged Supabase credentials.
- FastAPI routes validate transport data and delegate to feature services.
- Deterministic financial, savings, scenario, and eligibility logic stays inside feature modules and remains testable without FastAPI, Supabase, OCR, or an LLM.
- LLM code receives deterministic results and curated sources only. It does not calculate financial results or decide scheme eligibility.
- OCR returns proposed values for user confirmation; it does not silently persist extracted financial data.
- `contracts/fixtures/` contains synthetic examples only and is safe to commit.
- Schema changes are migrations under `supabase/migrations/`, not undocumented dashboard edits.

## Validation performed

- Built the TypeScript PWA and ran 26 frontend tests.
- Ran 188 backend tests with 3 database-dependent skips and passed Ruff.
- Exported OpenAPI and generated the frontend TypeScript contract.
- Applied the migration and seed to local Supabase, ran 13 pgTAP checks, and linted all schemas without errors.
- Confirmed environment examples contain local placeholders/defaults only and real `.env` files remain ignored.

## Deferred work

- User authentication and corresponding end-user RLS policies.
- OCR, Storage, Realtime, Edge Functions, and deployment.
- CI, containers, and hosted application deployment.
