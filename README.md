**AI AGENTS: Before inspecting, planning, editing, or running anything in this repository, read [`.agent/RULES.md`](.agent/RULES.md) and follow it.**

# Resilience

Resilience is a mobile-first progressive web application for Singapore platform workers whose earnings change from week to week. It turns earnings, work costs, essential expenses, and existing savings into a transparent financial-resilience plan: understand actual income, set a flexible savings target, find potentially relevant government support, and prepare for financial shocks.

This repository contains Team Zephyrries' prototype for the Singapore Management University Ellipsis Tech Series 2026 Hackathon. The current `main` branch is the collaboration scaffold; product code will be developed on the five workstream branches below.

> Resilience provides estimates and navigation, not financial advice. Scheme eligibility is determined by maintained rules and confirmed only by the relevant agency. AI may explain results, but it must never calculate finances or decide eligibility.

## Prototype scope

The one-week prototype follows this user journey:

1. Record weekly platform earnings, work costs, essential expenses, and current emergency savings.
2. See estimated net work income, available surplus, and recent income variation.
3. Build an adjustable emergency fund and track its essential-expense coverage.
4. Answer a short questionnaire to find potentially relevant support schemes and official application links.
5. Simulate an income interruption or unexpected cost and see estimated cash-flow and buffer impact.

Manual entry is the primary input path. CSV import and template-based OCR are stretch integrations and must not block the core journey.

## Five development areas

Each area is a full-stack vertical slice with its own UI, API integration, deterministic logic or rules, tests, and feature documentation. Shared contracts should be agreed early; avoid making one teammate the permanent integration bottleneck.

| # | Area and branch | Prototype deliverable |
|---|---|---|
| 1 | **Foundation & data intake** — `feature/01-foundation-input` | Responsive PWA shell, navigation and onboarding; editable manual-entry flows; shared TypeScript/API contracts; PostgreSQL schema and migrations for user-approved entries, goals, scenarios, and rule versions. CSV/OCR review flow is stretch scope. |
| 2 | **Income Reality Engine** — `feature/02-income-reality` | Tested Python calculations for net weekly work income and available surplus; FastAPI endpoints; transparent breakdown and week-to-week trend UI; editable assumptions. |
| 3 | **Emergency Fund** — `feature/03-resilience-jar` | Tested, adjustable weekly/monthly contribution recommendation; emergency-fund goal and ledger APIs; progress in days/weeks of essential expenses; pause/edit controls and fund visualisation. The app tracks money but never holds or transfers it. |
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
- **Database:** Supabase-managed PostgreSQL for shared integration and demo data, accessed through FastAPI using a standard `DATABASE_URL`. Local PostgreSQL remains supported for isolated development.
- **Data intake:** manual entry first; CSV import and Tesseract OCR with per-platform templates as optional prototype enhancements.
- **Source control:** Git and GitHub.
- **Future deployment:** containerised hosting is part of the architecture, but is out of scope for the initial feature sprint.

## Repository structure

```text
frontend/       React and TypeScript PWA, organised by product feature
backend/        FastAPI application, deterministic engines, and external integrations
supabase/       Version-controlled PostgreSQL migrations and database tests
contracts/      Shared API schemas, OpenAPI artifacts, and synthetic fixtures
documentation/  Architecture, feature decisions, validation, and handoff notes
```

Frontend and backend feature folders use the same five workstream boundaries so each teammate can build a vertical slice without repeatedly editing shared files. See [`documentation/codebase-structure.md`](documentation/codebase-structure.md) for the complete directory map and ownership rules.

## Local setup

The Emergency Fund frontend is runnable as a local React and Vite demo using synthetic data. The shared FastAPI application and database integration are still pending Workstream 1. Existing `/resilience-jar` paths remain unchanged for compatibility.

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
- Access to the team's Supabase project, or local PostgreSQL for isolated development
- Supabase CLI only when creating, applying, or testing database migrations locally
- Tesseract only if working on the optional OCR path

### 4. Install and run the frontend

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173/resilience-jar` in a browser. Run `npm test` for the feature tests and `npm run build` for a production compilation check.

### 5. Configure future backend integration

Copy the package-specific example environment files rather than sharing secrets:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

On PowerShell, use `Copy-Item` instead of `cp`. The provisional backend workflow is:

```bash
# Backend package (from the repository root in a separate terminal)
python -m venv .venv
# Activate .venv using the command for your shell
python -m pip install -r backend/requirements.txt
fastapi dev backend/app/main.py
```

Do not commit `.env`, credentials, user uploads, OCR output, local databases, or real financial data. The current local frontend intentionally uses a synthetic in-memory adapter and does not need backend credentials.

## Team workflow

1. Branch from the latest `main` using `feature/0N-short-name` for the five primary workstreams and `fix/short-name` for focused corrections.
2. Agree shared request/response schemas before implementing dependent UI and API work.
3. Keep commits small and use clear conventional prefixes such as `feat:`, `fix:`, `test:`, `docs:`, and `chore:`.
4. Add automated tests for deterministic calculations and rule evaluation. Mock the LLM in automated tests.
5. Rebase or merge the latest `main` before opening a pull request; do not commit directly to `main`.
6. Update `documentation/` after every significant feature and follow the session-memory requirements in [`.agent/RULES.md`](.agent/RULES.md).

## Repository guidance

- [`documentation/initial-scaffold.md`](documentation/initial-scaffold.md) — workstream boundaries, acceptance checks, contracts, and integration order.
- [`documentation/codebase-structure.md`](documentation/codebase-structure.md) — directory ownership, dependency boundaries, and placement rules.
- [`.agent/RULES.md`](.agent/RULES.md) — mandatory operating rules for coding agents.
- [`.agent/session_log.md`](.agent/session_log.md) — concise record of significant agent sessions.
- [`.agent/lessons_learnt.md`](.agent/lessons_learnt.md) — durable lessons from errors that were actually encountered and resolved.

The source materials in `context/` are intentionally excluded from Git because they contain personal information. Team members receive them privately and may unzip them into the repository root; Git will keep the resulting local `context/` directory untracked.

## License

No open-source license has been selected. All rights are reserved until the team adds a license file.
