# Emergency Fund and Savings Goals — calculation model

This document is the single definition of how the Emergency Fund is calculated
after the 2026-09-03 redesign, and how the new Savings Goals sit beside it.
All amounts are integer cents. Anything not listed here is not part of the
model.

## 1. Two separate ledgers

| Ledger | Purpose | Tables |
|---|---|---|
| Emergency fund | A baseline buffer. One balance per user. | `profiles.latest_emergency_savings_cents` (opening balance), `emergency_fund_contributions` |
| Savings goals | Habit building. Any number of named goals. | `goals` (goal_type = `savings`), `goal_contributions` |

Savings-goal money never changes the emergency-fund balance, and vice versa.

## 2. Emergency fund balance

```
O  = opening balance          (profiles.latest_emergency_savings_cents)
D  = sum of deposits          (emergency_fund_contributions, entry_type = deposit)
W  = sum of withdrawals       (emergency_fund_contributions, entry_type = withdrawal)
N  = D - W                    (net ledger activity)
B  = O + N                    (current balance)
```

Rules:

- `O` is written in exactly two places: onboarding (the user's stated savings)
  and `PUT /api/v1/resilience-jar/opening-balance`, which stores
  `O = entered_balance - N` so that `B` equals what the user typed.
- Weekly entries carry `weekly_entries.emergency_savings_cents` as a
  historical snapshot of `B` at the time of the entry. Saving a week never
  writes `O`. This is the fix for the double-count defect, where the displayed
  balance `B` was written back into `O` and then had `N` added again.
- `B` is computed by one function, `emergency_fund_balance()`, used by both
  the Foundation bootstrap (`profile.emergencyFundBalanceCents`) and the
  Emergency Fund summary. It is a single SQL aggregate, not a Python loop.
- Withdrawals may not exceed `B`; deleting or shrinking a deposit may not
  make `B` negative.

## 3. Weekly essential expenses

```
E = sum over active essential_expenses of
      amount_cents                  if cadence = weekly
      amount_cents * 12 // 52       if cadence = monthly
```

`E` counts the essentials table only. Recurring work costs are excluded on
purpose: the fund exists for weeks when the user cannot work, so vehicle
rental and similar work costs are not what it has to cover. This is a
reversible assumption; if the team wants work costs included, change
`weekly_essential_expenses_cents()` in one place.

`E` is `None` when the user has no active essential expense.

## 4. Goal, target, and "reached"

```
default goal  = coverage, 26 weeks   (about 6 months)
T             = E * weeks            for a coverage goal
              = amount_cents         for an amount goal
              = None                 for a coverage goal when E is None
remaining     = max(T - B, 0)
reached       = T is not None and B >= T
coverage_wks  = B / E, one decimal   (None when E is None)
```

The UI shows `T`, `B`, `remaining`, `coverage_wks`, and `reached`. It does not
show a percentage of goal or percentage milestones. The API still returns
`progress_percent` and `milestones` for compatibility, but no screen renders
them.

### 4.1 Default goal history and the 2026-09-03 backfill

The coverage-goal default is `DEFAULT_COVERAGE_WEEKS = 26` in
`backend/app/features/resilience_jar/models.py` — roughly six months of
essential expenses, which is the standard emergency-fund rule of thumb this
feature is built around. That constant only applies when a plan row is
created; it does not retroactively change rows that already exist. An
earlier version of the app shipped with a 4-week default, so any
`emergency_fund_plans` row created before this change still held
`goal_weeks = 4`, showing a one-month goal instead of six months.

Migration `supabase/migrations/20260903210000_emergency_fund_default_six_months.sql`
backfills this: it sets `goal_weeks = 26` for every row where
`goal_mode = 'coverage' and goal_weeks = 4`.

**Trade-off, recorded deliberately:** four was also a value a user could have
chosen on purpose (the input accepts 1–52 weeks). Because the shipped
default and a deliberate choice of four are stored identically, the
migration cannot tell them apart, so it overwrites both. Anyone who
genuinely wanted a four-week goal will need to re-set it after this
migration runs. This was judged the better trade-off because it fixes the
much more common case — someone left at the old default — while a
deliberately-chosen four-week goal is comparatively rare and easy to
re-enter.

## 5. Weekly saving target and projection

```
weekly_target  = target_amount_cents          if target_frequency = weekly
               = target_amount_cents * 12 // 52  if monthly
weeks_left     = ceil(remaining / weekly_target)     when weekly_target > 0
projected_date = today_SG + weeks_left * 7 days
```

Projection status is `complete` when `remaining = 0`, `paused` when the plan
is paused, `no_weekly_target` when `weekly_target = 0`, `unavailable` when
`T` is `None`.

## 6. Recommended weekly saving

Input: completed weekly surpluses `S_w`, newest first.

```
S_w = income_w - variable_costs_w - R - E
      income_w        = sum of income transactions in the Monday-Sunday week
      variable_costs_w = sum of cost transactions in that week
      R               = weekly-normalised active recurring work costs
      E               = weekly essential expenses (section 3)

latest_week method:   20% of max(S_latest, 0)
conservative method:  20% of min(max(S_latest, 0), median of positive S over last 4 weeks)
                      (0 when the latest week is non-positive)
```

`S_w` is defined once, in the backend, and the Income Reality screen uses the
same three deductions so both features report the same surplus for a week.

### Spreading a dated-range transaction across weeks

A transaction may carry `occurred_until` in addition to `occurred_on`,
covering a range of calendar days (for example, a month-long insurance
premium or a multi-day gig). Its `amount_cents` is spread **evenly across
every calendar day in the inclusive range**, not assigned entirely to the
start date:

```
effective_end = occurred_until   if occurred_until is set and >= occurred_on
              = occurred_on      otherwise (a single day)
days          = (effective_end - occurred_on).days + 1
base          = amount_cents // days
remainder     = amount_cents % days
day i (0-indexed) gets base + 1 cent  if i < remainder
                    base              otherwise
```

Each day's share is then folded into `income_w` or `variable_costs_w` for the
Monday-Sunday week that day falls in. A single transaction can therefore
contribute to several different `S_w` values.

This rule is implemented once, in `backend/app/features/transaction_spread.py`
(used by `SqlFinancialContextRepository.list_completed_weekly_surpluses`), and
mirrored exactly by `transactionDailyAmounts` in
`frontend/src/features/income-reality/foundationAdapter.ts`, so the backend
and the Income Reality screen report identical weekly figures for the same
transaction. Both implementations are checked against the shared fixture
`contracts/fixtures/transaction-week-split.json`. A date range is capped at
366 days (`TransactionInput.occurred_until`, enforced by both a Pydantic
validator and a database check constraint).

## 7. Savings goals

Each goal:

```
saved      = sum of goal_contributions.amount_cents for the goal
remaining  = max(target_cents - saved, 0)
reached    = saved >= target_cents
suggested_weekly = ceil(remaining / weeks_until(target_date))   when target_date is set
                                                                 and remaining > 0
                 = None                                          otherwise
```

Goals have status `active`, `completed`, or `archived`. Reaching a goal does
not change its status automatically; the user marks it complete.

The Savings screen shows savings goals only; it no longer pins an Emergency
Fund overview. The emergency fund lives in its own tab (the Resilience Jar)
and on the Home page.

## 8. Financial Score

See `documentation/features/financial-score.md` for the full specification
of the deterministic 0-100 score assembled from this model, savings goals,
and weekly cash flow.

## 9. Worked example

```
Essentials: rent S$800/month, food S$120/week
E = 80000*12//52 + 12000 = 18461 + 12000 = 30461   (S$304.61/week)
T = 30461 * 26 = 792,000 rounded down to 791,986   (S$7,919.86)

O = 100,000  (S$1,000 stated at onboarding)
D = 5,000    (one deposit)
W = 0
B = 105,000  (S$1,050)

reached      = false
remaining    = 686,986
coverage_wks = 3.4
weekly_target = 10,000  ->  weeks_left = 69, projected ≈ 16 months out
```

Saving a weekly entry afterwards leaves `B` at 105,000. Before the fix it
became 110,000.
