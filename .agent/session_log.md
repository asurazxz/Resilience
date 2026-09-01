# Agent Session Log

Append significant sessions in reverse chronological order. Keep entries concise and factual.

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
