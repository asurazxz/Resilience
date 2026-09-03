# Feature 2 — Income Reality Engine

**Date:** 2026-09-02

**Status:** Integrated into the shared app on `dev`

**Scope:** Deterministic net-income and surplus calculations, a mounted FastAPI API, shared contract and
fixtures, and a frontend route driven by Feature 1's confirmed weekly entries and immutable expense snapshots.

## User-visible scope

From a set of weekly entries (platform earnings, work costs, essential expenses), the user sees, per week:
gross earnings by platform, work costs, an optional CPF estimate, net work income, essential expenses, and
surplus (net income minus essential expenses). Across the supplied weeks, they also see a recent-income trend:
average, lowest, highest, variation, and a conservative weekly figure to plan around.

**Explicitly deferred:**
- Reading entries directly inside the backend endpoint. The Feature 1 frontend bootstrap supplies persisted
  entries through a typed adapter, keeping the Feature 2 engine storage-independent.
- Itemised work-cost breakdown (fuel, tolls, commission, etc.) — the engine accepts one aggregate
  `work_costs_cents` figure per week; itemisation belongs to Foundation Input.

## Assumptions and business rules

- **Money:** integer cents at every boundary (per `contracts/README.md`).
- **Weekly period:** ISO 8601 `week_start` date using Feature 1's confirmed Monday-start convention.
- **Input shape:** the API takes weekly entries directly in the request body rather than reading from the
  database. The frontend adapter builds that request from persisted Foundation entries, while fixtures under
  `contracts/fixtures/income-reality/` keep the storage-independent engine reproducible.
- **CPF/MediSave:** modelled as a single editable flat rate in basis points (`cpf_rate_bps`, default 800 =
  8.00%) applied to gross earnings, toggled by `apply_cpf`. This is a simplified prototype estimate, **not**
  the real statutory CPF/MediSave schedule (which depends on age band and Net Trade Income) — out of scope for
  a one-week build. When Feature 1 contains a recorded CPF variable cost, that amount overrides the estimate
  for that week and is removed from aggregate work costs to prevent a double deduction. See
  `backend/app/features/income_reality/assumptions.py` and `frontend/src/features/income-reality/foundationAdapter.ts`.
- **Negative values are not floored to zero.** A week where work costs exceed earnings, or essential expenses
  exceed net income, reports the true negative `net_income_cents` / `surplus_cents`. Flooring would hide a real
  deficit and contradict the "every displayed value traceable to formulas" acceptance check.
- **Conservative recent-income figure:** `max(0, round(raw_average - raw_stdev))` (population stdev), computed
  from the unrounded average/stdev and rounded once — never negative, intended as a safer anchor for a savings
  recommendation than the plain average. Note this can be a cent off from `average_net_income_cents -
  stdev_net_income_cents` computed from the two already-rounded display fields, since those are rounded
  independently (confirmed the hard way: an earlier hand-computed fixture used the rounded-then-subtracted
  value and `pytest` caught the 1-cent mismatch against the real engine output — see Tests performed). See
  `backend/app/features/income_reality/engine.py::calculate_recent_trend`.

The integrated UI presents those results as a plain-language trend chart: bars show money left after essentials,
the line shows income after work costs, and hover/tap reveals exact weekly values. A compact list shows only each
week's remaining amount until the user expands it for the full calculation.

## Interfaces

- **Contract:** `contracts/schemas/income-reality.schema.json` (JSON Schema, draft 2020-12) defines
  `IncomeRealityRequest` / `IncomeRealityResponse` and their nested shapes.
- **Fixtures:** `contracts/fixtures/income-reality/` — three paired request/response examples: a typical
  multi-platform week, a zero-income week, and a three-week trend that includes a costs-exceed-earnings
  (deficit) week with CPF applied.
- **API:** `POST /api/v1/income-reality/breakdown`, mounted by `backend/app/main.py` from the Feature 2 router.
- **Engine:** `backend/app/features/income_reality/engine.py` — pure, framework-independent functions
  (`calculate_week_breakdown`, `calculate_recent_trend`, `calculate_income_reality`). No FastAPI/Pydantic
  import, so it is unit-testable without the rest of the app existing.
- **Test config:** run the backend suite from the repository root so package-relative imports resolve through
  the integrated `backend.app` package.
- **Frontend:** `frontend/src/features/income-reality/` — `types.ts` (mirrors the contract), `api.ts` (shared
  Feature 1 API client), `format.ts`, and components `IncomeBreakdownCard`, `RecentTrendSummary`,
  `AssumptionsEditor`, assembled by `IncomeRealityView`.
- **Feature 1 adapter:** `foundationAdapter.ts` aggregates repeated platform rows, excludes drafts, converts
  monthly snapshots to weekly amounts with Feature 1's `round(amount × 12 ÷ 52)` convention, separates recorded
  CPF, and orders the request oldest-first. `useIncomeRealityBreakdown.ts` owns fetch/loading/error/assumptions
  state. `frontend/src/app/App.tsx` renders the page at `/income-reality` inside Feature 1's shared shell.

