# Development branch full-feature integration

**Updated:** 2026-09-02

> **Historical record.** This documents the one-time repair of the shared files after the five feature branches were merged into `dev`. Later sessions added authentication, Savings Goals, the Financial Score, dated-range transactions and the landing page, and replaced the visual system. For the current architecture use [`codebase-structure.md`](codebase-structure.md) and the feature documents; for setup use the [root README](../README.md).

## Scope

This integration repairs the shared files produced by merging all five feature branches into `dev`. It keeps the Foundation Input, Income Reality, Emergency Fund, Scenario Simulator, and Scheme Navigator slices runnable without changing their deterministic financial or scheme rules.

## Decisions and interfaces

- The Foundation shell owns routing and onboarding. It now links to Income Reality, `/resilience-jar`, `/resilience-jar/plan`, `/scenario-simulator`, and `/scheme-navigator` through React Router.
- The merged frontend manifest retains Foundation dependencies and tooling while adding Recharts for the Emergency Fund visualisation.
- The shared shell wraps every route in `ChatProvider` and mounts one `ChatWidget`, while the Scheme Navigator publishes its questionnaire answers and deterministic results into that context.
- The Emergency Fund is now backed by PostgreSQL through `SqlPlanRepository`, `SqlContributionRepository`, and `SqlFinancialContextRepository`; the browser-local fixture adapter is kept only for offline demos. The Scenario Simulator continues to call `POST /scenario-simulator/simulate`.
- Every router is mounted under the single `/api/v1` prefix in `backend/app/main.py`: Foundation Input at `/api/v1/foundation`, Income Reality at `/api/v1/income-reality`, Scheme Navigator at `/api/v1/scheme-navigator`, the Scenario Simulator at `/api/v1/scenario-simulator`, Savings Goals at `/api/v1/savings-goals`, and the Emergency Fund at `/api/v1/resilience-jar`.
- The frontend keeps React 19, Tailwind 4, TypeScript 5.9, and Vite 8. The invalid duplicated manifest, entry point, TypeScript config, and Vite config were reconciled into one canonical configuration.
- Backend modules use package-relative imports so the documented `backend.app.main:app` launch and the test suite load the same module graph.
- The backend keeps the established FastAPI/Pydantic versions and adds the Scheme Navigator's pytest, environment, trust-store, HTTP, and Groq dependencies.
- Vite proxies `/api` and the simulator endpoint to the local API by default. Direct API calls also accept both `localhost:5173` and `127.0.0.1:5173`, avoiding loopback-hostname CORS failures.

## Verification

- `npm run test:frontend` — 26 frontend tests passed across Vitest and the retained Node test suites.
- `npm run build:frontend` — TypeScript, Vite, and PWA generation passed.
- `.venv313/Scripts/python.exe -m pytest backend/tests -q` — 188 backend tests passed and 3 database-dependent tests were skipped.
- `.venv313/Scripts/python.exe -m ruff check backend` — passed.
- Live health checks returned 200 for the PWA, API health, database readiness, and Scheme Navigator questionnaire.
- Both JSON package manifests parsed successfully, Python modules compiled, dependency installation completed, and Git whitespace checks passed.
- Browser testing at desktop and 375-pixel mobile widths verified the questionnaire, all-matched result flow, deterministic explanation fallback, result-aware chatbot fallback, navigation to both existing features, retained chat state across routes, and an empty error/warning console.

## Limitations recorded at the time (since resolved)

These were open at this merge and have since been closed. They are kept here so the record reads honestly rather than being edited into hindsight.

- Authentication was deferred and the app used one anonymous synthetic demo profile. Supabase email/password authentication with locally verified JWTs landed on 2026-09-03.
- The production bundle triggered Vite's size advisory. Chart-heavy routes were later split out of the initial bundle.
- Cross-feature data sharing was not implemented: the simulator did not read real balances. The Setback Planner is now seeded from the user's own transactions and expenses through `foundationBaseline.ts`.
- The Emergency Fund's browser fixture adapter has since been reduced to a test and offline-demo fallback; the feature is database-backed.
