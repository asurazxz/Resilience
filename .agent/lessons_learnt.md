# Lessons Learnt

Read this file before executing any repository task. Add an entry only after a real error has been encountered and resolved.

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
