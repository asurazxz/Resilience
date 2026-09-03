alter table resilience.transactions
  add column if not exists occurred_until date;

alter table resilience.transactions
  drop constraint if exists transactions_occurred_until_valid;

alter table resilience.transactions
  add constraint transactions_occurred_until_valid
  check (occurred_until is null or occurred_until >= occurred_on);
