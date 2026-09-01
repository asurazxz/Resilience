insert into resilience.profiles (
  id, onboarding_completed_at, latest_emergency_savings_cents
) values (
  '00000000-0000-4000-8000-000000000001', now(), 120000
) on conflict (id) do update set
  onboarding_completed_at = excluded.onboarding_completed_at,
  latest_emergency_savings_cents = excluded.latest_emergency_savings_cents;

insert into resilience.recurring_work_costs (id, user_id, category, label, amount_cents, cadence)
values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'vehicle_rental', 'Vehicle rental', 15000, 'weekly'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'insurance', 'Commercial insurance', 12000, 'monthly')
on conflict (id) do nothing;

insert into resilience.essential_expenses (id, user_id, category, label, amount_cents, cadence)
values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'food', 'Food and groceries', 12000, 'weekly'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'housing', 'Household contribution', 80000, 'monthly')
on conflict (id) do nothing;

insert into resilience.weekly_entries (
  id, user_id, week_start, had_no_income, emergency_savings_cents, status
) values (
  '30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '2026-08-31', false, 120000, 'confirmed'
) on conflict (user_id, week_start) do nothing;

insert into resilience.weekly_earnings (id, weekly_entry_id, platform_code, amount_cents)
values ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'grab', 68000)
on conflict (id) do nothing;

insert into resilience.weekly_variable_costs (id, weekly_entry_id, category, label, amount_cents)
values
  ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'fuel', 'Fuel', 9500),
  ('50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'cpf', 'CPF contribution', 8000)
on conflict (id) do nothing;

insert into resilience.weekly_input_snapshots (
  id, weekly_entry_id, source_id, input_kind, category, label, amount_cents, cadence
) values
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'recurring_work_cost', 'vehicle_rental', 'Vehicle rental', 15000, 'weekly'),
  ('60000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'recurring_work_cost', 'insurance', 'Commercial insurance', 12000, 'monthly'),
  ('60000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'essential_expense', 'food', 'Food and groceries', 12000, 'weekly'),
  ('60000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'essential_expense', 'housing', 'Household contribution', 80000, 'monthly')
on conflict (id) do nothing;

insert into resilience.emergency_savings_snapshots (
  id, user_id, source_weekly_entry_id, amount_cents
) values (
  '70000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 120000
) on conflict (source_weekly_entry_id) do nothing;
