# Backend

This directory will contain the Python and FastAPI service. Product logic is grouped by feature, while cross-cutting infrastructure and external services have explicit boundaries.

## Placement rules

- Put API router composition and health endpoints in `app/api/`; feature endpoints stay inside their feature module and are mounted here.
- Put settings, logging, and application-wide concerns in `app/core/`.
- Put connection management and shared persistence primitives in `app/db/`.
- Put feature routes, schemas, services, and deterministic functions in `app/features/<feature>/`.
- Put LLM and OCR clients in `app/integrations/`; integrations may explain or extract data but must not own financial or eligibility decisions.
- Put fast deterministic tests in `tests/unit/` and tests crossing API/database boundaries in `tests/integration/`.

The initial FastAPI package, dependency manifest, and application entry point are owned by `feature/01-foundation-input`.
