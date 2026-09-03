# Financial Score

`GET /api/v1/financial-score` returns a deterministic 0-100 score summarising
a user's financial resilience. Every number in this document is computed by
`backend/app/features/financial_score/calculator.py`, a pure function with no
FastAPI or SQLAlchemy dependency and **no AI or model call anywhere**. Inputs
are assembled by `backend/app/features/financial_score/routes.py` from the
existing Resilience Jar, Savings Goals, and Emergency Fund pieces
(`documentation/features/emergency-fund-model.md`); nothing here introduces a
new source of truth for money.

All amounts are integer cents. All arithmetic uses exact fractions
(`fractions.Fraction`), never floats, so results are reproducible.

## Response shape

```jsonc
{
  "score": 63,                 // 0-100, or null when nothing could be scored
  "band": "steady",            // building | steady | strong | resilient | unknown -- capped from the raw "strong" by the thin 3/40 emergency-fund buffer below
  "generatedAt": "2026-09-03T11:10:36.409802Z",
  "scoredMaxPoints": 100,      // sum of maxPoints over components that were actually scored
  "components": [
    {
      "id": "emergency_fund",
      "label": "Emergency fund",
      "status": "scored",      // scored | not_enough_information
      "points": 3,
      "maxPoints": 40,
      "detail": "Your emergency fund covers about 2.0 weeks of essential expenses, out of the 26 weeks you're aiming for."
    },
    { "id": "savings_habit", "...": "..." },
    { "id": "cash_flow", "...": "..." }
  ],
  "nextStep": "Keep adding to your emergency fund so it covers more of your essential expenses if income stops.",
  "missingInputs": [
    { "id": "essential_expenses", "label": "Essential expenses", "action": "Add your everyday essentials so we can size your emergency fund goal.", "route": "/profile" }
  ]
}
```

## Components

### `emergency_fund` (max 40)

Target `T` comes from the resilience-jar plan's goal (section 4 of the
emergency-fund model):

- Coverage goal: `T = weekly_essential_expenses_cents * goal.weeks`, or
  `None` when there is no active essential expense.
- Amount goal: `T = goal.amount_cents`.

If `T` is `None` or `<= 0` the component is `not_enough_information` (0
points). Otherwise:

```
ratio  = clamp(balance_cents / T, 0, 1)
points = round(40 * ratio)
```

The `detail` text states weeks of essentials covered (coverage goal) or
dollars saved versus the target (amount goal).

### `savings_habit` (max 30, or max 10 when unscorable)

Two halves:

**Plan half (10 points).** 10 when the jar plan is active with
`weekly_target_cents > 0`, OR at least one savings goal has status `active`;
otherwise 0. Having no plan at all is a **scored** 0, not
`not_enough_information` — the absence of a savings habit is exactly what
this measures, so `savings_habit` is always `status: "scored"`.

**Achievement half (20 points).**

```
expected_4w = jar.weekly_target_cents * 4
            + sum over active savings goals of (suggestedWeeklyCents or 0) * 4
```

If `expected_4w` is 0, it falls back to `recommendation.amount_cents * 4`
when the recommendation `status` is `ready` and the amount is `> 0`. If it is
still 0, the achievement half cannot be measured: `maxPoints` drops to 10 and
only the plan half counts.

Otherwise:

```
actual_4w = emergency-fund deposits (entry_type = deposit only, withdrawals excluded)
              with contribution_date in the inclusive 28-day window ending today
          + savings-goal contributions with contributedOn in the same window
ratio     = clamp(actual_4w / expected_4w, 0, 1)
points    = plan_half_points + round(20 * ratio)
```

### `cash_flow` (max 30)

Take the most recent 4 `WeeklySurplus` records by `week_start` descending
(the same weekly surplus the resilience-jar recommendation and the Income
Reality screen use — see section 6 of the emergency-fund model, including how
a dated-range transaction spreads across weeks).

If there are none, `not_enough_information`. Otherwise:

```
avg_income   = mean(income_cents)
avg_surplus  = mean(available_surplus_cents)
```

If `avg_income <= 0`, `not_enough_information` (there is no meaningful ratio
to divide by). Otherwise:

```
ratio = avg_surplus / avg_income
ratio <= 0     -> 0 points
ratio >= 0.20  -> 30 points
otherwise      -> round(30 * ratio / 0.20)
```

