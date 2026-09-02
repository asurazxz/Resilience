**AI AGENTS: Before inspecting, planning, editing, or running anything in this repository, read [`.agent/RULES.md`](.agent/RULES.md) and follow it.**

# Resilience

Resilience is a mobile-first progressive web application for Singapore platform workers whose earnings change from week to week. It turns earnings, work costs, essential expenses, and existing savings into a transparent financial-resilience plan: understand actual income, set a flexible savings target, find potentially relevant government support, and prepare for financial shocks.

This repository contains Team Zephyrries' integrated prototype for the Singapore Management University Ellipsis Tech Series 2026 Hackathon. All five product features now run in one PWA and FastAPI service on the `dev` branch.

> Resilience provides estimates and navigation, not financial advice. Scheme eligibility is determined by maintained rules and confirmed only by the relevant agency. AI may explain results, but it must never calculate finances or decide eligibility.

## Prototype scope
The one-week prototype follows this user journey:

1. Record weekly platform earnings, work costs, essential expenses, and current emergency savings.
2. See estimated net work income, available surplus, and recent income variation.
3. Build an adjustable emergency fund and track its essential-expense coverage.
4. Answer a short questionnaire to find potentially relevant support schemes and official application links.
5. Simulate an income interruption or unexpected cost and see estimated cash-flow and buffer impact.

Manual entry is the primary input path. A strict, review-before-save CSV import is included; OCR remains deferred and must not block the core journey.

## Integrated features

Each area has its own UI, deterministic logic or rules, tests, and feature documentation. The shared React and FastAPI shells compose those slices behind stable routes and contracts.

| # | Feature | Current implementation |
|---|---|---|
| 1 | **Foundation & data intake** | PWA shell, onboarding, manual weekly entries, assumptions, strict CSV preview/import, IndexedDB cache, ordered offline queue, FastAPI persistence, and PostgreSQL migrations. |
| 2 | **Income Reality Engine** | Deterministic net-income and surplus calculations, recent-week trend, recorded-CPF handling, FastAPI endpoint, and transparent UI. |
| 3 | **Emergency Fund** | Adjustable weekly/monthly targets, contribution and withdrawal tracking, expense coverage, projection, and progress visualisation. The current UI uses a browser-local fixture adapter. |
| 4 | **Scheme Navigator & AI explainer** | Deterministic scheme pre-screening, official sources, missing-information states, optional Groq explanations, and a cross-route chatbot with deterministic fallbacks. |
| 5 | **Scenario Simulator** | Deterministic cash-flow and buffer-runway calculations, adjustable shocks and recovery, preparatory actions, API integration, and estimate disclaimers. |

The original ownership boundaries and acceptance checks are preserved as historical context in [`documentation/initial-scaffold.md`](documentation/initial-scaffold.md).

## Technology stack

The stack below reflects the integrated prototype. Deployment remains out of scope.

- **Client:** Node.js 24, React 19, TypeScript 5.9, Vite 8, Tailwind CSS 4, Dexie-backed offline queueing, and PWA service-worker support.
- **API:** Python 3.12 or 3.13, FastAPI, Pydantic, SQLAlchemy, and psycopg.
- **Financial logic:** deterministic Python functions with automated tests; AI is excluded from all calculations.
- **Scheme logic:** versioned structured rules stored as JSON or PostgreSQL records, including official source, effective date, and last-reviewed date.
- **AI explanation:** optional Groq calls grounded with curated official-source summaries; explanation and navigation only, with deterministic fallbacks and safety guardrails.
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

Frontend and backend feature folders mirror the same five product boundaries. See [`documentation/codebase-structure.md`](documentation/codebase-structure.md) for the current directory map and dependency rules.

## Local setup

The development app runs all five features in one React shell. Foundation Input, Income Reality, the Scenario Simulator, and the Scheme Navigator use FastAPI; the Emergency Fund currently uses a browser-local fixture adapter. The Scheme Navigator chatbot is available across all routes.

