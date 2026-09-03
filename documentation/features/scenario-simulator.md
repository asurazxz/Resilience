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

The screen reads as three numbered steps — your money now, the situation, what
it would mean — so it states what it needs before showing an answer. Step 2
carries the earnings-drop, duration, one-off cost and recovery controls
directly. It briefly offered three preset situations (work drying up, injury, a
sudden repair) that filled the controls in; the picker was removed when the
screen was reworded for a general reader, because it added a decision before
the one the page is actually about. Step 3 leads with a
plain sentence answering the question, and the chart and week-by-week table sit
behind a "See how this was worked out" toggle so the working stays checkable
without dominating the screen. The chart opens with a "Now" bar for the starting savings and marks that level with a dashed line, because bars scaled
only against each other gave the reader nothing to check them against: a
scenario that drained savings and one that grew them looked alike. Pointing at,
tapping, or arrowing onto a bar names that week and its figures in a readout
above the chart; the readout is fixed in place rather than following the
pointer, so it cannot be clipped and touch behaves the same as hover.

Step 1 is seeded from the user's own records: `foundationBaseline.ts` averages
the two variable figures over the last four Monday-Sunday weeks of recorded
activity and takes the two fixed figures from the standing costs already
entered, using the same day-spread and week-grouping rules as Income Reality.
The window is anchored on the most recent transaction rather than on today, so
the function is pure and someone who records in bursts still gets a baseline
built from real weeks. Quiet weeks inside the window count, so they pull the
average down rather than disappearing.

When the user has no transactions at all, the page falls back to example
figures and step 1 carries an explicit "Example figures" notice. Without it the
page presented sample data as though it were the user's own, which is a trust
problem rather than a cosmetic one.

The headline sentence is assembled in the UI from figures the engine returned.
Wording is chosen there; no amount is derived there.

A "Your usual week" panel makes the five baseline figures editable on the page,
so the user can correct or explore a figure the seeded baseline got wrong. Edits
are not persisted and are lost on refresh. The derived net income and surplus shown in that panel
come from the API response; they are not recalculated in the browser, so those
figures are only ever worked out in one place.

Time away from work is not a separate control. It is the same model as a 100 percent earnings drop, so the two cannot produce inconsistent figures.

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

## Tests and checks actually performed

Run from the repository root as part of the backend suite:

```bash
python -m pytest backend/tests/unit/test_scenario_simulator.py -q
```

- The unit tests pass using the standard library only. They cover the acceptance checks in `documentation/initial-scaffold.md`: no buffer, zero cash flow, negative cash flow, one-off costs, partial income, and recovery — plus horizon defaults and caps, input validation, determinism, integer-only outputs, disclaimer presence, and resource de-duplication.
- **Transport contract tests** parse `schemas.py` and assert its field names match the engine's actual output and input, so the response models cannot drift while pydantic is uninstalled.
- **Static frontend check**: every JSX tag and every local import in the feature resolves to a real exported symbol.
- The committed fixtures were generated by running the engine, so they cannot disagree with it.

The integrated layers were also verified by running them:

- **API confirmed live.** `uvicorn app.main:app` starts; `GET /health` returns `{"status":"ok"}`; `POST /scenario-simulator/simulate` returns `200` with figures identical to the engine called directly, and an out-of-range `income_reduction_percent` returns `422`. Generated OpenAPI exposes both routes and 11 component schemas.
- **Frontend typechecks and builds.** `tsc --noEmit` passes under `strict` with `noUnusedLocals` and `noUnusedParameters`; `vite build` succeeds.
- **UI confirmed working in a browser** at 375x812. Controls, summary stats, SVG chart, week-by-week table, prompts, resource links, and disclaimers all render from live API data. Moving the earnings slider to 100 percent recalculated to a weekly work income of -S$250, a one-week runway, and the `buffer-runs-out-during-shock` prompt, matching the engine.

One caveat on the UI itself: the official source links the API returns are not rendered on this screen. Scheme Navigator owns the curated source registry and the user-facing scheme links.

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
