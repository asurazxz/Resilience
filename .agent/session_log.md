# Agent Session Log

Append significant sessions in reverse chronological order. Keep entries concise and factual.

## 2026-09-03 — Financial Score route recovery and critical consistency fixes

- Diagnosed the Home Financial Score error as a stale FastAPI process: `/api/v1/financial-score` returned 404 despite being mounted in current source.
- Restarted the local API from the updated checkout; the endpoint now returns the expected authenticated response instead of 404.
- Changed the score refresh key to include transaction and standing-cost values, so editing existing records refreshes the score.
- Prevented an unknown transaction edit route from silently creating a new transaction; it now renders an unavailable state.
- Verified the frontend production build and updated Graphify's code graph.

## 2026-09-03 — Transaction ranges and local-stack recovery

- Added transaction editing and an optional inclusive end date, with server-side ownership/date validation and a non-destructive local Supabase migration.
- Split range amounts by calendar day in Income Reality and Scenario Simulator so edits flow into derived figures.
- Removed the duplicate Home emergency-fund card and balance editor, hardened stale cache/money rendering against `NaN`, and made Financial Details display-first with an edit toggle.
- Started Docker Desktop, applied `20260903150000_transaction_date_ranges.sql` locally, started the API with the working `.venv313` environment, and opened the local PWA.
- Verified frontend production build and FastAPI readiness. The default `.venv` is Python 3.14 and cannot launch Uvicorn because its dependencies are incomplete; use `.venv313`.

## 2026-09-03 — Groq assistant, readability pass, documentation rewrite, and codebase tidy-up

- Switched the AI assistant to Groq's `qwen/qwen3.6-27b` through the official SDK. Three defects in the supplied configuration were caught only by calling the live API: reasoning tokens arrive inside the message content as a `<think>` block, so every JSON parse would have failed and the assistant would have silently answered from the deterministic fallback forever; a 2048-token ceiling truncates before any answer appears, since reasoning alone consumed over 4096 and a real reply needed 5,294; and this model rejects JSON mode outright with HTTP 400 because the raw generation opens with prose. Fixed by requesting reasoning in a separate field, raising the ceiling to 8192 with a 90-second timeout, and describing the schema in the prompt with a shape check on the result.
- Verified end to end that a real reply signposts rather than calculates, and that removing the key leaves the same endpoint answering deterministically, so the core journey never depends on the model.
- Improved readability on the text-heavy screens. The root cause was a deleted custom property still referenced in two files, which voids the declaration and leaves text inheriting an arbitrary colour. Text collapsed from six colours to three roles, Slate removed from text entirely at 3.3:1, line height raised to 1.6, and a prose measure capped near 65 characters.
- Fixed the scheme assistant being impossible to close on a narrow viewport: expanded, the panel sat beneath the fixed top bar, which physically covered its close control. Also replaced the navigation's "Menu" text with a hamburger icon while keeping the accessible name.
- Rewrote the README around the problem, the solution, what makes it distinctive, and numbered setup steps with environment tables and troubleshooting. Corrected every feature document; the old set claimed a light palette, a browser-fixture emergency fund, a retired CSV import, wrong route prefixes, environment variables that do not exist, and two documents contradicted each other about the savings screen.
- Tidied the codebase: removed an unused date module, an orphaned CSV template, an empty OCR package, a dead weekly-entry adapter, dead tokens and 23 stale placeholder files. The regenerated OpenAPI specification gained 330 lines, revealing the committed contract predated the financial score feature and the generated client types were stale with it.
- Verified: 300 backend tests with the database and Ruff clean, 92 frontend tests, TypeScript and production builds clean, and no API key present in any tracked file.

## 2026-09-03 — Cobalt palette, public landing page, and the six-month fund default

