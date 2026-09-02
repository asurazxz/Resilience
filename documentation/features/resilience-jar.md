# Feature 03 — Emergency Fund

**Date:** 2026-09-01

## Scope

The Emergency Fund is a mobile-first feature slice for building a safety buffer against income disruptions and unexpected costs. Users choose a weekly or monthly contribution target and record contributions or emergency use. It calculates recommendations, essential-expense coverage, milestones, and a completion projection deterministically. It never holds, transfers, or withdraws money; a withdrawal entry only records money the user moved outside Resilience. Other savings remain separate from the balance tracked in this fund.

The feature is mounted in the shared React shell at `/resilience-jar`, with less-frequent plan controls at `/resilience-jar/plan`. It currently uses a typed browser fixture adapter; the backend domain service and in-memory repositories remain available behind the stable `resilience-jar` interfaces. Database persistence and live Income Reality inputs are follow-up work.

## Business rules

- Weeks are Singapore-local Monday through Sunday. Financial adapters supply completed weeks only.
- `latest_week` recommends 20% of the latest completed week's non-negative available surplus.
- `conservative_4_week` recommends 20% of the lower of the latest non-negative surplus and the median positive surplus from up to four completed weeks.
- Calculations floor to whole cents. No completed week produces an `insufficient_data` state; a non-positive latest week produces a zero recommendation.
- A recommendation is advisory. Changing method or previewing a weekly/monthly cadence does not change the accepted target; users must accept the suggestion or edit and save the target.
- Plans persist `target_frequency` and the exact `target_amount_cents` entered in that cadence. Weekly amounts are their own calculation value; monthly amounts use `floor(monthly × 12 ÷ 52)` as the canonical weekly equivalent for projections. Weekly recommendations shown monthly use `floor(weekly × 52 ÷ 12)`.
- A goal is either a positive amount in cents or 1–52 whole weeks of essential expenses. Coverage-goal amounts change with the current weekly essential-expense input.
- Progress is the sum of positive deposit records less recorded emergency-use withdrawals. A withdrawal must be positive and cannot exceed the tracked emergency fund balance. Percentages remain uncapped in data while the fund visual is capped at 100%.
- The projected completion date uses the accepted target's weekly equivalent, not the advisory recommendation: `today + ceil(remaining goal / weekly equivalent) × 7 days`. It is unavailable without a derived goal, pauses with the plan, and reports completion immediately when the goal is met.
- Milestones are fixed at 25%, 50%, 75%, and 100% of the current derived goal. Coverage-goal milestones recalculate when essential expenses change.
- Pausing retains all settings and contribution access while suppressing the weekly prompt.
- Deposit and withdrawal dates use Singapore's calendar day and cannot be in the future. Deposits can be edited, and both ledger entry types can be deleted when doing so would not make the tracked balance negative.
- Saving a goal records the current weekly essential-expense baseline. A later expense change produces an `expenses_changed` review state until the user reviews and saves the goal again.

## Frontend flow

- The Emergency Fund view presents all analytics first: current fund balance and the derived coverage goal as paired primary metrics, projected completion, milestones, and the balance trend. Coverage goals keep their number of expense weeks directly beneath the prominent monetary goal. Contribution and emergency-use controls follow as the action area.
- A deterministic projected completion card, milestone tracker, and Recharts balance-over-time line chart update after every plan or ledger change. Hovering over a chart date shows that day's aggregated contributions, withdrawals, and closing balance. The chart uses numeric labels and does not rely on colour alone.
- The emergency-use action opens a separate withdrawal form, validates against the tracked fund balance, and repeats that Resilience does not move money.
- The compact fund summary links to a separate Emergency Fund Settings view containing recommendation method, target acceptance/editing, and coverage-goal configuration.
- One prominent “Edit emergency plan” action now owns that settings journey; expense-change alerts point to it instead of adding a duplicate goal-edit button.
- Plan Settings lets users preview and save either a weekly or monthly target. Recommendation cards and confirmations follow the selected cadence, while the underlying recommendation formula remains weekly.
- Successful recommendation acceptance, manual target saves, and goal saves produce a brief accessible confirmation containing the updated target amount or goal basis. Failed saves continue to use the existing error alert and never show a success confirmation.
- Coverage-goal settings show the derived dollar amount from the latest essential expenses before save. The save confirmation repeats that amount so the result is explicit.
- Activity shows five compact records initially. Each record expands for its note and edit/delete controls, with an explicit option to reveal older records.
- An actionable alert appears on both views when essential expenses differ from the last saved goal baseline. It shows approximate previous and current monthly amounts and directs the user to review the goal.
- Client-side history navigation keeps the same API adapter instance, so moving between views does not reset accepted targets or contributions.
- The local demo hydrates its fixture adapter from the last successful browser cache, so reviewed goals and other demo changes survive a refresh in the same browser origin.
- Direct visits and browser back/forward navigation work for both routes without adding a routing dependency.

## Interfaces

The feature router factory in `backend/app/features/resilience_jar/routes.py` exposes:

- `GET /api/v1/resilience-jar/summary`
- `PATCH /api/v1/resilience-jar/plan`
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

- The shared Vite shell mounts `ResilienceJarPage` at `/resilience-jar` with `FixtureResilienceJarApi`.
- `create_router(service, user_id_provider=...)` and `HttpResilienceJarApi` define the backend integration seam; `create_demo_router()` remains available for synthetic demos.
- Implement the three repository protocols in `repositories.py` using the shared current-user/database primitives and Income Reality's completed-week surplus output.
- Persist one plan per user and a user-scoped contribution ledger through those adapters and the existing `goals`/`goal_contributions` schema envelope.
- The last successful summary is cached for read-only offline display. Mutations are clearly disabled offline until a shared mutation queue exists.

## Verification performed

- The integrated backend suite passes 188 tests with 3 database-dependent tests skipped by default; Ruff passes.
- The integrated frontend suite passes 26 tests, including Emergency Fund model, fixture-adapter, and routing coverage.
- The TypeScript and production PWA build passes.
- The shared dev app serves `/resilience-jar` and `/resilience-jar/plan` successfully.
- Parsed both committed JSON contract artifacts with Python's standard JSON parser.

Tests cover both formulas, cent rounding, weak/negative weeks, insufficient history, weekly/monthly target persistence and conversion, both goal modes, expense changes and goal-review acknowledgement, over-goal progress, target stability, pause/resume retention, contribution CRUD, withdrawal balance enforcement, completion projections, milestone states, signed chart timelines, future-date validation, user isolation, typed fixture behavior, money input, monthly display conversion, visual fill capping, and Singapore dates.

## Limitations and follow-up

- The local React shell uses synthetic data backed only by that browser origin's local cache. Clearing site data, changing browser/origin, or an incompatible future fixture shape resets the demo; this is not a replacement for shared database persistence.
- In-memory repositories reset on process restart. PostgreSQL adapters and any coordinated migration are required before shared integration.
- Authentication, real money movement, notifications, deployment, and elaborate animation remain out of scope.
