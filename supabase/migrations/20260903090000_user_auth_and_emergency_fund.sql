-- User-owned emergency-fund state.  FastAPI always filters by the verified
-- Supabase Auth subject; RLS is defence in depth for any future direct access.
create table resilience.emergency_fund_plans (
  user_id uuid primary key references resilience.profiles(id) on delete cascade,
  recommendation_method text not null default 'conservative_4_week' check (recommendation_method in ('conservative_4_week', 'latest_week')),
  target_frequency text not null default 'weekly' check (target_frequency in ('weekly', 'monthly')),
  target_amount_cents bigint not null default 0 check (target_amount_cents >= 0),
  weekly_target_cents bigint not null default 0 check (weekly_target_cents >= 0),
  status text not null default 'active' check (status in ('active', 'paused')),
  goal_mode text not null default 'coverage' check (goal_mode in ('amount', 'coverage')),
  goal_amount_cents bigint check (goal_amount_cents > 0),
  goal_weeks integer check (goal_weeks between 1 and 52),
  goal_expense_baseline_cents bigint check (goal_expense_baseline_cents > 0),
  updated_at timestamptz not null default now(),
  check ((goal_mode = 'amount' and goal_amount_cents is not null and goal_weeks is null) or
         (goal_mode = 'coverage' and goal_weeks is not null and goal_amount_cents is null))
);

create table resilience.emergency_fund_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references resilience.profiles(id) on delete cascade,
  entry_type text not null check (entry_type in ('deposit', 'withdrawal')),
  amount_cents bigint not null check (amount_cents > 0),
  contribution_date date not null check (contribution_date <= current_date),
  note text check (note is null or char_length(trim(note)) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index emergency_fund_contributions_user_date_idx on resilience.emergency_fund_contributions (user_id, contribution_date desc, created_at desc);
create trigger emergency_fund_plans_set_updated_at before update on resilience.emergency_fund_plans for each row execute function resilience.set_updated_at();
create trigger emergency_fund_contributions_set_updated_at before update on resilience.emergency_fund_contributions for each row execute function resilience.set_updated_at();
alter table resilience.emergency_fund_plans enable row level security;
alter table resilience.emergency_fund_contributions enable row level security;
