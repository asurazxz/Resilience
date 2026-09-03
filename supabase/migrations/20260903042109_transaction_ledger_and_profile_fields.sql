alter table resilience.profiles
  add column if not exists display_name text check (display_name is null or char_length(trim(display_name)) between 1 and 80),
  add column if not exists phone_number text check (phone_number is null or phone_number ~ '^[0-9+() -]{6,30}$'),
  add column if not exists date_of_birth date check (date_of_birth is null or date_of_birth <= current_date);

create table resilience.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references resilience.profiles(id) on delete cascade,
  entry_type text not null check (entry_type in ('income', 'cost')),
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 100000000),
  description text check (description is null or char_length(trim(description)) <= 160),
  occurred_on date not null check (occurred_on <= current_date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index transactions_user_occurred_on_idx on resilience.transactions (user_id, occurred_on desc, created_at desc);
create trigger transactions_set_updated_at before update on resilience.transactions for each row execute function resilience.set_updated_at();
alter table resilience.transactions enable row level security;