- Replaced the Origin palette wholesale with the supplied Cobalt scheme: Onyx canvas, Graphite cards, Obsidian elevated surfaces, Slate borders, Ash body copy, Ivory headings, and Cobalt as the single accent. Structure, typography, radii, spacing and the flat no-shadow elevation are unchanged.
- Because the scheme has one accent rather than six, the chromatic feature tiles collapsed to an accent tile and a muted tile, alternating so Cobalt punctuates rather than dominates. Chart colours moved into `frontend/src/lib/chartTheme.ts` so the next palette change is a single edit.
- Measured contrast before assigning roles. Cobalt reaches only 3.4:1 on the canvas, so it is confined to fills, borders, focus rings and chart strokes, never body text; white on a Cobalt fill reaches 4.7:1 and carries the primary action. Slate is restricted to borders. Implementing this surfaced several pre-existing violations where the old accent had been used as small text, which were corrected.
- Made the landing page the public front door. A signed-out visitor now meets it at the root with a single call to action, and the sign-in form moved to its own route. Previously the root showed a bare sign-in form, which is not a landing page.
- Fixed the emergency fund default: the code already said 26 weeks, but plan rows created before that change still held the old four-week value, so existing users saw a four-week goal. A migration moves coverage plans off the old default. It cannot distinguish a deliberate four-week choice from the old default, and that trade-off is recorded in the migration and the model documentation.
- The weekly saving target and recommendation now disappear once the goal is met, replaced by a calm confirmation that still makes raising the goal obvious. Contributions, emergency use and the starting-balance correction are untouched.
- Verified: 292 backend tests with the database and Ruff clean, 94 frontend tests, TypeScript and production builds clean, zero old-palette values and zero old tile modifiers remaining, and a live browser pass confirming the canvas renders at #171721 and a signed-out visitor reaches the landing page with exactly one call to action.

## 2026-09-03 — Origin dark design system, landing page, and the Financial Score fixes

- Applied the supplied Origin Financial dark design system across every page: Obsidian canvas, DM Serif Display headlines substituting Lyon Display, Inter for UI, Roboto Mono for uppercase labels, flat elevation by surface colour step, and chromatic colour reserved for full-bleed feature tiles. One global token layer and a 25-class semantic contract in `frontend/src/styles.css` are consumed by every feature folder, so the four parallel restyles could not drift.
- Because the system forbids chromatic accents under 18px, income and cost, matched and unmatched schemes, and warning states now carry a sign, a mono label, or an icon instead of relying on green and red.
- Added a landing page for visitors who have not onboarded: a display hero, chromatic feature tiles, sample visuals built from real components with fictional figures, and exactly one call to action into onboarding. An existing user never sees it, including when the bootstrap request fails.
- Diagnosed the reported "financial score not calculated" as two separate faults. The running backend was serving code older than the score route and returned 404, and the score itself withheld a number without saying why. The response now carries a `missingInputs` list naming each absent input with an in-app route, shown whether the score is withheld or merely incomplete.
- Fixed a request storm found only by watching the live app: the score refetch was keyed off the bootstrap `syncedAt` timestamp, which the server regenerates on every response, producing eight requests per page load. The key is now derived from the user's own data, and a sequence guard stops a stale response overwriting a newer one.
- Added a cumulative-savings chart per savings goal with a dashed target line and an accessible text summary, a current-week card showing money in, out, and remaining, and renamed the vague "money left" figure to "left after costs" with a line stating what it subtracts.
- Sync status is now hidden unless a mutation actually failed or conflicted; the offline banner remains, since connectivity is not sync state.
- Verified: 290 backend tests with the database and Ruff clean, 89 frontend tests, TypeScript and production builds clean, every consumed design class defined, zero light-theme utilities remaining, and a live browser pass confirming the canvas renders at #0f1011 with no horizontal overflow. The score could not be exercised in the browser because the developer's backend process predates the route and needs restarting.

## 2026-09-03 — Financial Score, home page rebuild, and the dated-range consistency fix

