# Supabase

Supabase provides the team's managed PostgreSQL integration database. The application must access it through FastAPI using the backend `DATABASE_URL`; React must not receive database credentials or a service-role key.

## Directory responsibilities

- `migrations/` contains ordered, reviewable SQL migrations and is the source of truth for schema changes.
- `tests/` contains database-level checks for constraints, permissions, and Row Level Security posture.

Use synthetic data only. Do not commit project credentials, database dumps, or real financial information.

Supabase Auth is enabled and is how users sign in; the API verifies the resulting JWTs locally. Everything else — the Data API (PostgREST), Storage, Realtime, Edge Functions and Analytics — is disabled in `config.toml`, because application data reaches the browser only through FastAPI.

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

The local database URL is `postgresql://postgres:postgres@127.0.0.1:54322/postgres`; the backend example adds SQLAlchemy's `+psycopg` driver marker.

`npm run db:status` prints the local credentials the two `.env` files need: `JWT_SECRET` for the backend's `SUPABASE_JWT_SECRET`, and `PUBLISHABLE_KEY` for the client's `VITE_SUPABASE_PUBLISHABLE_KEY`. Local Auth is served at `http://127.0.0.1:54321`. These local values are fixed development defaults, not secrets, but a hosted project's equivalents are and must never be committed.

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

The application persists Foundation Input and Income Reality source data, the Emergency Fund (`profiles.latest_emergency_savings_cents` as the opening balance, `emergency_fund_plans`, `emergency_fund_contributions`), the `transactions` ledger including optional inclusive date ranges, and Savings Goals (`goals` with `goal_type = 'savings'`, plus `goal_contributions`). The Financial Score is derived on each request and stores nothing. Setback Planner requests and Scheme Navigator answers remain stateless.

[`documentation/features/emergency-fund-model.md`](../documentation/features/emergency-fund-model.md) defines how the emergency-fund and savings-goal figures are derived from these tables. The two ledgers never write to each other.

## Migrations

| File | What it adds |
|---|---|
| `20260901141009_foundation_schema.sql` | The `resilience` schema: profiles, assumptions, weekly entries and snapshots, idempotency receipts, and the integration envelopes for goals, scenarios and scheme rule versions |
| `20260903042109_transaction_ledger_and_profile_fields.sql` | The `transactions` ledger and additional profile fields |
| `20260903090000_user_auth_and_emergency_fund.sql` | Per-user ownership against the verified Supabase subject, and the emergency-fund plan and contribution tables |
| `20260903120000_savings_goals.sql` | Savings-goal names, target dates, and user-scoped goal contributions |
| `20260903150000_transaction_date_ranges.sql` | `occurred_until` on a transaction |
| `20260903180000_transaction_range_limit.sql` | A check constraint capping a range at 366 days |
| `20260903210000_emergency_fund_default_six_months.sql` | Backfills coverage plans left on the retired four-week default to 26 weeks |

Apply schema only through committed migrations, never through dashboard edits.
