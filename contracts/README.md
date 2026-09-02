# Shared Contracts

This directory holds versioned artifacts consumed by both the frontend and backend.

- `openapi/` contains exported or reviewed API specifications once FastAPI endpoints exist.
- `schemas/` contains portable JSON Schema definitions where a contract must be shared outside generated OpenAPI types.
- `fixtures/` contains synthetic, non-sensitive examples that let frontend and backend work proceed independently.

Do not duplicate feature-internal models here. A contract belongs here only when at least two packages depend on it. Monetary values crossing an API boundary use integer cents, dates use ISO 8601 strings, and week starts are Mondays.

The current shared artifacts cover Foundation bootstrap/input, Income Reality, Emergency Fund summaries, and Scenario Simulator requests/results. `openapi/openapi.json` is exported from FastAPI and generates `frontend/src/types/api.generated.ts`; regenerate both after backend schema changes.