- Reviewed the dated-range transaction work through the refreshed Graphify graph and verified every finding against source and a live database probe.
- Closed the critical inconsistency: a transaction carrying `occurred_until` was spread across its calendar days by the frontend but assigned entirely to its start week by the backend, which distorted the savings recommendation. The backend now adopts the daily spread, both implementations are pinned to the shared fixture `contracts/fixtures/transaction-week-split.json`, and ranges are capped at 366 days in the database, the schema, and the date input.
- Added a deterministic Financial Score (`GET /api/v1/financial-score`) scoring the emergency fund out of 40, savings habit out of 30, and cash flow out of 30, rescaled over whatever can actually be measured. No AI participates; every figure traces to a documented formula.
- Rebuilt the Home page around the score: an SVG dial and component breakdown, one row of three key figures, and a single eight-week trend chart, with details left to their own tabs.
- Redesigned the Savings tab to match the Emergency Fund layout, removed its pinned fund overview, and put both the add-goal form and each goal's detail behind keyboard-operable disclosures. Reworded the Setback planner for a general reader, removed its situation preset picker, and grouped the three suggested actions into one box.
- Fixed two reported defects at the root: the transaction amount field carried a `pattern` with literal double backslashes so no number could ever satisfy it, and the explainer posted `ruleId` where the API expects `rule_id`. The scheme navigator request bodies are now typed against the generated OpenAPI schemas so that class of drift fails the build.
- Moved Financial details under Profile with `/settings` redirecting, restored the ability to correct the emergency fund starting balance behind a disclosure, and stopped `formatMoney` from rendering a fabricated S$0.00 by bumping the offline cache version instead.
- Fixed a genuine 500: the bootstrap created a profile without committing it, and the essential-expense and recurring-cost writes never ensured one, so a new user's first write failed a foreign key. Both paths are fixed and covered by database-backed regression tests.
- Corrected two flaws in the score design found only by live probing. A user with no measurable emergency fund scored 100 and was labelled resilient, so the band is now capped when the buffer is unmeasured or under half its target. A brand-new user scored 0, so a score is now withheld until the fund or cash flow can actually be measured.
- Verified: 279 backend tests with the database, 59 frontend tests, Ruff clean, TypeScript and production builds clean, regenerated OpenAPI and TypeScript types, and live end-to-end probes of the score, transactions, explainer, and emergency fund. Not verified in a real browser session because agent sign-in credentials are unavailable.

## 2026-09-03 — Graphify-led review, emergency-fund redesign, and roadmap refactor

- Reviewed the whole project with the Graphify graph plus source verification; findings recorded in the conversation and driving this session's changes.
- Defined the emergency-fund and savings calculation model in `documentation/features/emergency-fund-model.md`: balance = opening balance + deposits − withdrawals, essentials-only weekly expenses, default 26-week coverage goal, reached/remaining instead of percentages, and a separate savings-goal ledger.
- Fixed the balance double-count: weekly entries no longer write the profile opening balance; one SQL-aggregate ledger module now serves both the Foundation bootstrap (`profile.emergencyFundBalanceCents`) and the Emergency Fund summary. Regression test added against the live database.
- Added the Savings Goals feature end to end (migration reusing `goals`/`goal_contributions`, `/api/v1/savings-goals` routes, `/savings` tab with the pinned emergency-fund overview).
- Backend refactor: single `backend.app` import root and one pytest config, one pydantic-settings module, local Supabase JWT verification with JWKS caching and remote fallback, one `DomainError` and one `{error:{...}}` envelope, every route under `/api/v1`, Pydantic request models for the Emergency Fund router, answer coercion in the scheme evaluator, validated `X-Request-ID`, IntegrityError handling, deduplicated requirements, CSV import retired, Ruff clean.
- Frontend refactor: always-visible collapsible menu with a fixed top bar, one `apiRequest`/`ApiError` client with 401 refresh-and-retry, dead weekly-entry and CSV code removed, Scenario Simulator seeded from real transactions and expenses, Income Reality surplus now subtracts recurring and essential costs like the fund does, percentage-of-goal and milestone UI removed.
- Verified: 242 backend tests with the database (222 + 20 skipped without), Ruff clean, `tsc -b`, 44 frontend tests, production build, regenerated OpenAPI and TypeScript types, and a live in-process contract probe of bootstrap, Emergency Fund, Savings, Scheme Navigator, and Scenario routes. Not verified in a real browser session because sign-in credentials are not available to the agent.

## 2026-09-03 — Apply the mobile editorial visual system

