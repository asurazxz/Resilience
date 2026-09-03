# Shared Contracts

This directory holds versioned artifacts consumed by both the frontend and backend.

- `openapi/` contains exported or reviewed API specifications once FastAPI endpoints exist.
- `schemas/` contains portable JSON Schema definitions where a contract must be shared outside generated OpenAPI types.
- `fixtures/` contains synthetic, non-sensitive examples that let frontend and backend work proceed independently.

Do not duplicate feature-internal models here. A contract belongs here only when at least two packages depend on it. Monetary values crossing an API boundary use integer cents, dates use ISO 8601 strings, and week starts are Mondays.

The current shared artifacts cover Foundation bootstrap and input, Income Reality, Emergency Fund summaries, and Setback Planner requests and results.

`openapi/openapi.json` is exported from FastAPI and generates `frontend/src/types/api.generated.ts`. Regenerate both after any backend schema change:

```bash
python -m backend.scripts.export_openapi
npm run generate:api
```

`fixtures/transaction-week-split.json` is load-bearing rather than illustrative: it pins the daily spread of a dated-range transaction, and both `backend/app/features/transaction_spread.py` and `frontend/src/features/income-reality/foundationAdapter.ts` are asserted against it, so the two implementations cannot drift. See [`documentation/features/emergency-fund-model.md`](../documentation/features/emergency-fund-model.md#spreading-a-dated-range-transaction-across-weeks).

`fixtures/foundation-input-template.csv` is a leftover from the retired CSV import path and is no longer read by any code.
