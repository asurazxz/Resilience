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

## 6. Recommended weekly saving (unchanged)

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

The Savings screen pins a read-only Emergency Fund overview at the top
(`B`, `T`, `reached`, `coverage_wks`) so the baseline is visible while the
user builds the habit below it.

## 8. Worked example

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
