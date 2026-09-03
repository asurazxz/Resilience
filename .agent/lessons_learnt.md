# Lessons Learnt

Read this file before executing any repository task. Add an entry only after a real error has been encountered and resolved.

## 2026-09-03 — Never write a derived total back into its own base column

- **Symptom:** Saving a weekly entry raised the emergency-fund balance by the sum of all contributions each time (S$1,050 became S$1,100 with no new deposit).
- **Root cause:** The bootstrap returned the derived balance (opening balance + ledger) in the same field the client sent back as the week's savings, and the week upsert stored that value into the opening-balance column, so the ledger was added twice.
- **Resolution:** Weekly entries only snapshot the balance; one ledger module computes the balance with a SQL aggregate; the bootstrap exposes the derived value under a separate `emergencyFundBalanceCents` field. A live-database regression test guards it.
- **Prevention:** Keep stored inputs and derived outputs in differently named fields, and never let a write path accept a derived value for a base column.

## 2026-09-03 — FastAPI 0.141 no longer exposes `.path` on top-level included routers

- **Symptom:** `[r.path for r in app.routes]` raised `AttributeError` while listing mounted routes.
- **Root cause:** Routers included with `include_router` appear as `_IncludedRouter` wrappers in `app.routes` on this FastAPI version.
- **Resolution:** Flatten via `r.original_router.routes` when the wrapper is encountered, or read `app.openapi()["paths"]`.
- **Prevention:** Use the OpenAPI document to enumerate routes; do not assume `app.routes` is flat.

## 2026-09-03 — Fall back to the in-app browser when the verification CLI is absent

- **Symptom:** The prescribed `agent-browser` visual verification command was not installed on the Windows host, and the in-app runtime rejected `networkidle` despite exposing it in the generic API type.
- **Root cause:** This desktop environment provides browser control through the Codex in-app browser runtime rather than the standalone CLI, with a smaller supported load-state set.
- **Resolution:** Used the installed Browser skill and its persistent in-app tab, waited for `domcontentloaded` plus a bounded render delay, and completed DOM, interaction, responsive, screenshot, and console-log checks there.
- **Prevention:** Check the available browser surface before invoking a standalone verifier; on this host use the in-app browser and `domcontentloaded` for local visual testing.

## 2026-09-02 — Test the documented package import path

- **Symptom:** Backend tests passed, but the documented `backend.app.main:app` Uvicorn launch failed with `ModuleNotFoundError: app`.
- **Root cause:** The test configuration added `backend` to `PYTHONPATH`, masking branch-local absolute `app.*` imports that do not exist when the application is imported from the repository root.
- **Resolution:** Converted backend source imports to package-relative imports and verified both the test suite and a live root-level Uvicorn launch.
- **Prevention:** After integration, import the application through the exact production/development entry point in addition to running tests; avoid source imports that depend on test-only `PYTHONPATH` entries.

## 2026-09-02 — Inspect shared merge files even when Git reports no conflicts

- **Symptom:** Git reported a clean merge, but the frontend manifest, Vite config, TypeScript config, React entry point, application shell, and FastAPI entry point contained concatenated branch versions.
- **Root cause:** Conflict resolution committed both sides sequentially, leaving syntactically invalid or semantically overwritten shared files without unmerged index entries or conflict markers.
- **Resolution:** Reconstructed each shared file from both parents, retained every required dependency and route, then verified with JSON parsing, compilers, tests, lint, and live health checks.
- **Prevention:** After a large feature merge, compare shared entry points against both merge parents and run real build/test/launch checks even when `git diff --diff-filter=U` and conflict-marker searches are empty.

## 2026-09-02 — Keep browser integration fixtures isolated from a user's local demo data

- **Symptom:** A browser test that asserted seeded dollar values failed after legitimate local entries had changed the shared development database.
- **Root cause:** The test assumed a reset synthetic seed while the local API correctly retained user-entered records.
- **Resolution:** Replaced seed-specific assertions with future-dated records created and deleted by each test.
- **Prevention:** Browser tests against a shared local service must own their setup and cleanup; never reset user data merely to satisfy a test fixture.

## 2026-09-02 — Never clone persistent child IDs into a new weekly entry

- **Symptom:** Saving an existing week under a different date produced a 500, and the offline queue could not progress beyond that mutation.
- **Root cause:** The date change represented a new `weekly_entries` row, but the editor reused the old row's UUID plus its earning/variable-cost UUIDs, violating primary-key constraints.
- **Resolution:** Generate new IDs whenever a date change creates a separate week, repair those collisions in queued legacy mutations, and convert any remaining duplicate-ID request into a typed 409 API error.
- **Prevention:** When copying persisted aggregate data to create a new record, regenerate every record and child identity; test both the direct save and offline replay path.

