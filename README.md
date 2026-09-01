**AI AGENTS: Before inspecting, planning, editing, or running anything in this repository, read [`.agent/RULES.md`](.agent/RULES.md) and follow it.**

# Resilience

Resilience is a mobile-first progressive web application for Singapore platform workers whose earnings change from week to week. It turns earnings, work costs, essential expenses, and existing savings into a transparent financial-resilience plan: understand actual income, set a flexible savings target, find potentially relevant government support, and prepare for financial shocks.

This repository contains Team Zephyrries' prototype for the Singapore Management University Ellipsis Tech Series 2026 Hackathon. Feature 1 now provides the runnable PWA, API, database baseline, generated contracts, and local developer workflow used by the other workstreams.

> Resilience provides estimates and navigation, not financial advice. Scheme eligibility is determined by maintained rules and confirmed only by the relevant agency. AI may explain results, but it must never calculate finances or decide eligibility.

## Prototype scope

The one-week prototype follows this user journey:

1. Record weekly platform earnings, work costs, essential expenses, and current emergency savings.
2. See estimated net work income, available surplus, and recent income variation.
3. Set an adjustable savings target and track progress in the Resilience Jar.
4. Answer a short questionnaire to find potentially relevant support schemes and official application links.
5. Simulate an income interruption or unexpected cost and see estimated cash-flow and buffer impact.

Manual entry is the primary input path. A strict, review-before-save CSV import is included; OCR remains deferred and must not block the core journey.

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

- **Client:** Node.js 24, React 19, TypeScript 5.9, Vite 8, Tailwind CSS 4, Dexie-backed offline queueing, and PWA service-worker support.
- **API:** Python 3.12 or 3.13, FastAPI, Pydantic, SQLAlchemy, and psycopg.
- **Financial logic:** deterministic Python functions with automated tests; AI is excluded from all calculations.
- **Scheme logic:** versioned structured rules stored as JSON or PostgreSQL records, including official source, effective date, and last-reviewed date.
- **AI explanation:** an LLM API with retrieval over curated official documents; explanation and navigation only, with safety guardrails.
- **Database:** Supabase-managed PostgreSQL for shared integration and demo data, accessed through FastAPI using a standard `DATABASE_URL`. Local PostgreSQL remains supported for isolated development.
- **Data intake:** manual entry plus strict CSV preview/import. OCR is deferred.
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

All commands below are verified on Windows with Node.js 24.13, npm 11.6, Python 3.13, Docker Desktop 29.1, and the repository-pinned Supabase CLI 2.116.0. Python 3.12 is also supported. macOS/Linux users can use the equivalent activation and copy commands.

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

### 3. Install prerequisites

- Git
- Node.js 24.x and npm 11+
- Python 3.12 or 3.13 (do not use Python 3.14 for this pinned dependency set)
- Docker Desktop (for local Supabase)
- Access to the shared Supabase project only when working against the hosted integration database

The Supabase CLI is installed by `npm install`; do not install a different global version.

### 4. Install and configure

From the repository root:

```powershell
npm install
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
Copy-Item frontend\.env.example frontend\.env
Copy-Item backend\.env.example backend\.env
```

The committed examples work unchanged with local Supabase. Never commit either real `.env` file.

If your machine has only Python 3.12, replace `-3.13` with `-3.12`. If an existing `.venv` was created with Python 3.14, leave it alone and create a compatible replacement such as `.venv313` with `py -3.13 -m venv .venv313`, then use that directory in the API commands. The currently pinned `psycopg-binary`, `pydantic-core`, and Uvicorn optional dependencies do not provide compatible wheels for the local Python 3.14/MINGW environment used during Feature 1 verification.

### 5. Start the local stack

```powershell
npm run db:start
npm run db:reset
```

Run the API and client in separate terminals from the repository root:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8000
npm run dev:frontend
```

Open `http://localhost:5173`. The API documentation is at `http://localhost:8000/docs`; Supabase Studio is at `http://127.0.0.1:54323`.

To stop the local stack, press `Ctrl+C` in the API and frontend terminals, then run `npm run db:stop` when you no longer need the database containers.

### 6. Verify changes

```powershell
npm run test:frontend
npm run build:frontend
.\.venv\Scripts\python.exe -m pytest backend\tests -q
.\.venv\Scripts\python.exe -m ruff check backend
npm run db:test
npm run db:lint
```

After changing FastAPI schemas, regenerate the shared contract before committing:

```powershell
.\.venv\Scripts\python.exe -m backend.scripts.export_openapi
npm run generate:api
```

Do not commit `.env`, credentials, user uploads, local databases, or real financial data. See [`documentation/features/foundation-input.md`](documentation/features/foundation-input.md) for the complete contract and teammate handoff.

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
