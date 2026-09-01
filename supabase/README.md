# Supabase

Supabase provides the team's managed PostgreSQL integration database. The application must access it through FastAPI using the backend `DATABASE_URL`; React must not receive database credentials or a service-role key.

## Directory responsibilities

- `migrations/` contains ordered, reviewable SQL migrations and is the source of truth for schema changes.
- `tests/` contains database-level checks for constraints, permissions, and any Row Level Security policies introduced later.

Use synthetic data only. Do not commit project credentials, database dumps, or real financial information. Supabase Auth, Storage, Realtime, and Edge Functions are deferred unless a core prototype feature explicitly requires them.

## Local workflow

The repository pins Supabase CLI 2.116.0. Docker Desktop must be running.

```powershell
npm install
npm run db:start
npm run db:reset
npm run db:test
npm run db:lint
npm run db:status
```

The local database URL is `postgresql://postgres:postgres@127.0.0.1:54322/postgres`; the backend example adds SQLAlchemy's `+psycopg` driver marker. The local Data API, Auth, Storage, Realtime, Edge Runtime, and Analytics are disabled because this slice only needs private PostgreSQL behind FastAPI.

## Shared project workflow

Authenticate locally with `npx supabase login`, then link using the real project reference without committing it:

```powershell
npx supabase link --project-ref <team-project-ref>
npx supabase migration list --linked
npx supabase db push --dry-run
npx supabase db push
```

The team's current hosted project reference is `cxbmqwgqorvjwsoovotd` (project name: `Resilience`). It is an identifier, not a credential; each teammate must still authenticate with their own Supabase account and be granted project membership. Do not share another person's login verification code, access token, or database password.

For the already-linked project, the exact safe status check is:

```powershell
npx supabase migration list --linked
```

Apply schema only through committed migrations. Share `DATABASE_URL` through the team's password manager or hosting secret store, never chat or Git. Each teammate must receive Supabase project membership separately; verification codes and access tokens are individual and must not be shared.
