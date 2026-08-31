# Mandatory Agent Rules

These directives apply to every AI agent interaction in this repository. They are strict requirements, not suggestions.

## Scope

- Work within a one-week prototype constraint.
- Prioritise functional core features and an end-to-end demonstrable user journey.
- Discard pristine UI work and edge-case handling unless the user explicitly requests them or they are required for correctness, privacy, or safety.
- Do not begin deployment work unless the user explicitly changes the current scope.

## Memory

- Before executing any task, read `.agent/lessons_learnt.md` in full.
- Before changing an established area, also review the relevant recent entries in `.agent/session_log.md` and `documentation/`.
- After completing any work session, append a specific, concise entry to `.agent/session_log.md`.
- When an error is encountered and resolved, record the symptom, root cause, fix, and reusable prevention rule in `.agent/lessons_learnt.md`.
- Do not add hypothetical lessons or claim checks that were not performed.

## Autonomy

- For minor ambiguities, state the assumption and proceed so that development maintains velocity.
- Halt and request user clarification only when an ambiguity fundamentally changes the architecture or core product logic.
- Keep assumptions reversible and document material assumptions in the relevant feature documentation.

## Code quality

- Write clean, modular code with clear boundaries between UI, API, deterministic logic, rules, persistence, and AI explanation.
- Add comments only when they explain complex business logic, a non-obvious constraint, or a safety boundary. Do not comment self-evident syntax.
- Add focused automated tests for financial calculations, scenario calculations, and scheme-rule evaluation.
- Keep AI out of financial calculations and scheme-eligibility decisions. AI may explain deterministic outputs using curated official sources.

## Documentation

- After a significant session or completed feature, create or update a concise file under `documentation/` covering scope, decisions, interfaces, tests performed, limitations, and follow-up work.
- Update setup instructions whenever commands, dependencies, environment variables, or package layout change.
- Never put secrets, personal information, real user financial data, or private source materials into logs or documentation.