- Reworked the shared React visual layer around the supplied DESIGN.md: warm paper surfaces, ink typography, Forest action states, 4px geometry, warm shadows, and a blue selection accent.
- Replaced the mobile horizontal route strip with an accessible fixed **Menu / Close** disclosure, while keeping the full navigation visible on wider screens.
- Applied the same tokens to the Emergency Fund and Scheme assistant so the expanded integrated flows remain visually cohesive; documented the rules and 390px test expectation in `frontend/README.md`.
- Verified the production frontend build, all 26 frontend tests, a 390px browser view of Home and Income Overview, mobile menu navigation, and an error-free browser console. Refreshed Graphify after the code changes.
- In the user-shared Figma file, created an editable three-screen 390px mobile demo (home, income pattern, and navigation), with reusable local action styling and working taps between the Menu, Home, and Income Pattern frames. The temporary raw capture was removed after the editable screens were verified.

## 2026-09-03 — Simplify and connect the integrated user journey

- Fixed the shared navigation to the top and shortened its labels and core page wording.
- Replaced Income Reality's dense metric cards with a weekly trend chart, plain-language summary, and expandable week rows.
- Removed weekly emergency-balance editing in favour of a direct “Record emergency use” journey, added one dedicated plan-edit action, and compacted fund activity into expandable recent rows.
- Added corner/full-window modes to the Scheme assistant, simplified scheme results into expandable summaries, strengthened form constraints, and split chart-heavy feature routes from the initial bundle.
- Verified 26 frontend tests, the production PWA build without the prior large-chunk warning, live chat fallback responses, desktop/mobile browser flows, and a clean browser console.

## 2026-09-02 — Refresh integrated project documentation

- Reworked the root README into a current, single-path overview of the integrated five-feature application, local setup, verification commands, and documentation index.
- Updated every package and feature README/documentation file to distinguish historical branch notes from the current `dev` architecture and verification results.
- Documented the remaining runtime boundaries: browser-fixture Emergency Fund persistence, stateless Scenario persistence, Scheme rule review, and optional Groq fallbacks.
- Validated local Markdown links, conflict-marker absence, whitespace, and the refreshed Graphify project graph.

## 2026-09-02 — Repair the merged development application

- Reconciled duplicated merge fragments in the frontend manifest, Vite config, TypeScript config, React entry point, shared application shell, and FastAPI entry point.
- Integrated all five feature routes into the Foundation shell, retained the PWA/test setup, added the Scenario Simulator proxy, and synchronized the root workspace lockfile.
- Normalized backend source imports so both tests and the documented root Uvicorn command load the same package graph; formatted the backend and cleared Ruff findings.
- Verified 26 frontend tests, the production PWA build, 188 passing backend tests with 3 database-dependent skips, Ruff, JSON parsing, and live PWA/API/database/Scheme Navigator health checks.
- Refreshed the Graphify code graph and launched the local Supabase, FastAPI, and Vite services.

## 2026-09-02 — Add Graphify cross-agent project integration

- Installed Graphify's project-scoped generic Agent Skills bundle at `.agents/skills/graphify/`, complementing the existing Codex `AGENTS.md` integration.
- Updated `.gitignore` to retain shareable Graphify output while excluding its machine-specific cache, cost tracker, personal memory/reflections, absolute-path metadata, and dated backup snapshots.

## 2026-09-02 — Clarify new-week entry and CPF-estimator behaviour

- Changed both “Add” actions to open a blank new-week flow instead of routing to the current week's existing record; when the current week exists, the form defaults to the following Monday.
- Verified saved weekly entries appear in Income Reality immediately through the shared Foundation state and the live calculation request.
- Clarified that recorded CPF amounts take priority and added browser coverage proving the 8% estimator applies to a week without recorded CPF.
- Reworked browser tests to create and delete their own future-dated temporary records, preserving the user's local entries.

## 2026-09-02 — Repair queued week-entry saves after duplicate-ID errors

- Found that changing the date in an existing weekly entry cloned its weekly/child IDs; PostgreSQL rejected the duplicate key as a 500, leaving later offline mutations queued behind it.
- New-date saves now generate fresh weekly, earning, and variable-cost IDs; the client also repairs old queued week mutations whose IDs collide with server data before replaying them.
- The API returns a typed 409 conflict instead of an unhandled 500 for duplicate parent or child IDs. Restarted the local FastAPI listener after the code change.
- Verified 3 live database API tests, Ruff, 4 frontend unit tests, frontend build, and 3 Playwright journeys; restored the synthetic local seed afterward.

