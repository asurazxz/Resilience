# Development branch full-feature integration

**Updated:** 2026-09-02

## Scope

This integration repairs the shared files produced by merging all five feature branches into `dev`. It keeps the Foundation Input, Income Reality, Emergency Fund, Scenario Simulator, and Scheme Navigator slices runnable without changing their deterministic financial or scheme rules.

## Decisions and interfaces

- The Foundation shell owns routing and onboarding. It now links to Income Reality, `/resilience-jar`, `/resilience-jar/plan`, `/scenario-simulator`, and `/scheme-navigator` through React Router.
- The merged frontend manifest retains Foundation dependencies and tooling while adding Recharts for the Emergency Fund visualisation.
- The shared shell wraps every route in `ChatProvider` and mounts one `ChatWidget`, while the Scheme Navigator publishes its questionnaire answers and deterministic results into that context.
- The Emergency Fund continues to use its synthetic browser-local adapter. The Scenario Simulator continues to call `POST /scenario-simulator/simulate`.
- The FastAPI shell mounts the Scheme Navigator under `/api/scheme-navigator`, the Scenario Simulator router, and the synthetic Emergency Fund router under `/api/v1/resilience-jar`.
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

## Limitations

- Foundation data is persisted through FastAPI and PostgreSQL, but authentication remains deferred; the local app uses one anonymous synthetic demo profile.
- The production bundle currently triggers Vite's size advisory; route-level code splitting can be added after the shared router lands.
- Cross-feature data sharing is not yet implemented: the simulator's starting savings do not automatically read the Emergency Fund's browser-local balance.