## 2026-09-02 — Keep local browser API calls same-origin

- **Symptom:** Foundation mutations stayed queued when edits were made in the embedded local browser, although the API was healthy.
- **Root cause:** The PWA called `localhost:8000` directly from `localhost:5173`; the embedded browser blocked that separate local origin before the request reached FastAPI.
- **Resolution:** Used Vite's `/api` proxy during development and made development API URLs relative, so the browser talks only to `localhost:5173` and Vite forwards requests to FastAPI.
- **Prevention:** For a locally split frontend/API setup that must run in embedded browsers, use a same-origin development proxy and verify a real queued mutation drains through it.

## 2026-09-02 — Controlled inputs should render local intent during refetches

- **Symptom:** Playwright clicked the CPF-estimate checkbox, but the controlled input immediately returned to unchecked until the API response arrived.
- **Root cause:** The editor rendered `response.assumptions_applied` from the previous response instead of the hook's current local `assumptions` state.
- **Resolution:** Passed local assumptions separately into `IncomeRealityView`; calculated values still render only from backend responses.
- **Prevention:** During request-driven edits, bind controls to local state and bind results to server state so network latency cannot visually undo user input.

## 2026-09-02 — Restore synthetic seed data after destructive API tests

- **Symptom:** A browser integration rerun opened onboarding and could not find the Income Reality page after backend database tests passed.
- **Root cause:** The Foundation integration tests intentionally reset the anonymous demo profile, leaving valid but unseeded state for the next test phase.
- **Resolution:** Ran the local database reset to reapply the committed synthetic seed before the Playwright journey.
- **Prevention:** Run state-mutating database tests before a seed reset, then start browser journeys from freshly seeded local data.

## 2026-09-02 — Match immutable array helpers to the configured TypeScript library

- **Symptom:** The integrated frontend build rejected `toSorted` and `toReversed` even though the installed Node runtime supports them.
- **Root cause:** The frontend TypeScript library target predates ES2023, so those methods are absent from its compile-time types.
- **Resolution:** Sorted a newly created adapter array in place and reversed a spread copy of the response array, preserving input immutability without changing the compiler target.
- **Prevention:** Check `tsconfig`'s target/lib before using new ECMAScript helpers; use copy-then-mutate fallbacks when the repository intentionally targets an older library.

## 2026-09-02 — Invoke import-dependent repository scripts as modules

- **Symptom:** Running `python backend/scripts/export_openapi.py` failed to import the top-level `backend` package.
- **Root cause:** Direct script execution put `backend/scripts` rather than the repository root first on `sys.path`.
- **Resolution:** Ran `python -m backend.scripts.export_openapi` from the repository root, then regenerated frontend API types.
- **Prevention:** Invoke repository scripts that use root-package imports with `python -m package.module` from the repository root.

## 2026-09-02 — Verify the exact Vite listener before browser testing

- **Symptom:** The first Playwright check could not find the integrated page, and a corrected Vite launch moved to port 5174.
- **Root cause:** An extra npm argument was forwarded as a Vite project path, and stopping the wrapper left its child Node listener on port 5173.
- **Resolution:** Identified the exact listener PIDs, terminated only those stale Vite process trees, restarted the documented `npm run dev:frontend` command on port 5173, and reran the browser test successfully.
- **Prevention:** Start Vite with the documented project script unless extra arguments are necessary, confirm the reported URL, and verify that the port is released before retrying.

## 2026-09-02 — Use Python 3.12 or 3.13 for the pinned backend dependencies

- **Symptom:** The existing Python 3.14/MINGW virtual environment could not install the pinned `psycopg-binary` wheel; Uvicorn's optional dependencies and `pydantic-core` also attempted unsupported source builds.
- **Root cause:** The pinned dependencies provide Windows wheels for Python 3.12/3.13, but not for this Python 3.14/MINGW runtime.
- **Resolution:** Created a separate Python 3.13 virtual environment, installed the unchanged `backend/requirements.txt`, then started and health-checked FastAPI successfully.
- **Prevention:** Create the project environment with Python 3.12 or 3.13 and do not attempt to make the application run on 3.14 unless dependency pins and wheel availability are reviewed together.

## 2026-09-02 — Complete Supabase authentication in the user's terminal when agent login crashes

- **Symptom:** The bundled Windows Supabase CLI crashed after browser verification and did not persist its access token from the coding-agent session.
- **Root cause:** The CLI's bundled Bun runtime failed during the agent-driven login flow, outside the repository's code.
- **Resolution:** The user completed authentication and project linking from their own terminal; subsequent agent-run dry-run, push, queries, and advisors authenticated successfully.
- **Prevention:** If interactive Supabase login crashes inside the agent environment, do not repeat verification-code attempts; have the user run `npx supabase login` and `npx supabase link` in their terminal, then resume non-interactive verification.

