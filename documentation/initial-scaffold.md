# Initial Prototype Collaboration Scaffold

**Date:** 2026-09-01

**Scope:** One-week functional prototype; deployment deferred

## Product boundary

Resilience is a mobile-first PWA for Singapore platform workers with irregular weekly earnings. The prototype connects four outcomes in one flow: understand net work income, choose a flexible savings target, find potentially relevant support, and prepare for a financial shock.

The approved architecture establishes two non-negotiable safety boundaries:

- Financial and scenario outputs come from deterministic, tested Python logic.
- Scheme matching comes from versioned structured rules. An LLM may explain existing outputs using curated official material, but it may not calculate finances or decide eligibility.

Manual input is the primary data path. CSV import and Tesseract OCR are optional enhancements after the core journey works.

## Branch convention

The five primary branches use `feature/0N-short-name`, where `0N` preserves the user-journey order in branch listings:

1. `feature/01-foundation-input`
2. `feature/02-income-reality`
3. `feature/03-resilience-jar`
4. `feature/04-scheme-navigator`
5. `feature/05-scenario-simulator`

Use `fix/short-name` for focused corrections and `docs/short-name` for documentation-only changes. Each feature owner should regularly integrate `main` and open a pull request rather than pushing directly to `main`.

## Workstream 1 — Foundation & data intake

**Owns:** PWA shell, responsive navigation, onboarding, editable manual-entry flows, shared frontend API client/types, database foundation, and local developer ergonomics.

**Core deliverable:** A user can enter and edit weekly earnings, recurring/variable work costs, essential expenses, and current emergency savings, then navigate to every feature using persisted demo data.

**Stretch:** CSV import and an OCR confirmation screen. Extracted values must always require user confirmation.

**Acceptance checks:**

- Mobile-first journey works without OCR, CSV, AI, or deployment services.
- Inputs use a shared schema and sensible validation; no real personal or financial data is committed.
- Migrations cover entries, goals, scenarios, and scheme-rule versions needed by the other slices.
- Manual entry and cached views have a clear offline behaviour; online-only actions are labelled.

## Workstream 2 — Income Reality Engine

**Owns:** Net-income and surplus calculations, FastAPI endpoints, transparent breakdown UI, recent-week trend, editable assumptions, and calculation tests.

**Core deliverable:** From gross platform earnings and declared deductions/costs, the user sees estimated weekly net work income, available surplus after essential expenses, and a conservative recent-income range.

**Acceptance checks:**

- Every displayed value can be traced to user inputs and deterministic formulas.
- Tests cover multiple platforms, zero income, costs exceeding earnings, optional CPF deductions, and multiple weeks.
- No LLM call participates in the calculation path.

## Workstream 3 — Habit Builder & Resilience Jar

**Owns:** Flexible recommendation logic, savings goals and contributions, adjustment/pause controls, progress visualisation, APIs, persistence integration, and tests.

**Core deliverable:** The user receives an adjustable weekly savings suggestion based on recent available surplus and sees progress expressed as days or weeks of essential expenses.

**Acceptance checks:**

- A weak week never produces an unsafe or unexplained fixed target.
- Users can edit or pause the recommendation and retain control of every assumption.
- The UI clearly states that Resilience tracks progress but does not hold or transfer money.

## Workstream 4 — Scheme Navigator & AI explainer

**Owns:** Versioned rule schema, deterministic evaluator, questionnaire/results UI, official links, missing-information states, curated retrieval inputs, and explanation integration.

**Core deliverable:** A short questionnaire returns potentially relevant Singapore support schemes with the matched rule facts, missing information, official source, and next steps.

**Acceptance checks:**

- Each rule stores an official source, effective date, and last-reviewed date.
- Rule tests cover matched, unmatched, missing, and boundary values.
- The LLM receives rule outcomes rather than raw authority to decide eligibility, and automated tests mock it.
- Every result is framed as pre-screening and links to official verification/application channels.

## Workstream 5 — Scenario Simulator

**Owns:** Shock-model calculations, FastAPI endpoints, interactive controls, result summaries, preparatory actions, resource links, and tests.

**Core deliverable:** The user adjusts reduced earnings, time away from work, or an unexpected expense and sees estimated weekly cash flow and emergency-buffer runway.

**Acceptance checks:**

- Calculations use the same shared money/time conventions as the Income Reality Engine.
- Tests cover no buffer, zero/negative cash flow, one-off costs, partial income, and recovery.
- Results distinguish estimates from predictions and do not present financial advice.

## Shared integration contracts

Agree these contracts before feature code diverges:

- Monetary values use one documented representation across TypeScript, JSON, Python, and PostgreSQL. Prefer integer cents at boundaries to avoid floating-point drift.
- Dates use ISO 8601 strings; weekly periods have one documented start-day convention.
- API errors share one response shape with a stable machine-readable code and a user-safe message.
- The frontend can run each feature with committed synthetic fixtures while backend endpoints are in progress.
- Financial functions and rule evaluators remain framework-independent so they can be unit-tested without FastAPI or PostgreSQL.
- AI responses can explain only provided deterministic results and retrieved curated sources; failures degrade to a non-AI explanation rather than blocking the core flow.

Workstream 1 owns the first proposal for shared schemas, not unilateral final authority. Any contract change affecting another slice requires the affected owners to agree and update tests/fixtures in the same pull request.

## Suggested integration order

1. Merge repository layout, shared schemas, synthetic fixtures, database migration baseline, and runnable client/API shells.
2. Merge the Income Reality Engine because its outputs feed savings and scenario features.
3. Merge Habit Builder and Scenario Simulator against the agreed income contract; they may proceed in parallel using fixtures.
4. Merge Scheme Navigator and its deterministic rules before enabling the optional AI explanation path.
5. Run one end-to-end demo pass using synthetic data, then spend remaining time only on defects that affect the judging journey.

## Documentation requirement

For each significant feature, add or update a concise document in `documentation/` containing:

- user-visible scope and explicitly deferred work;
- important assumptions and business rules;
- request/response and persistence contracts;
- tests and manual checks actually performed;
- known limitations and the next integration step.

Also append the significant session to `.agent/session_log.md`. Add to `.agent/lessons_learnt.md` only when a real error was resolved.

## Repository hygiene

The `context/` directory is intentionally ignored because the approved proposal and hackathon materials contain personal information. Share those files privately, then unzip them into the repository root when needed; they must remain outside Git history. Keep any transfer ZIP outside the repository. `.agent/` is intentionally tracked so every teammate and coding agent receives the same rules and project memory.
