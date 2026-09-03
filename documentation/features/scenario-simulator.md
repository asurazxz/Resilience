# Setback Planner

**Updated:** 2026-09-03

**Status:** Integrated on `dev`

**Scope:** Deterministic shock model, HTTP endpoint, shared contracts, and results UI

The feature is called the **Setback planner** in the interface; the code, the route and this document's file name keep the original `scenario-simulator` identifier.

## User-visible scope

The user adjusts three things about a possible setback — how far earnings drop, how many weeks it lasts, and any one-off unexpected cost — plus how long earnings take to recover. The screen then shows:

- estimated weekly work income and weekly money left during the shock;
- how long the emergency buffer is estimated to last, and the week money runs out;
- the total amount not covered across the projected period;
- a week-by-week chart and a collapsible table so every figure can be traced;
- preparatory prompts and official Singapore government links;
- estimate and non-advice notices attached to every result.

The screen is three numbered steps — your money now, the situation, what it
would mean. Step 1 ("Your usual week") shows five editable baseline figures
seeded from the user's own records: `foundationBaseline.ts` averages the two
variable figures over the last four Monday-Sunday weeks of recorded activity
(anchored on the most recent transaction, not today) and takes the two fixed
figures from standing costs, using the same day-spread and week-grouping
rules as Income Reality. Edits in this panel are not persisted and are lost
on refresh; the derived net income and surplus shown there come from the API
response, never recalculated in the browser. With no transactions at all, the
page falls back to example figures and says so explicitly.

Step 2 carries the earnings-drop, duration, one-off cost and recovery
controls. Time away from work is not a separate control — it is modelled as a
100 percent earnings drop, so the two cannot produce inconsistent figures.

Step 3 leads with a plain sentence answering the question (assembled in the
UI from figures the engine returned — no amount is derived there), with the
chart and week-by-week table behind a "See how this was worked out" toggle.
The chart opens with a "Now" bar for starting savings, marked with a dashed
line so a scenario is checked against a real starting point rather than only
against itself. Pointing, tapping or arrowing onto a bar names that week's
figures in a fixed-position readout above the chart, so it cannot be clipped
and touch behaves the same as hover.

## Deferred

- Persisting saved scenarios and edited baselines. The endpoint is stateless, so edits are lost on refresh; the shared schema includes a future `scenarios` persistence envelope.
- Comparing two scenarios side by side.
- Any AI explanation of the results. The Setback planner is deterministic end to end.

## Business rules and assumptions

Material assumptions, all reversible:

1. **Money is integer cents; periods are whole weeks.** Week 1 is the first week of the shock, following the shared contract conventions.
2. **Work costs split into fixed and variable.** Variable costs (fuel, commission) scale with the work actually done; fixed costs (vehicle rental, insurance) continue in a week with no earnings. Without this split a full stop in earnings would look far cheaper than it is for a renting driver. `foundationBaseline.ts` supplies the split: recorded cost transactions become the variable figure and weekly-normalised standing costs become the fixed figure. The UI presents this as costs that stop when work stops versus costs that keep charging.
3. **Scaling truncates to whole cents.** Amounts are scaled by exact integer fractions rather than floats, so the same scenario always produces byte-identical figures.
4. **Recovery is linear.** Earnings ramp from the reduced level back to baseline across `recovery_weeks`, reaching full baseline the week after recovery ends.
5. **The one-off cost lands in week 1.**
6. **The buffer never goes negative.** Money that cannot be drawn from savings is reported as `shortfall_cents`, an unmet need, rather than a negative balance.
7. **Runway counts complete weeks before the first shortfall.** A shortfall in week 1 is a runway of zero weeks.
8. **Default horizon** is `weeks_affected + recovery_weeks + 4`, clamped to 8–52 weeks.

## Safety boundaries

- Every displayed figure comes from `engine.py`, which imports nothing beyond the standard library. No LLM participates in any calculation.
- Preparatory prompts are chosen by explicit rules over calculated values in `guidance.py`. The text is fixed, not generated, and is worded as things to check rather than actions to take.
- Results always carry the estimate and non-advice disclaimers; the tests assert their presence.
- The frontend performs no financial arithmetic. It formats cents and renders backend text.

