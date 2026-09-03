# Branch integration record (historical)

**Date:** 2026-09-02. This documents the one-time repair of shared files after the five feature branches were merged into `dev`. For the current architecture see [`codebase-structure.md`](codebase-structure.md) and the feature documents; for setup use the [root README](../README.md).

## What this integration fixed

- Reconciled a duplicated frontend manifest, entry point, TypeScript config and Vite config into one canonical configuration; kept React 19, Tailwind 4, TypeScript 5.9, Vite 8, and added Recharts for the Emergency Fund chart.
- Mounted every backend router under one `/api/v1` prefix in `backend/app/main.py`.
- Switched backend modules to package-relative imports so `backend.app.main:app` and the test suite load the same module graph.
- Made Vite proxy `/api` and the simulator endpoint to the local API, and accept both `localhost:5173` and `127.0.0.1:5173`, avoiding loopback-hostname CORS failures.
- Backed the Emergency Fund with PostgreSQL (`SqlPlanRepository`, `SqlContributionRepository`, `SqlFinancialContextRepository`); the browser-local fixture adapter was kept only for offline demos and tests.

## Resolved since this merge

These were open at merge time and have since been closed — kept here only so the record does not read as edited into hindsight:

- Authentication was deferred at this merge (one anonymous demo profile); Supabase email/password authentication with locally verified JWTs landed 2026-09-03.
- Cross-feature data sharing was not implemented at this merge; the Setback Planner now seeds from the user's own transactions and expenses through `foundationBaseline.ts`.
