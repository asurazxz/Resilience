# dev2 Feature 03, 04, and 05 integration

**Date:** 2026-09-02

## Scope

This integration repairs the shared files produced by merging the Scheme Navigator into the existing Emergency Fund and Scenario Simulator application on `dev2`. It keeps all three feature slices runnable without changing their deterministic financial or scheme rules.

## Decisions and interfaces

- The root path and `/resilience-jar` open the Emergency Fund; `/resilience-jar/plan` opens its settings; `/scenario-simulator` opens the Setback Planner; `/scheme-navigator` opens scheme pre-screening.
- A shared header provides client-side navigation and preserves browser history behavior.
- The shared shell wraps every route in `ChatProvider` and mounts one `ChatWidget`, while the Scheme Navigator publishes its questionnaire answers and deterministic results into that context.
- The Emergency Fund continues to use its synthetic browser-local adapter. The Scenario Simulator continues to call `POST /scenario-simulator/simulate`.
- The FastAPI shell mounts the Scheme Navigator under `/api/scheme-navigator`, the Scenario Simulator router, and the synthetic Emergency Fund router under `/api/v1/resilience-jar`.
- The frontend keeps the established React 19, Tailwind 4, TypeScript 7, and Vite 8 stack. The invalid duplicated manifest and lockfile were rebuilt from that canonical dependency set.
- The backend keeps the established FastAPI/Pydantic versions and adds the Scheme Navigator's pytest, environment, trust-store, HTTP, and Groq dependencies.
- Vite proxies `/api` and the simulator endpoint to the local API by default. Direct API calls also accept both `localhost:5173` and `127.0.0.1:5173`, avoiding loopback-hostname CORS failures.

## Verification

- `npm test` — 22 frontend tests passed, including the Scheme Navigator route.
- `npm run build` — TypeScript and Vite production build passed.
- `PYTHONPATH=backend:. .venv/bin/python -m pytest backend/tests -q` — 162 backend tests passed.
- Both JSON package manifests parsed successfully, Python modules compiled, dependency installation completed, and Git whitespace checks passed.
- Browser testing at desktop and 375-pixel mobile widths verified the questionnaire, all-matched result flow, deterministic explanation fallback, result-aware chatbot fallback, navigation to both existing features, retained chat state across routes, and an empty error/warning console.

## Limitations

- The current application shell, demo repositories, and local baseline editing remain provisional until Workstream 1 supplies authentication and persistence.
- The production bundle currently triggers Vite's size advisory; route-level code splitting can be added after the shared router lands.
- Cross-feature data sharing is not yet implemented: the simulator's starting savings do not automatically read the Emergency Fund's browser-local balance.