## 2026-09-02 — Restore local PWA mutation sync in embedded browsers

- Diagnosed queued edits that remained pending in the embedded local browser: FastAPI accepted the Foundation writes and its CORS preflight, but the browser blocked the separate `localhost:8000` API origin.
- Made Vite proxy `/api/*` to the local FastAPI server and made development client requests same-origin, while retaining `VITE_API_BASE_URL` for a production API origin.
- Added browser coverage that saves assumptions, verifies the profile/recurring/essential writes occur, and waits for the sync queue to drain. Verified the Vite proxy, 4 frontend unit tests, frontend build, and 2 Playwright journeys.

## 2026-09-02 — Integrate Feature 1 foundation with Feature 2 Income Reality

- Mounted the original Feature 2 deterministic router at `/api/v1/income-reality/breakdown` inside Feature 1's FastAPI application and regenerated the committed OpenAPI/TypeScript contract.
- Added a typed frontend adapter from confirmed Feature 1 weekly entries to Feature 2 inputs: repeated platform rows aggregate, monthly snapshots use Feature 1's weekly conversion, drafts are excluded, and requests are ordered oldest-first.
- Resolved the CPF overlap per user direction: an actual Feature 1 CPF variable cost is passed separately, removed from aggregate work costs, and overrides Feature 2's percentage estimate for that week.
- Added the `/income-reality` route to Feature 1's shared shell, retained Feature 2's calculations and assumption controls, and added minimal styling plus warnings for historical entries without expense snapshots.
- Fixed Feature 2's controlled CPF checkbox to render its local assumption immediately while calculated results remain server-authoritative.
- Updated CSV-created weeks to capture immutable recurring/essential expense snapshots just like manually created weeks.
- Added adapter, recorded-CPF engine/router, shared-app route, and live Playwright coverage. Verified 4 frontend unit tests, frontend production build, 24 always-on backend tests plus 2 live-database tests, Ruff, live Supabase/FastAPI API results, and a Playwright browser pass with no console errors.

## 2026-09-02 — Verify live local Feature 1 stack and document the handoff

- Started the existing local Supabase database, PWA, and FastAPI service; API readiness returned `{"status":"ready"}` and the PWA root returned HTTP 200.
- Opened the locally running PWA in Codex's integrated browser at `http://localhost:5173`.
- Diagnosed the Python 3.14 dependency-wheel incompatibility and ran the unchanged backend requirements successfully in a separate Python 3.13 environment.
- Updated root, backend, Supabase, and Feature 1 documentation with supported Python versions, exact local run/stop commands, project-reference handoff, and secret-sharing boundaries; ignored versioned local virtual environments.

## 2026-09-02 — Implement Feature 1 foundation input

- Built the React/TypeScript/Tailwind PWA shell, onboarding, editable weekly/assumption flows, strict CSV preview/import, IndexedDB cache and ordered offline mutation queue, and visible sync conflict controls.
- Built the FastAPI/Pydantic/SQLAlchemy foundation API with consistent errors, idempotent revisioned weekly writes, CSV validation, reset protection, readiness checks, and generated OpenAPI/TypeScript contracts.
- Added a private Supabase PostgreSQL schema with constraints, indexes, RLS posture, immutable weekly snapshots, integration envelopes for goals/scenarios/scheme rules, synthetic seed data, and pgTAP tests.
- Pinned Node, npm package, Python package, and Supabase CLI versions; added verified local setup commands and teammate environment/secret handoff documentation.
- Verified frontend tests/build, backend unit/integration tests and Ruff, local migration/seed, 13 database tests, schema lint, and npm audit.
- After the user authenticated and linked the project, dry-ran and pushed only the foundation migration without roles or seed data; verified migration parity, 13/13 tables with RLS, denied direct Data API role privileges, and clean remote security/performance advisors.

## 2026-09-01 — Income Reality Engine (workstream 2) integration seam and live demo