All commands below are verified on Windows with Node.js 24.13, npm 11.6, Python 3.13, Docker Desktop 29.1, and the repository-pinned Supabase CLI 2.116.0. Python 3.12 is also supported. macOS/Linux users can use the equivalent activation and copy commands.

### 1. Clone and read the agent rules

```bash
git clone <repository-url>
cd Resilience
cat .agent/RULES.md
cat .agent/lessons_learnt.md
```

On PowerShell, use `Get-Content .agent/RULES.md` and `Get-Content .agent/lessons_learnt.md`.

### 2. Install prerequisites

- Git
- Node.js 24.x and npm 11+
- Python 3.12 or 3.13 with virtual-environment support
- Access to the team's Supabase project, or local PostgreSQL for isolated development
- Supabase CLI only when creating, applying, or testing database migrations locally
- Access to the shared Supabase project only when working against the hosted integration database

The Supabase CLI is installed by `npm install`; do not install a different global version.

### 3. Install and configure

From the repository root:

```powershell
npm install
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
Copy-Item frontend\.env.example frontend\.env
Copy-Item backend\.env.example backend\.env
```

The example frontend configuration uses Vite's same-origin `/api` proxy to reach FastAPI on port 8000.

If your machine has only Python 3.12, replace `-3.13` with `-3.12`. If an existing `.venv` was created with Python 3.14, leave it alone and create a compatible replacement such as `.venv313` with `py -3.13 -m venv .venv313`, then use that directory in the API commands. The currently pinned `psycopg-binary`, `pydantic-core`, and Uvicorn optional dependencies do not provide compatible wheels for the local Python 3.14/MINGW environment used during Feature 1 verification.

### 4. Start the local stack

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

### 5. Verify changes

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

Do not commit `.env`, credentials, user uploads, local databases, or real financial data. See [`documentation/features/foundation-input.md`](documentation/features/foundation-input.md) for persistence and environment details.

## Team workflow

1. Branch from the latest `dev` using `feature/short-name`, `fix/short-name`, or `docs/short-name`; merge reviewed work back into `dev`.
2. Agree shared request/response schemas before implementing dependent UI and API work.
3. Keep commits small and use clear conventional prefixes such as `feat:`, `fix:`, `test:`, `docs:`, and `chore:`.
4. Add automated tests for deterministic calculations and rule evaluation. Mock the LLM in automated tests.
5. Rebase or merge the latest `dev` before opening a pull request; do not commit directly to `main`.
6. Update `documentation/` after every significant feature and follow the session-memory requirements in [`.agent/RULES.md`](.agent/RULES.md).

## Repository guidance

- [`documentation/codebase-structure.md`](documentation/codebase-structure.md) — current architecture, dependency boundaries, and placement rules.
- [`documentation/dev2-feature-03-05-integration.md`](documentation/dev2-feature-03-05-integration.md) — post-merge integration and verification record.
- Feature notes: [Foundation Input](documentation/features/foundation-input.md), [Income Reality](documentation/features/income-reality.md), [Emergency Fund](documentation/features/resilience-jar.md), [Scheme Navigator](documentation/features/scheme-navigator.md), and [Scenario Simulator](documentation/features/scenario-simulator.md).
- [`documentation/initial-scaffold.md`](documentation/initial-scaffold.md) — historical sprint plan and original acceptance boundaries.
- [`.agent/RULES.md`](.agent/RULES.md) — mandatory operating rules for coding agents.
- [`.agent/session_log.md`](.agent/session_log.md) — concise record of significant agent sessions.
- [`.agent/lessons_learnt.md`](.agent/lessons_learnt.md) — durable lessons from errors that were actually encountered and resolved.

The source materials in `context/` are intentionally excluded from Git because they contain personal information. Team members receive them privately and may unzip them into the repository root; Git will keep the resulting local `context/` directory untracked.

## License

No open-source license has been selected. All rights are reserved until the team adds a license file.