## 2026-09-02 — Check tool peer ranges before choosing newest versions

- **Symptom:** `npm install` rejected TypeScript 7 because the pinned OpenAPI TypeScript generator supports TypeScript 5.x.
- **Root cause:** Individually current versions were selected before verifying their peer-dependency intersection.
- **Resolution:** Pinned TypeScript 5.9.3 and regenerated the lockfile; installation and API type generation then passed.
- **Prevention:** Check peer ranges across build/code-generation tools before pinning a newly released major version.

## 2026-09-02 — Use worker threads for Vitest on this Windows workspace

- **Symptom:** Vitest's default fork pool timed out before a test file started.
- **Root cause:** Child-process workers did not respond reliably in this Windows desktop execution environment.
- **Resolution:** Configured a single worker-thread pool; the frontend tests then completed normally.
- **Prevention:** Keep the repository's explicit Vitest pool settings unless verified in all supported team environments.

## 2026-09-02 — Place environment dependencies where hoisted tools resolve them

- **Symptom:** Hoisted Vitest could not resolve jsdom even though jsdom was declared in the frontend workspace.
- **Root cause:** npm placed Vitest at the monorepo root and jsdom inside the workspace, outside Vitest's package-resolution path.
- **Resolution:** Added the same exact jsdom version to root development tooling so npm hoisted it beside Vitest.
- **Prevention:** In npm workspaces, verify runtime resolution from the hoisted tool's location, especially for optional test environments.

## 2026-09-01 — Replace existing files with update patches

- **Symptom:** The initial scaffold patch was rejected before changing any files.
- **Root cause:** It attempted to delete and add the same existing file in one patch instead of updating it.
- **Resolution:** Reissued the change using update operations for existing files.
- **Prevention:** Use update patches for tracked files; reserve add operations for paths that do not exist.

## 2026-09-01 — Request repository-metadata write access

- **Symptom:** Staging the scaffold failed because Git could not create `.git/index.lock`.
- **Root cause:** The workspace allowed project-file edits but exposed `.git/` as read-only in the initial sandbox.
- **Resolution:** Re-ran the required Git metadata operations with explicit repository-scoped approval.
- **Prevention:** When a requested task includes commits or branch creation in a read-only Git metadata sandbox, request scoped approval before retrying those operations.

## 2026-09-01 — Stop Git writes when validation fails

- **Symptom:** `git diff --cached --check` reported trailing whitespace, but the following commit command still ran.
- **Root cause:** A Markdown hard break contained trailing spaces, and independent shell statements did not make the commit conditional on validation success.
- **Resolution:** Removed the trailing spaces, amended the scaffold commit, and repointed the feature branches to the corrected commit.
- **Prevention:** Run validation as a separate gate or use conditional execution so a failed check stops subsequent Git writes.

## 2026-09-01 — Distinguish negative checks from command errors

- **Symptom:** A `git check-ignore` call for a filename containing spaces returned a fatal usage error, while the validation script labelled every non-zero result as "not ignored."
- **Root cause:** The check did not distinguish Git's expected exit code `1` from fatal exit codes, and the path was not passed reliably to the native command.
- **Resolution:** Checked the space-free parent directory and handled exit codes `0`, `1`, and fatal errors separately.
- **Prevention:** For predicate-style Git commands, explicitly distinguish a normal negative result from command failure before reporting success.

## 2026-09-01 — Audit every reachable Git reference

- **Symptom:** All visible branches were clean, but `git rev-list --all --objects` still found the private context artifacts.
- **Root cause:** A tool-managed `refs/codex/turn-diffs/.../base` tree reference retained the earlier tracked snapshot.
- **Resolution:** Removed that exact internal snapshot reference after confirming it contained the private paths, then repeated the all-reference reachability check.
- **Prevention:** Before publishing rewritten history, audit all refs and reachable objects rather than checking only branches and remote-tracking refs.

## 2026-09-01 — Purge only verified sensitive objects

- **Symptom:** A proposed all-reflog expiration and immediate garbage collection was rejected because it would also destroy unrelated abandoned work.
- **Root cause:** Repository-wide pruning was broader than the user's request to remove the identified sensitive snapshot.
- **Resolution:** Verified that the sensitive commit, its two unique trees, and six blobs were loose objects; deleted only those nine objects and used reflog stale-fix to remove their broken entries.
- **Prevention:** Prefer hash-verified object deletion and stale-reflog repair over repository-wide pruning when sensitive data is isolated in loose objects.

## 2026-09-01 — Split large multi-file patches

- **Symptom:** A large folder-scaffold patch applied most files but did not return and had to be terminated before its final documentation file was added.
- **Root cause:** The patch operation bundled many directory placeholders and a long document into one tool call.
- **Resolution:** Inspected the partial result, confirmed which files existed, and applied the missing document in a smaller follow-up patch.
- **Prevention:** Split large scaffolds into bounded patches and verify the filesystem after each batch.