- User asked how to test/run the frontend now that it existed. Ran a genuine live end-to-end demo instead of
  only a type-check: a real `uvicorn`-served FastAPI app (`backend/_demo_main.py`, temporary) mounting the
  actual router on `localhost:8000`, and a real Vite dev server (temporary `package.json`/`vite.config.ts`/
  `index.html` under `frontend/`) on `localhost:5173`. Verified the backend returned the exact fixture response
  over real HTTP, and Vite transformed every module with no compile errors. Both ports confirmed listening, then
  stopped by PID after the user was done looking; all temporary files removed and `git status` confirmed clean.
- User pointed out the demo only used mock scenario data with no defined path for `feature/01-foundation-input`'s
  future manual-entry data to flow in. Added the integration seam, scoped to Workstream 2's own ownership
  boundary (not touching `frontend/src/app/`, which doesn't exist yet and is Workstream 1's):
  `useIncomeRealityBreakdown.ts` (fetch/loading/error/assumptions state, keyed off a JSON-serialised `weeks`
  value so callers don't need to memoise the array) and `IncomeRealityPage.tsx` (takes `weeks: WeeklyEntryIn[]`
  as its only prop; handles empty/loading/error states). Whoever builds routing later renders
  `<IncomeRealityPage weeks={...} />` with real entries - documented as the exact seam in
  `documentation/features/income-reality.md`.
- Rewired the temporary demo to go through `IncomeRealityPage` instead of ad hoc fetch logic, confirmed via the
  live servers that the new hook/page still transform and respond correctly, and ran a full `tsc --noEmit` over
  all of `frontend/src` (0 errors) before tearing the demo down.
- Committed as `f2f1ca7` and pushed.

## 2026-09-01 — Income Reality Engine (workstream 2) test execution follow-up

- Follow-up to the initial-implementation entry below, in the same session: user asked how the written tests
  would actually be run, since neither Python nor Node.js was installed. Installed both via `winget`
  (`Python.Python.3.12` → 3.12.10; `OpenJS.NodeJS.LTS` → 24.19.0) with explicit user sign-off, since this is a
  system-level change.
- Added `backend/pytest.ini` (`pythonpath = .`) so `pytest` reliably resolves `app.*` imports regardless of
  invocation directory, without needing a dependency manifest.
- Ran `backend/tests/unit/income_reality/` for real: `test_engine.py`'s 10 tests passed outright.
  `test_fixtures.py` failed on the first run — the hand-computed `multi-week-deficit` fixture's
  `conservative_weekly_income_cents` used `round(average) - round(stdev) = 214`, but the engine computes
  `round(average - stdev) = 213` from the unrounded values. Fixed the fixture and the schema/doc wording that
  had implied those two computations were interchangeable.
- Installed `fastapi`/`pydantic`/`httpx` and added `backend/tests/integration/income_reality/test_router.py`
  (4 tests) to exercise `schemas.py`/`router.py` for the first time via `TestClient` against a throwaway
  `FastAPI()` app — all passed. Full backend suite: **15/15 passing**.
- For the frontend (no test tooling exists yet — that's Workstream 1's choice to make), ran `tsc --noEmit`
  (TypeScript 5.6.3, `@types/react` 18.3.12) over every file in `frontend/src/features/income-reality/` as a
  substitute sanity check: 0 type errors. Required temporarily placing a `package.json`/`tsconfig.json`/
  `vite-env.d.ts` directly under `frontend/` (TypeScript's module resolution needs `node_modules` to be an
  actual filesystem ancestor of the checked files) — all removed immediately after, confirmed via `git status`
  that `frontend/` returned to its exact prior state.
- Updated `documentation/features/income-reality.md`'s Tests-performed/Known-limitations/Next-steps sections to
  reflect what was actually executed, replacing the earlier "not yet executed" language.
- Logged the fixture-rounding mistake, the mid-session PATH refresh issue, the `npm --no-save` pruning issue,
  and the TypeScript module-resolution issue in `.agent/lessons_learnt.md`.

## 2026-09-01 — Income Reality Engine (workstream 2) initial implementation

- Confirmed via `git branch`/`git diff` that every branch, including `feature/01-foundation-input`, still had
  only the empty tracked scaffold: no dependency manifests, no FastAPI/Vite entry points, no Supabase
  migrations. User confirmed teammates are working their own branches in parallel and the team plan is to
  merge first and integration-test after merging, so this session avoided duplicating Workstream 1's owned
  scaffolding.