## Historical branch verification

The detailed results below record the original isolated feature work. They are retained for provenance and
are superseded by the integrated verification summary that follows.

Python and Node.js were not installed on the development machine at the start of this session (confirmed via
`python --version` / `node --version`, both failed — `python.exe` resolved only to the Microsoft Store install
stub). Both were installed mid-session via `winget` (`Python.Python.3.12`, `OpenJS.NodeJS.LTS`) specifically so
the following could be actually executed rather than only hand-verified:

- `backend/tests/unit/income_reality/test_engine.py` (10 tests) — multiple platforms in one week, zero income,
  costs exceeding earnings, CPF on/off (including a 0 bps no-op), a single-week trend, a multi-week trend, and
  a deficit week's effect on the conservative figure. **Executed with `pytest 9.1.1` on Python 3.12.10 — all
  10 passed.**
- `backend/tests/unit/income_reality/test_fixtures.py` (1 test) — loads each committed fixture pair and asserts
  the engine's output matches the committed response exactly. **Executed — caught a real bug on the first run**:
  the `multi-week-deficit` fixture's `conservative_weekly_income_cents` was hand-computed as
  `round(average) - round(stdev) = 14627 - 14413 = 214`, but the engine actually computes
  `round(average - stdev) = round(213.29...) = 213` from the unrounded values. Fixed the fixture to `213` and
  corrected the schema/doc wording that had implied the two were interchangeable (they are not, whenever the
  fractional parts being individually rounded don't cancel out). All tests pass after the fix.
- `backend/tests/integration/income_reality/test_router.py` (4 tests, added this session once Python was
  available) — mounts the actual router on a throwaway `FastAPI()` app via `TestClient` and checks: all three
  fixtures produce byte-for-byte matching HTTP responses, an empty `weeks` list is rejected (422), a negative
  `gross_cents` is rejected (422), and omitted `assumptions` default correctly. **Executed with `fastapi
  0.141.1` / `pydantic 2.13.5` / `httpx 0.28.1` — all 4 passed.** This was the first time `schemas.py` /
  `router.py` had been executed at all.
- **Total: 15/15 backend tests passing.** Run with `pytest tests/unit/income_reality tests/integration/income_reality -v` from `backend/`.
- **Frontend:** the isolated branch predated the shared test tooling, so its first verification used a temporary
  local Vite/TypeScript scaffold that was removed afterward:
  - `tsc --noEmit` (TypeScript 5.6.3, `@types/react` 18.3.12, matching the stack's React 18) over the entire
    `frontend/src` tree, including `useIncomeRealityBreakdown.ts` / `IncomeRealityPage.tsx`. **0 type errors.**
  - A genuine live end-to-end demo: `uvicorn` serving the real router (`backend/_demo_main.py`, a throwaway
    `FastAPI()` app identical in shape to the documented mount point) on `localhost:8000`, and a real Vite dev
    server on `localhost:5173` rendering `IncomeRealityPage` (via a throwaway `src/demo-entry.tsx` that swaps in
    different `weeks` values to stand in for the eventual Foundation manual-entry data). Confirmed both servers
    started cleanly, the backend returned the exact fixture response for a real HTTP POST, and Vite transformed
    every new/changed module (`demo-entry.tsx`, `useIncomeRealityBreakdown.ts`, `IncomeRealityPage.tsx`) with no
    compile errors. This is the first time any of the frontend code actually ran in a browser rather than only
    type-checking. Integrated Vitest coverage was added later and is summarized below.

## Known limitations

- CPF is a simplified flat-rate estimate, not the statutory schedule.
- No itemised work-cost breakdown; only an aggregate figure per week.
- Historical confirmed weeks without Feature 1 expense snapshots calculate from their recorded variable costs
  only and show a warning. Newly created weeks capture snapshots.

## Current integration verification and follow-up

- `foundationAdapter.test.ts`: mapping, monthly conversion, platform aggregation, draft filtering, and missing
  snapshot reporting.
- Shared-app API integration test: verifies the router at `/api/v1/income-reality/breakdown`.
- Full backend suite: 188 tests passed with 3 database-dependent tests skipped by default; Ruff passed.
- Full frontend suite: 26 tests passed and the production PWA build completed successfully.
- Live Playwright test: loaded `/income-reality` against FastAPI and local Supabase seed data, found no console
  errors, verified the expected `$22.69` surplus, enabled the estimator, and confirmed recorded CPF still won.

The Emergency Fund still uses its browser fixture adapter. Its future HTTP/database adapter should consume
`trend.conservative_weekly_income_cents` and weekly surplus rather than duplicating these calculations.
