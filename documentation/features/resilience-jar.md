# Feature 03 — Emergency Fund

**Date:** 2026-09-03

> **The calculation model lives in
> [`emergency-fund-model.md`](./emergency-fund-model.md).** That document is the
> single definition of the balance `B`, the weekly essential expenses `E`, the
> goal target `T`, `reached`/`remaining`, and the weekly surplus `S_w`. This
> document describes the feature around it. Where the two disagree, the model
> document wins.

## Scope

The Emergency Fund is a mobile-first feature slice for building a safety buffer against income disruptions and unexpected costs. Users choose a weekly or monthly contribution target and record contributions or emergency use. It calculates recommendations, essential-expense coverage, milestones, and a completion projection deterministically. It never holds, transfers, or withdraws money; a withdrawal entry only records money the user moved outside Resilience. Other savings remain separate from the balance tracked in this fund.

The feature is mounted in the shared React shell at `/resilience-jar`, with less-frequent plan controls at `/resilience-jar/plan`. It is backed by PostgreSQL through `sql_repositories.py`; the typed browser fixture adapter and the in-memory repositories remain for offline demos and unit tests.

## Design decisions

- One balance function, `emergency_fund_balance()` in `backend/app/features/emergency_fund_ledger.py` (a single SQL aggregate), is called by the Foundation bootstrap, the jar summary, and the surplus calculation, so they cannot drift.
- `profile.emergencyFundBalanceCents` is the derived balance `B` and is what screens show; `profile.latestEmergencySavingsCents` is the raw stored opening balance `O`. Saving a weekly entry never writes `O` — only deposits and withdrawals change it, so the balance cannot double-count.
- `E` (weekly essential expenses) excludes recurring work costs on purpose: the fund covers weeks the user cannot work, so vehicle rental and similar work costs are not what it has to replace. They are still deducted from the weekly surplus.
- The default coverage goal is 26 weeks (about six months).
- Savings Goals are a separate feature; see [`savings-goals.md`](./savings-goals.md). They never touch the emergency-fund tables.

## Business rules

- Weeks are Singapore-local Monday through Sunday. Financial adapters supply completed weeks only.
- `latest_week` recommends 20% of the latest completed week's non-negative available surplus.
- `conservative_4_week` recommends 20% of the lower of the latest non-negative surplus and the median positive surplus from up to four completed weeks.
- Calculations floor to whole cents. No completed week produces an `insufficient_data` state; a non-positive latest week produces a zero recommendation.
- A recommendation is advisory. Changing method or previewing a weekly/monthly cadence does not change the accepted target; users must accept the suggestion or edit and save the target.
- Plans persist `target_frequency` and the exact `target_amount_cents` entered in that cadence. Weekly amounts are their own calculation value; monthly amounts use `floor(monthly × 12 ÷ 52)` as the canonical weekly equivalent for projections. Weekly recommendations shown monthly use `floor(weekly × 52 ÷ 12)`.
- A goal is either a positive amount in cents or 1–52 whole weeks of essential expenses, defaulting to 26 weeks. Coverage-goal amounts change with the current weekly essential-expense input, which counts active `essential_expenses` only.
- Progress is `B = opening balance + deposits - withdrawals`, reported as `progress.contribution_total_cents`, alongside `progress.remaining_cents` (`max(T - B, 0)`) and `progress.goal_reached` (`T is not None and B >= T`). A withdrawal must be positive and cannot exceed the tracked emergency fund balance. Percentages remain uncapped in data while the fund visual is capped at 100%.
- The projected completion date uses the accepted target's weekly equivalent, not the advisory recommendation: `today + ceil(remaining goal / weekly equivalent) × 7 days`. It is unavailable without a derived goal, pauses with the plan, and reports completion immediately when the goal is met.
- Milestones are fixed at 25%, 50%, 75%, and 100% of the current derived goal. Coverage-goal milestones recalculate when essential expenses change.
- Pausing retains all settings and contribution access while suppressing the weekly prompt.
- Deposit and withdrawal dates use Singapore's calendar day and cannot be in the future. Deposits can be edited, and both ledger entry types can be deleted when doing so would not make the tracked balance negative.
- Saving a goal records the current weekly essential-expense baseline. A later expense change produces an `expenses_changed` review state until the user reviews and saves the goal again.

## Frontend flow

