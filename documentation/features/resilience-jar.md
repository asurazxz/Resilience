# Feature 03 — Emergency Fund

**Date:** 2026-09-01

## Scope

The Emergency Fund is a mobile-first feature slice for building a safety buffer against income disruptions and unexpected costs. Users choose a weekly or monthly contribution target and record contributions or emergency use. It calculates recommendations, essential-expense coverage, milestones, and a completion projection deterministically. It never holds, transfers, or withdraws money; a withdrawal entry only records money the user moved outside Resilience. Other savings remain separate from the balance tracked in this fund.

The feature currently runs against in-memory backend repositories and a typed frontend fixture adapter. A minimal React and Vite shell provides a contribution-first Emergency Fund at `/resilience-jar` and less-frequent plan controls at `/resilience-jar/plan`. The existing route, API prefix, module names, and contract filenames remain `resilience-jar` for integration compatibility. Database persistence and live income inputs remain integration work because the Workstream 1 and 2 foundations are not yet present on this branch.

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
- Plan Settings lets users preview and save either a weekly or monthly target. Recommendation cards and confirmations follow the selected cadence, while the underlying recommendation formula remains weekly.
- Successful recommendation acceptance, manual target saves, and goal saves produce a brief accessible confirmation containing the updated target amount or goal basis. Failed saves continue to use the existing error alert and never show a success confirmation.
- An actionable alert appears on both views when essential expenses differ from the last saved goal baseline. It shows approximate previous and current monthly amounts and directs the user to review the goal.
- Client-side history navigation keeps the same API adapter instance, so moving between views does not reset accepted targets or contributions.
- Direct visits and browser back/forward navigation work for both routes without adding a routing dependency.

## Interfaces

The feature router factory in `backend/app/features/resilience_jar/routes.py` exposes:

- `GET /api/v1/resilience-jar/summary`
- `PATCH /api/v1/resilience-jar/plan`
- `POST /api/v1/resilience-jar/contributions`
- `POST /api/v1/resilience-jar/withdrawals`
- `PATCH /api/v1/resilience-jar/contributions/{contribution_id}`
- `DELETE /api/v1/resilience-jar/contributions/{contribution_id}`

Domain validation errors use `{ code, message, field_errors }`. The application-level FastAPI validation handler must use the same shape once Workstream 1 supplies app composition.

The reviewed summary shape is represented by:

- `contracts/schemas/resilience-jar-summary.schema.json`
- `contracts/fixtures/resilience-jar-summary.json`
- `frontend/src/features/resilience-jar/types.ts`

Money crossing an interface is integer cents. Dates are ISO 8601 strings. Plans expose `target_frequency`, the exact selected-cadence `target_amount_cents`, and the derived `weekly_target_cents` used by deterministic calculations. Ledger entries are discriminated by `entry_type: "deposit" | "withdrawal"`. A `null` goal target, projection, or coverage value means the required goal or essential-expense data is unavailable.

The plan stores `goal_expense_baseline_cents`. The summary returns `goal_review` with `up_to_date`, `expenses_changed`, or `unavailable`, plus previous/current weekly values and the signed change. Monthly values shown in the UI are explanatory approximations derived as `weekly × 52 ÷ 12`; the API keeps weekly cents as the source of truth.

## Integration

- Mount `create_router(service, user_id_provider=...)` from the shared FastAPI app. `create_demo_router()` is available for a synthetic demo only.
- Implement the three repository protocols in `repositories.py` using Workstream 1's current-user and database primitives and Workstream 2's completed-week available-surplus output.
- Persist one plan per user and a user-scoped contribution ledger through those adapters. Coordinate any schema additions with Workstream 1 rather than creating a competing baseline migration.
- The local Vite shell mounts the user-facing Emergency Fund through the stable `ResilienceJarPage` integration component at `/resilience-jar` with `FixtureResilienceJarApi`. Replace that adapter with `HttpResilienceJarApi` when the shared backend is available.
- The last successful summary is cached for read-only offline display. Mutations are clearly disabled offline until a shared mutation queue exists.

## Verification performed

- `python3 -m py_compile backend/app/features/resilience_jar/*.py`
- `python3 -m unittest discover -s backend/tests -p 'test_*.py'` — 29 passed, 2 FastAPI route tests skipped because the shared dependency is not installed.
- `npm test` from `frontend/` — 19 model, fixture-adapter, and routing tests passed.
- `npm run build` from `frontend/` — TypeScript and Vite production build passed.
- `npm run dev` plus requests to both frontend routes — `/resilience-jar` and `/resilience-jar/plan` returned HTTP 200.
- Parsed both committed JSON contract artifacts with Python's standard JSON parser.

Tests cover both formulas, cent rounding, weak/negative weeks, insufficient history, weekly/monthly target persistence and conversion, both goal modes, expense changes and goal-review acknowledgement, over-goal progress, target stability, pause/resume retention, contribution CRUD, withdrawal balance enforcement, completion projections, milestone states, signed chart timelines, future-date validation, user isolation, typed fixture behavior, money input, monthly display conversion, visual fill capping, and Singapore dates.

## Limitations and follow-up

- The local React shell uses synthetic in-memory data and resets after a page refresh. It is an integration aid, not the final shared application shell.
- The FastAPI package manifest and app entry point remain owned by Workstream 1.
- The HTTP route tests are ready but skipped until FastAPI is installed. React Testing Library coverage must be added after the frontend test stack lands; dependency-free model and fixture-adapter tests run now.
- In-memory repositories reset on process restart. PostgreSQL adapters and any coordinated migration are required before shared integration.
- Authentication, real money movement, notifications, deployment, and elaborate animation remain out of scope.
