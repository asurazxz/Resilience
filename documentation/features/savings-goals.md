# Feature — Savings Goals

**Date:** 2026-09-03

The calculation model is section 7 of
[`emergency-fund-model.md`](./emergency-fund-model.md). Where this document and
the model disagree, the model wins.

## Scope

Savings Goals are named, user-owned goals for habit building: a laptop, a
holiday, a licence renewal. Each goal has a target, an optional target date, and
its own contribution history. The feature exists beside the Emergency Fund, not
inside it.

**Savings-goal money never changes the emergency-fund balance, and vice
versa.** Nothing in `backend/app/features/savings_goals/` reads or writes
`profiles.latest_emergency_savings_cents` or
`resilience.emergency_fund_contributions`, and there is a database-backed test
asserting exactly that.

The Savings screen shows savings goals only. It previously pinned a read-only
Emergency Fund overview at the top; that was removed when the screen was
redesigned to match the Emergency Fund layout, because the fund already has its
own tab and its own card on Home, and repeating it here invited the two
balances to be read as one. The add-goal form and each goal's detail sit behind
keyboard-operable disclosures, and each goal carries a cumulative-savings chart
with a dashed target line and an accessible text summary.

Resilience never holds or moves money. A contribution records money the user
set aside outside the app.

## Calculations

```
saved            = sum of the goal's contribution amounts
remaining        = max(target_cents - saved, 0)
reached          = saved >= target_cents
suggested_weekly = ceil(remaining / weeks_until(target_date))
                     when target_date is set, in the future, and remaining > 0
                 = null otherwise
weeks_until(d)   = max(ceil((d - today_SG) / 7 days), 1)
```

All amounts are integer cents. Dates are Singapore-local calendar days.

Status is `active`, `completed`, or `archived`. Reaching a goal does not change
its status; the user marks it complete. Lists return active goals first, then
completed, then archived, newest first within each status.

## Interfaces

Router: `backend/app/features/savings_goals/routes.py`, mounted at
`/api/v1/savings-goals`. Every endpoint requires the verified Supabase subject
via `current_user_id`; a goal or contribution belonging to anyone else answers
`404 NOT_FOUND`. Requests and responses use camelCase (`ApiModel`), matching
Foundation Input.

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/v1/savings-goals` | — | `{ "goals": [SavingsGoal] }` |
| POST | `/api/v1/savings-goals` | `{ name, targetCents, targetDate? }` | `201 SavingsGoal` |
| PATCH | `/api/v1/savings-goals/{id}` | `{ name?, targetCents?, targetDate?, status? }` | `SavingsGoal` |
| DELETE | `/api/v1/savings-goals/{id}` | — | `204` |
| POST | `/api/v1/savings-goals/{id}/contributions` | `{ amountCents, contributedOn, note? }` | `201 SavingsGoal` |
| DELETE | `/api/v1/savings-goals/{id}/contributions/{contributionId}` | — | `204` |

Both contribution endpoints answer with the whole updated goal, so the client
never has to recompute `savedCents` itself.

```jsonc
// SavingsGoal
{
  "id": "0f1c…",
  "name": "New laptop",
  "targetCents": 100000,
  "targetDate": "2026-10-01",
  "status": "active",
  "savedCents": 40000,
  "remainingCents": 60000,
  "reached": false,
  "suggestedWeeklyCents": 15000,
  "contributions": [
    {
      "id": "9a2e…",
      "amountCents": 40000,
      "contributedOn": "2026-09-03",
      "note": "Bonus",
      "createdAt": "2026-09-03T07:12:04.113889Z"
    }
  ],
  "createdAt": "2026-09-03T07:12:03.987650Z",
  "updatedAt": "2026-09-03T07:12:03.987650Z"
}
```

Validation: `name` is 1–80 characters after trimming; `targetCents` and
`amountCents` are above 0 and at most 100,000,000; `note` is at most 200
characters and becomes `null` when blank; `contributedOn` cannot be later than
the Singapore calendar day; a PATCH must carry at least one field. Failures use
the shared `{ "error": { code, message, fieldErrors, requestId } }` envelope.

## Storage

Migration `supabase/migrations/20260903120000_savings_goals.sql` extends the
schema envelope that already existed:

- `resilience.goals` gains `name` (1–80 characters, checked) and `target_date`.
  `goal_type` is always `savings` for this feature.
- `resilience.goal_contributions` gains `user_id` (owning profile, cascade
  delete), `note`, and `updated_at` with the shared `set_updated_at` trigger,
  plus an index on `(user_id, contributed_on desc)`.

ORM models are `SavingsGoal` and `SavingsGoalContribution` in
`backend/app/db/models.py`.

## Tests

- `backend/tests/unit/test_savings_goals.py` covers the pure calculations —
  `weeks_until`, `suggested_weekly_cents` across no target date, a reached goal,
  a past date, an exact number of weeks, a rounded-up remainder, and a partial
  week — plus the request-model validation rules.
- `backend/tests/integration/test_savings_goals_api.py` (gated by
  `RUN_DATABASE_TESTS=1`) covers the full CRUD and contribution flow, list
  ordering across the three statuses, ownership isolation between two users on
  every endpoint, the separation from the emergency fund, and the error cases.
  Each test runs as a throwaway `uuid4()` user whose profile row is deleted
  afterwards.
- Frontend: `SavingsPage.test.tsx` covers the screen, and
  `SavingsGoalChart.test.ts` / `SavingsGoalChart.render.test.tsx` cover the
  per-goal cumulative chart's series construction and its rendering.

## Limitations and follow-up

- Contributions can be added and deleted but not edited; delete and re-add.
- Reaching a goal does not auto-complete it, by design.
- There is no per-goal currency; everything is the profile currency.
- No reminders, notifications, or scheduled contributions.
- Contributions are recorded only. Resilience does not move money.
