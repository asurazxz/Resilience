# Initial Prototype Scaffold (historical)

**Date:** 2026-09-01. Superseded by [`codebase-structure.md`](codebase-structure.md) and the feature documents, which describe the current implementation. Kept only for the original product boundary and the two non-negotiable safety rules.

What changed since this plan: CSV import was built and then retired, and OCR was never built — manual entry via the transaction ledger is the only input path. "Habit Builder & Resilience Jar" became two features, Emergency Fund and Savings Goals. A deterministic Financial Score, Supabase authentication and a landing page were added. The Scenario Simulator is presented to users as the Setback planner. The five-branch convention (`feature/0N-short-name`) is finished; work now branches from `dev`.

## Product boundary

Resilience is a mobile-first PWA for Singapore platform workers with irregular weekly earnings, connecting four outcomes: understand net work income, choose a flexible savings target, find potentially relevant support, and prepare for a financial shock.

Two non-negotiable safety boundaries, unchanged since this plan and still enforced:

- Financial and scenario outputs come from deterministic, tested Python logic.
- Scheme matching comes from versioned structured rules. An LLM may explain existing outputs using curated official material; it may not calculate finances or decide eligibility.

## Shared conventions carried forward

- Monetary values use integer cents at every boundary.
- Dates use ISO 8601 strings; weeks start on Monday.
- API errors share one response shape with a stable machine-readable code and a user-safe message.
- Financial functions and rule evaluators are framework-independent and unit-tested without FastAPI or PostgreSQL.
- AI responses explain only provided deterministic results and curated sources; failures degrade to a non-AI explanation rather than blocking the core flow.
