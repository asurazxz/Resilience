create schema if not exists resilience;

revoke all on schema resilience from public, anon, authenticated;

create function resilience.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function resilience.set_updated_at() from public, anon, authenticated;

create table resilience.profiles (
  id uuid primary key,
  currency text not null default 'SGD' check (currency = 'SGD'),
  timezone text not null default 'Asia/Singapore' check (timezone = 'Asia/Singapore'),
  onboarding_completed_at timestamptz,
  latest_emergency_savings_cents bigint not null default 0 check (latest_emergency_savings_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table resilience.recurring_work_costs (
  id uuid primary key,
  user_id uuid not null references resilience.profiles(id) on delete cascade,
  category text not null check (category in ('vehicle_rental', 'insurance', 'subscription', 'equipment', 'other')),
  label text not null check (char_length(trim(label)) between 1 and 80),
  amount_cents bigint not null check (amount_cents > 0),
  cadence text not null check (cadence in ('weekly', 'monthly')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table resilience.essential_expenses (
  id uuid primary key,
  user_id uuid not null references resilience.profiles(id) on delete cascade,
  category text not null check (category in ('housing', 'food', 'transport', 'utilities', 'healthcare', 'caregiving', 'debt', 'other')),
  label text not null check (char_length(trim(label)) between 1 and 80),
  amount_cents bigint not null check (amount_cents > 0),
  cadence text not null check (cadence in ('weekly', 'monthly')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table resilience.weekly_entries (
  id uuid primary key,
  user_id uuid not null references resilience.profiles(id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  had_no_income boolean not null default false,
  emergency_savings_cents bigint not null check (emergency_savings_cents >= 0),
  status text not null default 'confirmed' check (status in ('draft', 'confirmed')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table resilience.weekly_earnings (
  id uuid primary key,
  weekly_entry_id uuid not null references resilience.weekly_entries(id) on delete cascade,
  platform_code text not null check (platform_code in ('grab', 'gojek', 'tada', 'deliveroo', 'foodpanda', 'lalamove', 'other')),
  platform_label text check (platform_label is null or char_length(trim(platform_label)) between 1 and 80),
  amount_cents bigint not null check (amount_cents >= 0),
  created_at timestamptz not null default now()
);

create table resilience.weekly_variable_costs (
  id uuid primary key,
  weekly_entry_id uuid not null references resilience.weekly_entries(id) on delete cascade,
  category text not null check (category in ('fuel', 'charging', 'tolls', 'parking', 'repairs', 'platform_fees', 'cpf', 'other')),
  label text not null check (char_length(trim(label)) between 1 and 80),
  amount_cents bigint not null check (amount_cents >= 0),
  created_at timestamptz not null default now()
);

create table resilience.weekly_input_snapshots (
  id uuid primary key,
  weekly_entry_id uuid not null references resilience.weekly_entries(id) on delete cascade,
  source_id uuid,
  input_kind text not null check (input_kind in ('recurring_work_cost', 'essential_expense')),
  category text not null,
  label text not null check (char_length(trim(label)) between 1 and 80),
  amount_cents bigint not null check (amount_cents > 0),
  cadence text not null check (cadence in ('weekly', 'monthly')),
  created_at timestamptz not null default now()
);

create table resilience.emergency_savings_snapshots (
  id uuid primary key,
  user_id uuid not null references resilience.profiles(id) on delete cascade,
  source_weekly_entry_id uuid unique references resilience.weekly_entries(id) on delete cascade,
  amount_cents bigint not null check (amount_cents >= 0),
  recorded_at timestamptz not null default now()
);

create table resilience.idempotency_receipts (
  id bigint generated always as identity primary key,
  user_id uuid not null references resilience.profiles(id) on delete cascade,
  idempotency_key uuid not null,
  request_hash text not null,
  response_status smallint not null check (response_status between 200 and 299),
  response_body jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table resilience.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references resilience.profiles(id) on delete cascade,
  goal_type text not null,
  target_cents bigint not null check (target_cents >= 0),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table resilience.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references resilience.goals(id) on delete cascade,
  amount_cents bigint not null check (amount_cents >= 0),
  contributed_on date not null,
  created_at timestamptz not null default now()
);

create table resilience.scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references resilience.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  scenario_type text not null,
  input_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table resilience.scheme_rule_versions (
  id uuid primary key default gen_random_uuid(),
  scheme_key text not null,
  version integer not null check (version > 0),
  rule_payload jsonb not null,
  official_source_url text not null,
  effective_from date not null,
  effective_to date,
  last_reviewed_at date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (scheme_key, version),
  check (effective_to is null or effective_to >= effective_from)
);

create index recurring_work_costs_user_active_idx on resilience.recurring_work_costs (user_id, is_active);
create index essential_expenses_user_active_idx on resilience.essential_expenses (user_id, is_active);
create index weekly_entries_user_week_idx on resilience.weekly_entries (user_id, week_start desc, id);
create index weekly_earnings_entry_idx on resilience.weekly_earnings (weekly_entry_id);
create index weekly_variable_costs_entry_idx on resilience.weekly_variable_costs (weekly_entry_id);
create index weekly_input_snapshots_entry_idx on resilience.weekly_input_snapshots (weekly_entry_id);
create index emergency_savings_user_recorded_idx on resilience.emergency_savings_snapshots (user_id, recorded_at desc);
create index idempotency_receipts_user_created_idx on resilience.idempotency_receipts (user_id, created_at desc);
create index goals_user_status_idx on resilience.goals (user_id, status);
create index goal_contributions_goal_date_idx on resilience.goal_contributions (goal_id, contributed_on desc);
create index scenarios_user_created_idx on resilience.scenarios (user_id, created_at desc);
create index scheme_rule_versions_active_idx on resilience.scheme_rule_versions (scheme_key, is_active) where is_active;

create trigger profiles_set_updated_at before update on resilience.profiles
for each row execute function resilience.set_updated_at();
create trigger recurring_work_costs_set_updated_at before update on resilience.recurring_work_costs
for each row execute function resilience.set_updated_at();
create trigger essential_expenses_set_updated_at before update on resilience.essential_expenses
for each row execute function resilience.set_updated_at();
create trigger weekly_entries_set_updated_at before update on resilience.weekly_entries
for each row execute function resilience.set_updated_at();
create trigger goals_set_updated_at before update on resilience.goals
for each row execute function resilience.set_updated_at();
create trigger scenarios_set_updated_at before update on resilience.scenarios
for each row execute function resilience.set_updated_at();

alter table resilience.profiles enable row level security;
alter table resilience.recurring_work_costs enable row level security;
alter table resilience.essential_expenses enable row level security;
alter table resilience.weekly_entries enable row level security;
alter table resilience.weekly_earnings enable row level security;
alter table resilience.weekly_variable_costs enable row level security;
alter table resilience.weekly_input_snapshots enable row level security;
alter table resilience.emergency_savings_snapshots enable row level security;
alter table resilience.idempotency_receipts enable row level security;
alter table resilience.goals enable row level security;
alter table resilience.goal_contributions enable row level security;
alter table resilience.scenarios enable row level security;
alter table resilience.scheme_rule_versions enable row level security;

revoke all on all tables in schema resilience from public, anon, authenticated;
revoke all on all sequences in schema resilience from public, anon, authenticated;

comment on schema resilience is 'Private application schema accessed only through FastAPI database connections.';
comment on table resilience.weekly_input_snapshots is 'Preserves the exact recurring and essential inputs used for a historical week.';
