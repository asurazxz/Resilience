# Supabase

Supabase provides the team's managed PostgreSQL integration database. The application must access it through FastAPI using the backend `DATABASE_URL`; React must not receive database credentials or a service-role key.

## Directory responsibilities

- `migrations/` contains ordered, reviewable SQL migrations and is the source of truth for schema changes.
- `tests/` contains database-level checks for constraints, permissions, and any Row Level Security policies introduced later.

Use synthetic data only. Do not commit project credentials, database dumps, or real financial information. Supabase Auth, Storage, Realtime, and Edge Functions are deferred unless a core prototype feature explicitly requires them.