- `/resilience-jar` leads with the current balance and derived coverage goal, projected completion, milestones, and a Recharts balance-over-time chart (hover shows that day's contributions, withdrawals and closing balance; labelled numerically, not by colour alone), then contribution and emergency-use controls.
- `/resilience-jar/plan` holds recommendation method, target acceptance/editing, and coverage-goal configuration. Users can preview and save a weekly or monthly target; the underlying recommendation formula stays weekly regardless of the cadence shown.
- An alert appears on both routes when essential expenses have changed since the last saved goal baseline, and links to the plan route to review it.
- Once the goal is reached, the weekly target and recommendation are replaced by a confirmation; contributions, emergency use and the starting-balance correction remain available.
- The offline demo path hydrates the fixture adapter from the last successful browser cache; the signed-in app reads from the API.

## Interfaces

The feature router factory in `backend/app/features/resilience_jar/routes.py` exposes:

- `GET /api/v1/resilience-jar/summary`
- `PATCH /api/v1/resilience-jar/plan`
- `PUT /api/v1/resilience-jar/opening-balance` — stores `O = entered_balance - N` so `B` equals what the user typed
- `POST /api/v1/resilience-jar/contributions`
- `POST /api/v1/resilience-jar/withdrawals`
- `PATCH /api/v1/resilience-jar/contributions/{contribution_id}`
- `DELETE /api/v1/resilience-jar/contributions/{contribution_id}`

Domain validation errors use `{ code, message, field_errors }`. The shared FastAPI app owns application-level transport error handling.

The reviewed summary shape is represented by:

- `contracts/schemas/resilience-jar-summary.schema.json`
- `contracts/fixtures/resilience-jar-summary.json`
- `frontend/src/features/resilience-jar/types.ts`

Money crossing an interface is integer cents. Dates are ISO 8601 strings. Plans expose `target_frequency`, the exact selected-cadence `target_amount_cents`, and the derived `weekly_target_cents` used by deterministic calculations. Ledger entries are discriminated by `entry_type: "deposit" | "withdrawal"`. A `null` goal target, projection, or coverage value means the required goal or essential-expense data is unavailable.

The plan stores `goal_expense_baseline_cents`. The summary returns `goal_review` with `up_to_date`, `expenses_changed`, or `unavailable`, plus previous/current weekly values and the signed change. Monthly values shown in the UI are explanatory approximations derived as `weekly × 52 ÷ 12`; the API keeps weekly cents as the source of truth.

## Integration

- The shared shell mounts `ResilienceJarPage` at `/resilience-jar` and `/resilience-jar/plan`, lazily, and the page defaults to `HttpResilienceJarApi`. `FixtureResilienceJarApi` is injected only by tests and offline demos.
- `create_router(service, user_id_provider=...)` is the backend seam; the router resolves the caller through the verified Supabase subject.
- The three repository protocols in `repositories.py` are implemented against PostgreSQL in `sql_repositories.py`: one plan per user, a user-scoped contribution ledger, and completed weekly surpluses read through the shared `emergency_fund_ledger` aggregates.
- The Home page and the Income overview read the fund summary through the same client, so the balance shown there cannot diverge from the fund tab.
- The last successful summary is cached for read-only offline display. Mutations are disabled offline; they do not enter the Foundation mutation queue.

## Tests

Database-backed seam tests (`RUN_DATABASE_TESTS=1`) cover the balance-double-count regression, the three shared ledger functions, and `SqlPlanRepository`/`SqlContributionRepository`/`SqlFinancialContextRepository` against the real SQL path, each on a throwaway user. Unit tests cover both recommendation formulas, cent rounding, weak/negative weeks, weekly/monthly target conversion, both goal modes, expense-change review, withdrawal balance enforcement, completion projections, and milestone states. See the [root README](../../README.md#tests) for the commands.

## Limitations and follow-up

- The offline fixture adapter is backed only by that browser origin's local cache. Clearing site data, changing browser/origin, or an incompatible future fixture shape resets the demo.
- `progress_percent` and `milestones` are still returned for compatibility but no screen renders them; the model document treats `remaining`, `coverage_weeks`, and `reached` as the user-facing numbers.
- Whether work costs belong in `E` is a reversible assumption. Changing it means changing `weekly_essential_expenses_cents()` in `emergency_fund_ledger.py` and nothing else.
- Authentication, real money movement, notifications, deployment, and elaborate animation remain out of scope.
