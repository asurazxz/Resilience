# Lessons Learnt

Read this file before executing any repository task. Add an entry only after a real error has been encountered and resolved.

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

Use this format for future entries:

### YYYY-MM-DD — Short title

- **Symptom:** What failed or behaved unexpectedly.
- **Root cause:** Why it happened.
- **Resolution:** What fixed it.
- **Prevention:** A reusable rule that should prevent recurrence.
