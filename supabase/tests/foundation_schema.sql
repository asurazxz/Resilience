begin;
select plan(13);

select has_schema('resilience', 'private application schema exists');
select has_table('resilience', 'profiles', 'profiles table exists');
select has_table('resilience', 'weekly_entries', 'weekly entries table exists');
select has_table('resilience', 'goals', 'goal integration envelope exists');
select has_table('resilience', 'scenarios', 'scenario integration envelope exists');
select has_table('resilience', 'scheme_rule_versions', 'scheme rule versions exist');
select col_type_is('resilience', 'weekly_entries', 'emergency_savings_cents', 'bigint', 'money uses integer cents');
select has_index('resilience', 'weekly_entries', 'weekly_entries_user_week_idx', 'weekly history lookup is indexed');
select ok(
  (select relrowsecurity from pg_class where oid = 'resilience.weekly_entries'::regclass),
  'row level security is enabled on weekly entries'
);
select ok(
  not has_schema_privilege('anon', 'resilience', 'usage'),
  'anon cannot use the private application schema'
);
select ok(
  not has_table_privilege('authenticated', 'resilience.weekly_entries', 'select'),
  'authenticated Data API role has no direct table access'
);
select row_eq(
  $$ select count(*)::bigint as count from resilience.profiles where id = '00000000-0000-4000-8000-000000000001' $$,
  row(1::bigint),
  'synthetic demo profile is seeded'
);
select throws_ok(
  $$ insert into resilience.weekly_entries (id, user_id, week_start, emergency_savings_cents) values ('ffffffff-ffff-4fff-8fff-ffffffffffff', '00000000-0000-4000-8000-000000000001', '2026-09-01', -1) $$,
  '23514',
  null,
  'negative money is rejected'
);

select * from finish();
rollback;
