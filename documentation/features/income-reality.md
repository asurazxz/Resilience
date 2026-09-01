# Income Reality Engine (Workstream 2)

**Date:** 2026-09-01

**Branch:** `feature/02-income-reality`

**Scope:** Deterministic net-income and surplus calculations, an unmounted FastAPI router, a proposed shared
contract with fixtures, and bare-bones frontend UI. No app scaffolding (dependency manifests, FastAPI entry
point, Vite setup) — that is `feature/01-foundation-input`'s ownership per `backend/README.md` and
`frontend/README.md`, and it had not landed on any branch as of this session.

## User-visible scope

From a set of weekly entries (platform earnings, work costs, essential expenses), the user sees, per week:
gross earnings by platform, work costs, an optional CPF estimate, net work income, essential expenses, and
surplus (net income minus essential expenses). Across the supplied weeks, they also see a recent-income trend:
average, lowest, highest, variation, and a conservative weekly figure to plan around.

**Explicitly deferred:**
- Mounting the router into a running FastAPI app (blocked on `feature/01-foundation-input`'s `app/main.py`).
- Reading entries from persisted storage — this version takes weekly entries directly in the request body (see
  Decisions below).
- Any visual design pass on the frontend components — bare-bones markup only, per explicit scope direction this
  session.
- Itemised work-cost breakdown (fuel, tolls, commission, etc.) — the engine accepts one aggregate
  `work_costs_cents` figure per week; itemisation, if any, belongs to Workstream 1's data intake.

## Assumptions and business rules

- **Money:** integer cents at every boundary (per `contracts/README.md`).
- **Weekly period:** ISO 8601 `week_start` date, Monday-start convention. Proposed by this workstream in
  `contracts/schemas/income-reality.schema.json` since no other branch had fixed a convention yet — needs
  confirmation against `feature/01-foundation-input`'s persisted entry schema when it lands.
- **Input shape:** the API takes weekly entries directly in the request body rather than reading from the
  database. This lets the frontend and backend both develop against `contracts/fixtures/income-reality/`
  before Supabase migrations exist, per the shared-contracts note in `documentation/initial-scaffold.md`.
  Persistence becomes a thin adapter later; `engine.py` itself is storage-agnostic and unaffected.
- **CPF/MediSave:** modelled as a single editable flat rate in basis points (`cpf_rate_bps`, default 800 =
  8.00%) applied to gross earnings, toggled by `apply_cpf`. This is a simplified prototype estimate, **not**
  the real statutory CPF/MediSave schedule (which depends on age band and Net Trade Income) — out of scope for
  a one-week build. See `backend/app/features/income_reality/assumptions.py`.
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

## Interfaces

- **Contract:** `contracts/schemas/income-reality.schema.json` (JSON Schema, draft 2020-12) defines
  `IncomeRealityRequest` / `IncomeRealityResponse` and their nested shapes. Marked as a proposal, not final
  authority, per `documentation/initial-scaffold.md`.
- **Fixtures:** `contracts/fixtures/income-reality/` — three paired request/response examples: a typical
  multi-platform week, a zero-income week, and a three-week trend that includes a costs-exceed-earnings
  (deficit) week with CPF applied.
- **API (unmounted):** `POST /income-reality/breakdown` in `backend/app/features/income_reality/router.py`.
  Intended mount point for whoever wires `app/main.py`:
  ```python
  from app.features.income_reality.router import router as income_reality_router
  app.include_router(income_reality_router, prefix="/income-reality", tags=["income-reality"])
  ```
- **Engine:** `backend/app/features/income_reality/engine.py` — pure, framework-independent functions
  (`calculate_week_breakdown`, `calculate_recent_trend`, `calculate_income_reality`). No FastAPI/Pydantic
  import, so it is unit-testable without the rest of the app existing.
- **Test config:** `backend/pytest.ini` sets `pythonpath = .` so `from app...` imports resolve when running
  `pytest` from `backend/` (or `pytest backend/tests` from the repo root), without needing a package install or
  `feature/01-foundation-input`'s eventual dependency manifest.
- **Frontend:** `frontend/src/features/income-reality/` — `types.ts` (mirrors the contract), `api.ts` (fetch
  wrapper, not runnable until Vite/`import.meta.env` typing exists), `format.ts`, and bare-bones components
  `IncomeBreakdownCard`, `RecentTrendSummary`, `AssumptionsEditor`, assembled by `IncomeRealityView`.

## Tests performed

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
- **Frontend:** no test tooling exists yet (owned by Workstream 1 — component tests are meant to land "when the
  test tooling is selected," per `frontend/README.md`), so no component tests were written. As a substitute
  sanity check, ran `tsc --noEmit` (TypeScript 5.6.3, `@types/react` 18.3.12, matching the stack's React 18) over
  every file in `frontend/src/features/income-reality/`, using a temporary `package.json`/`tsconfig.json`/
  `vite-env.d.ts` placed directly under `frontend/` (required — TypeScript's module resolution needs
  `node_modules` to be an actual filesystem ancestor of the files being checked, not just present somewhere on
  disk) and removed immediately afterward. **Result: 0 type errors** across `types.ts`, `format.ts`, `api.ts`,
  and all four components. This is a type-check only, not a rendered/behavioural test — no Vitest/React Testing
  Library run has happened.

## Known limitations

- Router is not mounted; API is not callable until `feature/01-foundation-input` lands `app/main.py`.
- Frontend feature code is not runnable in the browser until `feature/01-foundation-input` lands the real
  Vite/package.json setup — the `tsc` check above only confirms the TypeScript compiles, not that it renders.
- CPF is a simplified flat-rate estimate, not the statutory schedule.
- No itemised work-cost breakdown; only an aggregate figure per week.
- No component-level (Vitest/RTL) frontend tests yet — blocked on Workstream 1 choosing the test tooling.
- Frontend components are intentionally unstyled.

## Next integration step

1. Mount the router as documented above once `feature/01-foundation-input` lands `app/main.py`.
2. Confirm or renegotiate the Monday-start `week_start` convention against the persisted entry schema.
3. Wire `frontend/src/features/income-reality/api.ts` into an actual page in `frontend/src/app/`, replacing
   fixture data with a live `fetchIncomeBreakdown` call, once Vite is set up.
4. Once Workstream 1 picks frontend test tooling, add component tests colocated with the source (per
   `frontend/README.md`'s placement rule) for `IncomeBreakdownCard`, `RecentTrendSummary`, and
   `AssumptionsEditor`.
5. When Workstream 1's persistence lands, add a thin adapter that reads a user's saved entries and builds the
   `IncomeRealityRequest` — `engine.py` itself should not need to change.
