# Shared Contracts

This directory holds artifacts consumed by more than one package or workstream.

- `openapi/` contains exported or reviewed API specifications once FastAPI endpoints exist.
- `schemas/` contains portable JSON Schema definitions where a contract must be shared outside generated OpenAPI types.
- `fixtures/` contains synthetic, non-sensitive examples that let frontend and backend work proceed independently.

Do not duplicate feature-internal models here. A contract belongs here only when at least two packages or workstreams depend on it. Monetary values crossing an API boundary use integer cents, and dates use ISO 8601 strings.
