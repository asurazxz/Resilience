# Supabase

Supabase provides the team's managed PostgreSQL integration database. The application must access it through FastAPI using the backend `DATABASE_URL`; React must not receive database credentials or a service-role key.

## Directory responsibilities

- `migrations/` contains ordered, reviewable SQL migrations and is the source of truth for schema changes.
- `tests/` contains database-level checks for constraints, permissions, and Row Level Security posture.

Use synthetic data only. Do not commit project credentials, database dumps, or real financial information. The prototype uses private PostgreSQL behind FastAPI; Supabase Auth, Storage, Realtime, and Edge Functions remain out of scope.

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

## Applying migrations locally

`npm run db:reset` rebuilds the local database from every migration and is the safe default. To apply only the migrations that have not run yet, without dropping data:

```powershell
npx supabase migration up --local
```

`npx supabase db push --local` is the equivalent for a linked project's local shadow. Both read the same ordered files in `migrations/`.

## What is persisted

The application persists Foundation Input and Income Reality source data, the Emergency Fund (`profiles.latest_emergency_savings_cents` as the opening balance, `emergency_fund_plans`, `emergency_fund_contributions`), the ad-hoc `transactions` ledger, and Savings Goals (`goals` with `goal_type = 'savings'`, plus `goal_contributions`). Scenario Simulator requests and Scheme Navigator answers remain stateless.

`documentation/features/emergency-fund-model.md` defines how the emergency-fund and savings-goal figures are derived from these tables. The two ledgers never write to each other.
