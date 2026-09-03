-- Savings goals: named, user-owned habit goals that sit beside the emergency
-- fund. They never touch profiles.latest_emergency_savings_cents or
-- resilience.emergency_fund_contributions. See
-- documentation/features/emergency-fund-model.md section 7.

alter table resilience.goals
  add column name text not null default '',
  add column target_date date;
alter table resilience.goals
  alter column name drop default;
update resilience.goals set name = 'Savings goal' where char_length(trim(name)) = 0;
alter table resilience.goals
  add constraint goals_name_length check (char_length(trim(name)) between 1 and 80);

-- goal_contributions gains its own owner so a contribution can be authorised
-- without joining through the goal on every read.
alter table resilience.goal_contributions
  add column user_id uuid not null references resilience.profiles(id) on delete cascade,
  add column note text check (note is null or char_length(trim(note)) <= 200),
  add column updated_at timestamptz not null default now();

create index goal_contributions_user_date_idx
  on resilience.goal_contributions (user_id, contributed_on desc);

create trigger goal_contributions_set_updated_at
before update on resilience.goal_contributions
for each row execute function resilience.set_updated_at();
