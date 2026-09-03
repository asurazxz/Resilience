# Agent Session Log

Append significant sessions in reverse chronological order. Keep entries concise and factual.

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