## Total score and band

```
scored_max_points = sum of maxPoints over components with status "scored"
```

**Minimum basis for a number.** `savings_habit` is always `status: "scored"`
(having no plan is itself a real, meaningful 0), so `scored_max_points` is
never `0` on its own — the old "no components scored" check can never fire,
which used to let a brand-new user with literally no data see a score of `0`
and band `building`. That's not what "not enough information" should look
like, and it wrongly implies the user has already been assessed and found
lacking. `savings_habit` alone is not sufficient evidence of anything, so:

```
has_score_basis = emergency_fund.status == "scored" or cash_flow.status == "scored"

not has_score_basis  ->  score = null,  band = "unknown"
otherwise             ->  score = clamp(round(100 * sum(points of scored) / scored_max_points), 0, 100)
                          band  = band_for(score), then capped (see below)
```

Only `emergency_fund` and `cash_flow` require the user to have actually
entered something (an essential expense/target, or a week of income and
costs); `savings_habit` scores off of defaults alone. Components are always
returned in full with their individual `status`/`points` even when the
overall score is `null`, so the UI can still show what little is known.

Bands (before any cap):

| Score range | Band |
|---|---|
| 0-39 | `building` |
| 40-59 | `steady` |
| 60-79 | `strong` |
| 80-100 | `resilient` |

## Band cap: no visible buffer, no "resilient" label

The numeric score is left exactly as computed above — a transparent
`points / scoredMaxPoints` ratio over whatever actually scored. Only the
qualitative **band** is capped, and only ever downward, because a high score
built entirely out of `savings_habit` and `cash_flow` says nothing about
whether the user has a buffer to survive an income shock — which is what
this app is meant to measure. The emergency fund *is* that buffer, so the
cap is graduated on how much of it the user has actually built, not a single
pass/fail line: a negligible buffer holds the label back the same way a
missing one does, and a partial buffer still holds it below "resilient"
even once it clears "negligible".

```
emergency_fund.status != "scored"                                 -> band capped to "steady"
emergency_fund.status == "scored" and ratio < 0.25 (steady cap)   -> band capped to "steady"
emergency_fund.status == "scored" and ratio < 0.75 (strong cap)   -> band capped to "strong"
emergency_fund.status == "scored" and ratio >= 0.75               -> no cap

  where ratio = emergency_fund.points / emergency_fund.maxPoints
```

The two ratio thresholds (0.25 and 0.75) are named module-level constants in
`calculator.py` (`_EMERGENCY_FUND_STEADY_CAP_RATIO` and
`_EMERGENCY_FUND_STRONG_CAP_RATIO`) so the calibration is visible in one
place. The cap can only lower the band (`resilient > strong > steady >
building`); it never raises one — a low raw score with a full buffer stays
at its natural low band rather than being pulled up to the cap. If a cap
changes the band, `nextStep` is forced to the `emergency_fund` sentence
regardless of which component had the lowest ratio, since the fund is
exactly why the label was held back. The component rows themselves are
never touched by the cap — a user held to "steady" by a thin buffer still
sees full marks on `savings_habit` and `cash_flow` if they earned them, so
the card can explain exactly why the label stopped short.

## `nextStep`

When a cap was applied, `nextStep` always points at `emergency_fund` (see
above). Otherwise, the scored component with the lowest `points / maxPoints`
ratio wins, ties broken by component order (`emergency_fund`,
`savings_habit`, `cash_flow`). Each component id maps to one fixed,
hardcoded sentence — no model call. When the score itself is `null`,
`nextStep` is a distinct sentence pointing at the first thing to do to get a
score at all (log a week of income/costs, or add an essential expense) —
never the savings-plan sentence, since a savings plan alone won't produce a
score.

## `missingInputs`

A response can withhold a score, or leave a component `not_enough_information`,
without ever telling the user what to add — that's the defect this field
fixes. `missingInputs` is always present (an empty array when nothing is
missing, never omitted) and lists exactly the inputs the user still needs to
supply before an unscored piece of the score can be scored:

