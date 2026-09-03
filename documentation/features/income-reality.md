# Income Reality

**Updated:** 2026-09-03

**Status:** Integrated on `dev`

**Scope:** Deterministic net-income and surplus calculations, the `/api/v1/income-reality/breakdown` endpoint, the shared contract and fixtures, and the Income overview screen driven by the user's own transactions.

## User-visible scope

For each recorded week the user sees gross recorded income, work costs, an optional CPF estimate, net work income, essential expenses, and the surplus left after essentials. Across those weeks they also see a trend: average, lowest, highest, variation, and a conservative weekly figure to plan around.

The screen presents this as a plain-language trend chart — bars for money left after essentials, a line for income after work costs, with hover or tap revealing exact weekly values. A compact list shows each week's remaining amount until the user expands it for the full calculation.

**Deferred:**

- Reading transactions inside the backend endpoint. The client supplies weeks in the request body through a typed adapter, which keeps the engine storage-independent.
- Itemised work-cost breakdown. The engine takes one aggregate `work_costs_cents` per week; itemisation belongs to Foundation Input.

## Assumptions and business rules

- **Money:** integer cents at every boundary.
- **Weekly period:** ISO 8601 `week_start`, Monday-start, Singapore-local calendar days.
- **Input shape:** the API takes weekly entries directly in the request body rather than reading from the database. `adaptTransactions` in `frontend/src/features/income-reality/foundationAdapter.ts` builds that request from the user's transactions; the fixtures under `contracts/fixtures/income-reality/` keep the engine reproducible on its own.
- **The same three deductions as everywhere else.** A week's surplus subtracts variable cost transactions, weekly-normalised recurring work costs, and weekly-normalised essential expenses — the same definition the Emergency Fund's recommendation and the Financial Score use. It is specified in section 6 of [`emergency-fund-model.md`](./emergency-fund-model.md), which is the source of truth. Without the last two deductions this screen reported a larger surplus than every other feature.
- **Dated ranges spread by day.** A transaction with `occurredUntil` has its amount split evenly across every calendar day in the inclusive range, and each day folded into its own Monday-Sunday week, so one transaction can contribute to several weeks. The rule is defined once in [`emergency-fund-model.md`](./emergency-fund-model.md#spreading-a-dated-range-transaction-across-weeks), implemented in `backend/app/features/transaction_spread.py`, mirrored by `transactionDailyAmounts`, and pinned by `contracts/fixtures/transaction-week-split.json`.
- **Monthly to weekly** conversion is `round(amount × 12 ÷ 52)`.
- **CPF/MediSave** is a single editable flat rate in basis points (`cpf_rate_bps`, default 800 = 8.00%) applied to gross earnings and toggled by `apply_cpf`. This is a simplified prototype estimate, **not** the statutory CPF/MediSave schedule, which depends on age band and Net Trade Income. The engine still honours a `recorded_cpf_cents` override for a week — it takes priority over the estimate and is removed from aggregate work costs to prevent a double deduction — but the transaction adapter does not currently populate it, so in the running app the estimate always applies.
- **Negative values are not floored to zero.** A week where costs exceed earnings, or essentials exceed net income, reports the true negative figure. Flooring would hide a real deficit and break the traceability the feature is built on.
- **Conservative recent-income figure:** `max(0, round(raw_average - raw_stdev))` using population standard deviation, computed from the unrounded values and rounded once. This can be a cent away from subtracting the two already-rounded display fields, because those are rounded independently. A hand-computed fixture made exactly that mistake and `pytest` caught the one-cent mismatch. See `backend/app/features/income_reality/engine.py::calculate_recent_trend`.

## Interfaces

- **Contract:** `contracts/schemas/income-reality.schema.json` (JSON Schema, draft 2020-12) defines `IncomeRealityRequest` and `IncomeRealityResponse`.
- **Fixtures:** `contracts/fixtures/income-reality/` — three paired request/response examples: a typical multi-platform week, a zero-income week, and a three-week trend including a deficit week with CPF applied.
- **API:** `POST /api/v1/income-reality/breakdown`.
- **Engine:** `backend/app/features/income_reality/engine.py` — pure functions (`calculate_week_breakdown`, `calculate_recent_trend`, `calculate_income_reality`) with no FastAPI or Pydantic import, unit-testable on their own.
- **Frontend:** `frontend/src/features/income-reality/` — `types.ts` mirrors the contract, `api.ts` uses the shared client, `foundationAdapter.ts` builds the request, `useIncomeRealityBreakdown.ts` owns fetch/loading/error/assumption state, and `IncomeRealityPage` renders at `/income-reality`.

`foundationAdapter.ts` is also consumed outside this feature: the Home screen's current-week card and weekly trend chart, and the Setback Planner's baseline, all derive their weeks from `adaptTransactions` so no two screens group days differently.

## Tests performed

- `backend/tests/unit/income_reality/test_engine.py` — multiple platforms in one week, zero income, costs exceeding earnings, CPF on and off including a 0 bps no-op, single-week and multi-week trends, and a deficit week's effect on the conservative figure.
- `backend/tests/unit/income_reality/test_fixtures.py` — loads each committed fixture pair and asserts the engine's output matches exactly. This caught the rounding error described above on its first run.
- `backend/tests/integration/income_reality/test_router.py` — the mounted router via `TestClient`: all three fixtures match byte for byte, an empty `weeks` list is rejected (422), a negative `gross_cents` is rejected (422), and omitted `assumptions` default correctly.
- `foundationAdapter.test.ts` — transaction grouping, the daily spread against the shared fixture, monthly normalisation, and platform aggregation.
- `frontend/tests/income-reality.e2e.ts` (Playwright, `npm run test:integration`) exercised this screen when it was written, but it drives routes and a weekly-entry save form (`/settings`, `/entries/:weekStart`) that predate the current transaction-ledger UI (`/profile`, `/transactions`). It has not been updated for the current screens — see Known limitations.

## Known limitations

- CPF is a simplified flat-rate estimate, not the statutory schedule, and the recorded-CPF override is unreachable from the current UI.
- No itemised work-cost breakdown; only an aggregate figure per week.
- The transaction adapter labels all income as a single "Recorded income" platform, so the per-platform breakdown the engine supports is not currently populated by the app.
- Weeks with no recorded transactions do not appear at all, rather than appearing as a zero week.
- The Playwright end-to-end journey (`frontend/tests/income-reality.e2e.ts`) targets the retired weekly-entry save form and settings route; it is out of date with the current transactions-based screens and does not currently exercise them.
