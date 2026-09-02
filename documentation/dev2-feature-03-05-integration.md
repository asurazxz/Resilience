# dev2 Feature 03 and 05 integration

**Date:** 2026-09-02

## Scope

This integration repairs the shared files produced by merging the Emergency Fund and Scenario Simulator into `dev2`. It keeps both feature slices runnable without changing either feature's deterministic financial rules.

## Decisions and interfaces

- The root path and `/resilience-jar` open the Emergency Fund; `/resilience-jar/plan` opens its settings; `/scenario-simulator` opens the Setback Planner.
- A shared header provides client-side navigation and preserves browser history behavior.
- The Emergency Fund continues to use its synthetic browser-local adapter. The Scenario Simulator continues to call `POST /scenario-simulator/simulate`.
- The FastAPI shell mounts both the Scenario Simulator router and the synthetic Emergency Fund router under `/api/v1/resilience-jar`.
- The frontend manifest and lockfile contain the union of both features' dependencies. Architecture-specific Rolldown binaries remain transitive optional dependencies instead of being pinned directly.

## Verification

- `npm test` — 21 frontend tests passed.
- `npm run build` — TypeScript and Vite production build passed.
- `PYTHONPATH=backend:. .venv/bin/python -m unittest discover -s backend/tests -p 'test_*.py'` — 68 backend tests passed.
- Both JSON package manifests parsed successfully, Python modules compiled, and Git whitespace checks passed.
- The running application was smoke-tested through both feature routes against the local API.

## Limitations

- The current application shell, demo repositories, and local baseline editing remain provisional until Workstream 1 supplies authentication and persistence.
- The production bundle currently triggers Vite's size advisory; route-level code splitting can be added after the shared router lands.
- Cross-feature data sharing is not yet implemented: the simulator's starting savings do not automatically read the Emergency Fund's browser-local balance.