## Interfaces

### HTTP

`POST /api/v1/scenario-simulator/simulate`, authenticated like every other route.

Request: `{ "baseline": BaselineFinancesPayload, "scenario": ShockScenarioPayload }`.
Response: `ScenarioResultResponse` — baseline summary, scenario summary, weekly projections, preparatory actions, official resources, and disclaimers.

The endpoint is stateless: nothing is stored, so a scenario cannot be saved or revisited.

Invalid input returns `422` in the shared error envelope. A payload-shape failure carries `VALIDATION_ERROR`; a bound the engine enforces but the transport schema does not express is raised as `DomainError(422, "SCENARIO_INVALID_INPUT", …)`. The feature-specific `{"detail": {"error": …}}` envelope this router once returned was replaced by the application-wide envelope.

### Files

| Path | Purpose |
|---|---|
| `backend/app/features/scenario_simulator/models.py` | Input/output dataclasses and input validation |
| `backend/app/features/scenario_simulator/engine.py` | Deterministic projection, runway, and summary calculations |
| `backend/app/features/scenario_simulator/guidance.py` | Rule-selected preparatory prompts, official resources, disclaimers |
| `backend/app/features/scenario_simulator/serialization.py` | Result to JSON-compatible structures |
| `backend/app/features/scenario_simulator/schemas.py` | Pydantic transport models |
| `backend/app/features/scenario_simulator/router.py` | Mountable `APIRouter` |
| `contracts/schemas/scenario-simulator.schema.json` | Portable JSON Schema, generated from `schemas.py` |
| `contracts/fixtures/scenario-simulator.fixtures.json` | Five synthetic cases, generated by the engine |
| `frontend/src/features/scenario-simulator/` | Controls, results, chart, table, hook, API adapter |

Two more files compose the feature into the application:

| Path | Purpose |
|---|---|
| `frontend/src/features/scenario-simulator/foundationBaseline.ts` | Builds the baseline from the user's own transactions and standing costs |
| `frontend/src/features/scenario-simulator/components/BaselineEditor.tsx` | Lets the user override any baseline figure on the page |

The engine is importable without FastAPI, pydantic, a database, or a network. `__init__.py` deliberately does not re-export `router`, so importing the engine does not require the web framework.

## Tests

`python -m pytest backend/tests/unit/test_scenario_simulator.py -q` covers the acceptance checks in `documentation/initial-scaffold.md` (no buffer, zero/negative cash flow, one-off costs, partial income, recovery) plus horizon defaults and caps, determinism, and disclaimer presence. Transport-contract tests assert `schemas.py`'s field names match the engine's actual input/output, so the response models cannot drift while Pydantic is uninstalled. The committed fixtures are generated by running the engine, so they cannot disagree with it. See the [root README](../../README.md#tests) for the full command set.

One caveat on the UI: the official source links the API returns are not rendered on this screen. Scheme Navigator owns the curated source registry and the user-facing scheme links.

## Known limitations

- **Scenarios are not persisted.** The endpoint is stateless and no scenario or baseline edit is stored, so everything is lost on refresh. The `scenarios` table exists as an envelope but nothing writes to it.
- Essential expenses and fixed work costs are held constant for the whole projection.
- The model has no income tax, CPF, or interest effects.
- One shock at a time; overlapping shocks are not modelled.
- The official resource list is a small local placeholder and should eventually share Scheme Navigator's curated source registry. Those URLs have never been fetched to confirm they resolve.
- Requests need the API. Unlike the Foundation writes, a simulation is not queued offline.

## Follow-up

1. Add saved-scenario persistence through the shared `scenarios` table.
2. Consolidate official resources with Scheme Navigator's curated source registry and deep-link the `check-support-schemes` prompt.
3. Confirm the four government URLs resolve before a public demo.
4. Add frontend component coverage; the current tests cover `foundationBaseline.ts` and the contracts, not the screen's interaction.
