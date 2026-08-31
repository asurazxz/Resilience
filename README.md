**AI AGENTS: Before inspecting, planning, editing, or running anything in this repository, read [`.agent/RULES.md`](.agent/RULES.md) and follow it.**

# Resilience

Resilience is a mobile-first progressive web application for Singapore platform workers whose earnings change from week to week. It turns earnings, work costs, essential expenses, and existing savings into a transparent financial-resilience plan: understand actual income, set a flexible savings target, find potentially relevant government support, and prepare for financial shocks.

This repository contains Team Zephyrries' prototype for the Singapore Management University Ellipsis Tech Series 2026 Hackathon. The current `main` branch is the collaboration scaffold; product code will be developed on the five workstream branches below.

> Resilience provides estimates and navigation, not financial advice. Scheme eligibility is determined by maintained rules and confirmed only by the relevant agency. AI may explain results, but it must never calculate finances or decide eligibility.

## Prototype scope

The one-week prototype follows this user journey:

1. Record weekly platform earnings, work costs, essential expenses, and current emergency savings.
2. See estimated net work income, available surplus, and recent income variation.
3. Set an adjustable savings target and track progress in the Resilience Jar.
4. Answer a short questionnaire to find potentially relevant support schemes and official application links.
5. Simulate an income interruption or unexpected cost and see estimated cash-flow and buffer impact.

Manual entry is the primary input path. CSV import and template-based OCR are stretch integrations and must not block the core journey.

## Five development areas

Each area is a full-stack vertical slice with its own UI, API integration, deterministic logic or rules, tests, and feature documentation. Shared contracts should be agreed early; avoid making one teammate the permanent integration bottleneck.

| # | Area and branch | Prototype deliverable |
|---|---|---|
| 1 | **Foundation & data intake** — `feature/01-foundation-input` | Responsive PWA shell, navigation and onboarding; editable manual-entry flows; shared TypeScript/API contracts; PostgreSQL schema and migrations for user-approved entries, goals, scenarios, and rule versions. CSV/OCR review flow is stretch scope. |
| 2 | **Income Reality Engine** — `feature/02-income-reality` | Tested Python calculations for net weekly work income and available surplus; FastAPI endpoints; transparent breakdown and week-to-week trend UI; editable assumptions. |
| 3 | **Habit Builder & Resilience Jar** — `feature/03-resilience-jar` | Tested, adjustable weekly savings recommendation; goal and contribution APIs; progress in days/weeks of essential expenses; pause/edit controls and jar visualisation. The app tracks money but never holds or transfers it. |
| 4 | **Scheme Navigator & AI explainer** — `feature/04-scheme-navigator` | Versioned scheme-rule schema and deterministic evaluator; questionnaire and result UI; official sources and missing-information states; grounded plain-language explanation. The LLM must not determine eligibility. |
| 5 | **Scenario Simulator** — `feature/05-scenario-simulator` | Tested cash-flow and buffer-runway calculations; adjustable income reduction, time-off, and unexpected-cost inputs; results UI with preparatory actions, relevant official resources, and clear estimate disclaimers. |

The detailed ownership boundaries, shared contracts, acceptance checks, and merge guidance are in [`documentation/initial-scaffold.md`](documentation/initial-scaffold.md).

## Technology stack

The stack below reflects the approved proposal. Deployment work is intentionally deferred until the product flow is working.

- **Client:** React, TypeScript, Tailwind CSS, Progressive Web App capabilities, responsive mobile-first UI, and offline access for manual entry and cached views.
- **API:** Python and FastAPI.
- **Financial logic:** deterministic Python functions with automated tests; AI is excluded from all calculations.
- **Scheme logic:** versioned structured rules stored as JSON or PostgreSQL records, including official source, effective date, and last-reviewed date.
- **AI explanation:** an LLM API with retrieval over curated official documents; explanation and navigation only, with safety guardrails.
- **Database:** PostgreSQL with data minimisation, restricted access, deletion support, and encryption for sensitive fields.
- **Data intake:** manual entry first; CSV import and Tesseract OCR with per-platform templates as optional prototype enhancements.
- **Source control:** Git and GitHub.
- **Future deployment:** containerised hosting is part of the architecture, but is out of scope for the initial feature sprint.

## Local setup

The repository currently contains the team scaffold, not runnable application packages. The first owner to introduce each app package must keep these commands current and pin the required runtime versions in the repository.

### 1. Clone and read the agent rules

```bash
git clone <repository-url>
cd Resilience
cat .agent/RULES.md
cat .agent/lessons_learnt.md
```

On PowerShell, use `Get-Content .agent/RULES.md` and `Get-Content .agent/lessons_learnt.md`.

### 2. Check out your workstream

```bash
git fetch origin
git switch feature/01-foundation-input
```

Replace the branch name with the branch assigned to you.

### 3. Install the planned local prerequisites

- Git
- Node.js and a Node package manager for the React client
- Python with virtual-environment support for FastAPI and deterministic engines
- PostgreSQL
- Tesseract only if working on the optional OCR path

### 4. Configure and run the apps after their scaffolds land

Copy the committed example environment file rather than sharing secrets. The expected workflow is:

```bash
# Frontend package (path and scripts to be finalised by Workstream 1)
cd frontend
npm install
npm run dev

# Backend package (from the repository root in a separate terminal)
python -m venv .venv
# Activate .venv using the command for your shell
python -m pip install -r backend/requirements.txt
fastapi dev backend/app/main.py
```

Do not commit `.env`, credentials, user uploads, OCR output, local databases, or real financial data. If the eventual package layout or commands differ, update this README in the same pull request that changes them.

## Team workflow

1. Branch from the latest `main` using `feature/0N-short-name` for the five primary workstreams and `fix/short-name` for focused corrections.
2. Agree shared request/response schemas before implementing dependent UI and API work.
3. Keep commits small and use clear conventional prefixes such as `feat:`, `fix:`, `test:`, `docs:`, and `chore:`.
4. Add automated tests for deterministic calculations and rule evaluation. Mock the LLM in automated tests.
5. Rebase or merge the latest `main` before opening a pull request; do not commit directly to `main`.
6. Update `documentation/` after every significant feature and follow the session-memory requirements in [`.agent/RULES.md`](.agent/RULES.md).

## Repository guidance

- [`documentation/initial-scaffold.md`](documentation/initial-scaffold.md) — workstream boundaries, acceptance checks, contracts, and integration order.
- [`.agent/RULES.md`](.agent/RULES.md) — mandatory operating rules for coding agents.
- [`.agent/session_log.md`](.agent/session_log.md) — concise record of significant agent sessions.
- [`.agent/lessons_learnt.md`](.agent/lessons_learnt.md) — durable lessons from errors that were actually encountered and resolved.

The source materials in `context/` are intentionally excluded from Git because they contain personal information. Team members receive them privately and may unzip them into the repository root; Git will keep the resulting local `context/` directory untracked.

## License

No open-source license has been selected. All rights are reserved until the team adds a license file.