## 2026-09-01 — Brace PowerShell variables before punctuation

- **Symptom:** The first cross-branch verification script failed to parse a status string containing `$branch:`.
- **Root cause:** PowerShell interpreted the colon as part of an invalid unbraced variable reference.
- **Resolution:** Changed the interpolation to `${branch}:` and reran the complete verification successfully.
- **Prevention:** Use braced PowerShell variable syntax when punctuation immediately follows an interpolated variable name.

## 2026-09-01 — Round once, at the end, not on each intermediate value

- **Symptom:** A hand-authored test fixture for a "conservative income" figure
  (`max(0, round(raw_average - raw_stdev))`) was computed as the difference of two already-rounded display
  values instead, giving 214 instead of the engine's actual 213.
- **Root cause:** `round(average) - round(stdev)` and `round(average - stdev)` are not the same operation and
  can differ by 1 whenever the two fractional parts don't cancel out. The fixture was authored by hand/PowerShell
  before a Python interpreter was available, using the rounded display fields instead of the raw statistics.
- **Resolution:** Computed the exact value with the real engine (`statistics.mean`/`pstdev`) once Python was
  installed, corrected the fixture, and reworded the schema/doc description that had implied the two were
  interchangeable.
- **Prevention:** When a formula composes multiple rounded quantities, always derive worked examples from the
  actual implementation (or an equivalent-precision calculation), never by re-deriving from already-rounded
  display values — and keep a test like `test_fixtures.py` that checks committed examples against the real code.

## 2026-09-01 — Refresh PATH from the registry after a mid-session winget install

- **Symptom:** `python --version` / `node --version` still failed immediately after `winget install` reported
  success.
- **Root cause:** Each shell tool call spawns a fresh process whose environment (including `PATH`) is captured
  at process start; the installer updates the registry but does not update already-running or newly-spawned
  processes that inherited the pre-install environment snapshot.
- **Resolution:** Explicitly rebuilt `$env:Path` from `[System.Environment]::GetEnvironmentVariable("Path","Machine"/"User")`
  at the start of each subsequent command.
- **Prevention:** After installing anything mid-session via `winget`/`msiexec`/similar, do not assume a "new"
  shell call will see it — refresh `PATH` from the registry explicitly in that same command.

## 2026-09-01 — Create a package.json before ad hoc `npm install` in a scratch directory

- **Symptom:** After installing `react`/`react-dom` into a directory that already had `typescript`/`@types/*`
  installed via separate `npm install --no-save` calls, the previously installed packages (including the `tsc`
  binary) disappeared ("removed 5 packages").
- **Root cause:** With no `package.json` present, npm has no record of which packages are "wanted," so each
  ad hoc `install --no-save` call treats everything not in its own argument list as extraneous and prunes it.
- **Resolution:** Wrote a minimal `package.json` first, then installed every needed package in one command.
- **Prevention:** For any multi-step ad hoc npm setup in a scratch directory, create a `package.json` before the
  first install (or install everything needed in a single command) so later installs don't prune earlier ones.

## 2026-09-01 — TypeScript module resolution needs node_modules as a real filesystem ancestor

- **Symptom:** `tsc --noEmit` reported "Cannot find module 'react/jsx-runtime'" for files outside the directory
  tree containing `node_modules`, even with `react`, `react-dom`, and their `@types` packages correctly
  installed.
- **Root cause:** Node/bundler-style module resolution for bare specifiers walks up from the *importing file's*
  own directory looking for `node_modules`, not from the `tsconfig.json` location. A scratch `node_modules` in
  an unrelated directory (e.g. a temp scratchpad) is never found for source files living elsewhere.
- **Resolution:** Placed a temporary `package.json`/`tsconfig.json` directly under the real source directory
  (`frontend/`) so `node_modules` was an actual ancestor of the checked files, ran the check, then deleted the
  temporary files and confirmed via `git status` that the directory returned to its prior state.
- **Prevention:** For ad hoc type-checks of files outside the tool's own working directory, install into an
  actual ancestor of those files (and clean up afterward), not an unrelated scratch location. Also pin an
  explicit `typescript` version for such checks — an unpinned "latest" install pulled TypeScript 7.0 (a new
  major version) whose breaking module-resolution changes (`moduleResolution: "node"` removed) were unrelated
  noise for a check meant to represent a stable, real project's toolchain.

Use this format for future entries:

### YYYY-MM-DD — Short title

- **Symptom:** What failed or behaved unexpectedly.
- **Root cause:** Why it happened.
- **Resolution:** What fixed it.
- **Prevention:** A reusable rule that should prevent recurrence.
