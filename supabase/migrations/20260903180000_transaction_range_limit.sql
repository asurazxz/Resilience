alter table resilience.transactions
  drop constraint if exists transactions_occurred_until_range_limit;

alter table resilience.transactions
  add constraint transactions_occurred_until_range_limit
  check (occurred_until is null or occurred_until - occurred_on <= 366);