- Implemented the deterministic engine (`backend/app/features/income_reality/engine.py`,
  `assumptions.py`) as pure, framework-independent functions: per-week net income/surplus breakdown and a
  recent-week trend with a `max(0, average - stdev)` conservative income figure. Negative net income/surplus
  are reported as true deficits, not floored to zero.
- Added Pydantic schemas and an unmounted FastAPI router (`schemas.py`, `router.py`) exposing
  `POST /income-reality/breakdown`, documented for `feature/01-foundation-input` to mount once `app/main.py`
  exists.
- Proposed a shared contract (`contracts/schemas/income-reality.schema.json`) and three paired fixture
  scenarios (`contracts/fixtures/income-reality/`) covering a typical multi-platform week, a zero-income week,
  and a multi-week trend with a deficit week and CPF applied — including a Monday-start `week_start`
  convention flagged as a proposal pending confirmation from other workstream owners.
- Wrote `backend/tests/unit/income_reality/test_engine.py` (mandated scenarios: multiple platforms, zero
  income, costs exceeding earnings, CPF on/off, single- and multi-week trend) and `test_fixtures.py` (asserts
  the committed fixture responses match the engine's actual output).
- Built bare-bones (intentionally unstyled, per explicit user direction) frontend pieces in
  `frontend/src/features/income-reality/`: `types.ts`, `api.ts`, `format.ts`, and components
  `IncomeBreakdownCard`, `RecentTrendSummary`, `AssumptionsEditor`, `IncomeRealityView`.
- Added `documentation/features/income-reality.md` covering scope, assumptions, interfaces, and limitations.
- **Not performed:** no Python interpreter was available in this environment (`python`/`python3` both failed),
  so `pytest` was never actually run — fixture numbers were hand-computed and cross-checked with PowerShell
  arithmetic instead of the real engine. Running the test suite is the first outstanding step once a Python
  environment exists (see `documentation/features/income-reality.md`).

## 2026-09-01 — Shared codebase folder scaffold

- Created mirrored React and FastAPI feature directories for all five workstreams.
- Added explicit areas for shared contracts, synthetic fixtures, Supabase migrations, database tests, AI/OCR integrations, and feature documentation.
- Added package-specific environment examples containing placeholders only.
- Documented Supabase as managed PostgreSQL behind FastAPI, directory ownership, dependency boundaries, and deferred setup work.
- Validated all 36 expected scaffold files, README links, environment-example trackability, private-context exclusion, and whitespace.
- Integrated and pushed the shared scaffold to `main` and all five feature branches without rewriting branch history.

## 2026-09-01 — Purge sensitive objects from local Git storage

- Audited all refs and reflogs and identified the former sensitive scaffold snapshot and its six blobs.
- Deleted only the sensitive commit object, its two unique trees, and its six file blobs from the loose-object database.
- Removed stale reflog entries pointing to the deleted commit while preserving unrelated recovery history.
- Preserved the ignored local `context/` directory while keeping it absent from every branch and remote-tracking ref.
- Verified that the former sensitive commit and all six sensitive blobs no longer exist in the local Git object database.

## 2026-09-01 — Remove private context from Git history

- Added the root `context/` directory to `.gitignore` for private out-of-band sharing.
- Removed the context artifacts from the Git index while preserving the local files.
- Amended the unpushed scaffold commit and realigned all five workstream branches.
- Removed the exact tool-managed snapshot reference that retained the earlier context tree.
- Verified that `origin/main` never contained the context artifacts.

## 2026-09-01 — Initial collaboration scaffold

- Reviewed the approved Resilience proposal and system architecture.
- Defined five full-stack prototype workstreams and a numbered feature-branch convention.
- Added mandatory agent rules and durable memory files under `.agent/`.
- Reworked the public README with product scope, stack, setup guidance, team workflow, and AI-agent entry instructions.
- Kept `context/` outside version control because it contains personal information and is shared privately with the team.
- Added detailed workstream contracts and acceptance checks in `documentation/initial-scaffold.md`.
- Validation performed: Markdown review, ignore-rule checks, clean tracked-file status after commit, and branch-ref verification.