| `id` | `label` | `route` | Emitted when |
|---|---|---|---|
| `essential_expenses` | Essential expenses | `/profile` | `emergency_fund` is `not_enough_information` **and** the plan is a coverage goal with no weekly essential expenses recorded (a coverage target can't be sized without them). |
| `emergency_fund_goal` | Emergency fund goal | `/resilience-jar` | `emergency_fund` is `not_enough_information` for any other reason (for example an amount goal with no amount set). |
| `income_transactions` | Recorded income | `/transactions/new` | `cash_flow` is `not_enough_information` (no weeks logged, or every logged week has zero or negative average income). |
| `savings_plan` | Savings plan | `/savings` | `savings_habit`'s plan half scores 0 — no active weekly jar target and no active savings goal. |

`essential_expenses` and `emergency_fund_goal` are mutually exclusive (at
most one can appear per response, since they cover the same component for
different reasons); `income_transactions` and `savings_plan` are independent
of both and of each other. The list is emitted whether or not `score` is
`null` — a partial score (for example only `cash_flow` scored) can still
carry entries so the user knows how to unlock the rest.

**Ordering.** Entries are ordered by the `maxPoints` of the component each
one unblocks, largest first, so the highest-value action leads:
`essential_expenses`/`emergency_fund_goal` (40) before `income_transactions`
(30) before `savings_plan` (the plan half of `savings_habit`, whose
`maxPoints` is 10 when the achievement half is itself unscorable, else 30).

Each `action` is a plain-language sentence naming the concrete next step; each
`route` is the frontend path to send the user to. Both are fixed, hardcoded
per id — no model call.

## Component `detail` text names where to go

Every `not_enough_information` `detail` sentence tells the user, in plain
language, which screen to visit — no field names, no jargon, no URLs:

- `emergency_fund` with a coverage goal and no essential expenses points the
  user to **Profile**.
- `emergency_fund` for any other unscored reason (for example an amount goal
  with no target) points the user to **Emergency fund**.
- `cash_flow` with no weeks logged, or with no positive income logged, points
  the user to **Transactions**.

`savings_habit` is always `status: "scored"` (a real 0 for "no plan" is
meaningful data, not missing information), so it has no
`not_enough_information` detail to update — but its scored-zero detail still
tells the user to set a weekly target or goal.

## Worked example

```
Essentials: food S$100/week (weekly)
Balance: S$200; goal: coverage, 26 weeks -> T = 10,000 * 26 = 260,000
  ratio = 200/2600 = 0.0769 -> points = round(40 * 0.0769) = 3

Plan: weekly_target_cents = 5,000 (active) -> plan half = 10
Deposit this week: 20,000 cents; expected_4w = 5,000*4 = 20,000
  ratio = 20000/20000 = 1 -> achievement = 20 -> savings_habit points = 30

4 weeks of income 100,000 / week, surplus 40,000 / week
  ratio = 40000/100000 = 0.40 >= 0.20 -> cash_flow points = 30

scored_max_points = 40 + 30 + 30 = 100
score = round(100 * (3 + 30 + 30) / 100) = 63  ->  raw band = "strong"
emergency_fund ratio = 3/40 = 0.075 < 0.25 (steady cap)  ->  band capped to "steady"
nextStep -> emergency_fund (cap fired; forced regardless of lowest ratio)
```

This matches the seeded integration test in
`backend/tests/integration/test_financial_score_api.py`.

## Tests

`test_financial_score_calculator.py` covers each component's scoring and `not_enough_information` paths, the band table, both band caps, `nextStep` selection, and `missingInputs` ordering. `test_financial_score_api.py` (gated by `RUN_DATABASE_TESTS=1`) reproduces the worked example above against a seeded user. `financialScore.test.ts` / `FinancialScoreCard.test.tsx` cover the client's presentation, including the withheld-score state.

## Limitations

- The weightings (40 / 30 / 30), the 20% cash-flow ceiling, the four-week
  achievement window and the two band-cap ratios are calibrated by judgement
  for a prototype, not derived from research on platform-worker outcomes. They
  are named constants in `calculator.py` so they can be re-tuned in one place.
- The score is computed on every request and never stored, so there is no
  history and no way to show whether it is improving.
- `savings_habit` measures recorded contributions. Resilience never sees a bank
  account, so money genuinely set aside but not recorded scores as nothing.
- A score is not a financial assessment and must not be presented as one.
