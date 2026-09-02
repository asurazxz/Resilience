import assert from "node:assert/strict";
import test from "node:test";

import { FixtureResilienceJarApi } from "../src/features/resilience-jar/fixtureApi.ts";

test("switching recommendation method does not change the active target", async () => {
  const api = new FixtureResilienceJarApi();
  const initial = await api.getSummary();
  const switched = await api.patchPlan({ recommendation_method: "latest_week" });

  assert.equal(switched.plan.weekly_target_cents, initial.plan.weekly_target_cents);
  assert.equal(switched.recommendation.method, "latest_week");
});

test("monthly target preference preserves its amount and weekly equivalent", async () => {
  const api = new FixtureResilienceJarApi();
  const updated = await api.patchPlan({
    target_frequency: "monthly",
    target_amount_cents: 39_000,
  });

  assert.equal(updated.plan.target_frequency, "monthly");
  assert.equal(updated.plan.target_amount_cents, 39_000);
  assert.equal(updated.plan.weekly_target_cents, 9_000);
});

test("fixture contribution CRUD recalculates contribution-only progress", async () => {
  const api = new FixtureResilienceJarApi();
  const created = await api.createContribution({
    amount_cents: 7_500,
    contribution_date: "2026-09-01",
  });
  await api.updateContribution(created.id, { amount_cents: 10_000 });
  const afterEdit = await api.getSummary();
  await api.deleteContribution(created.id);
  const afterDelete = await api.getSummary();

  assert.equal(afterEdit.progress.contribution_total_cents, 22_500);
  assert.equal(afterDelete.progress.contribution_total_cents, 12_500);
});

test("coverage goal target follows weekly essential expenses", async () => {
  const api = new FixtureResilienceJarApi();
  const summary = await api.patchPlan({ goal: { mode: "coverage", weeks: 6 } });

  assert.equal(summary.progress.goal_target_cents, 420_000);
});

test("expense-change alert clears only when the goal is reviewed and saved", async () => {
  const api = new FixtureResilienceJarApi();
  const initial = await api.getSummary();
  const unrelatedUpdate = await api.patchPlan({ weekly_target_cents: 10_000 });
  const reviewed = await api.patchPlan({ goal: { mode: "coverage", weeks: 4 } });

  assert.equal(initial.goal_review.status, "expenses_changed");
  assert.equal(unrelatedUpdate.goal_review.status, "expenses_changed");
  assert.equal(reviewed.goal_review.status, "up_to_date");
  assert.equal(reviewed.plan.goal_expense_baseline_cents, 70_000);
});

test("a reviewed goal can hydrate a new demo session without reopening the alert", async () => {
  const firstSession = new FixtureResilienceJarApi();
  const reviewed = await firstSession.patchPlan({
    goal: { mode: "coverage", weeks: 4 },
  });
  const nextSession = new FixtureResilienceJarApi(reviewed);
  const restored = await nextSession.getSummary();

  assert.equal(restored.goal_review.status, "up_to_date");
  assert.equal(restored.progress.goal_target_cents, 280_000);
  assert.equal(restored.plan.goal_expense_baseline_cents, 70_000);
});

test("a later expense update reopens the goal review alert", async () => {
  const api = new FixtureResilienceJarApi();
  await api.patchPlan({ goal: { mode: "amount", amount_cents: 300_000 } });
  const changed = await api.setWeeklyEssentialExpensesCentsForDemo(80_000);

  assert.equal(changed.goal_review.status, "expenses_changed");
  assert.equal(changed.goal_review.expense_change_cents, 10_000);
});

test("withdrawals reduce progress and update the projection", async () => {
  const api = new FixtureResilienceJarApi();
  const initial = await api.getSummary();
  const withdrawal = await api.createWithdrawal({
    amount_cents: 2_500,
    contribution_date: "2026-09-02",
    note: "Emergency repair",
  });
  const updated = await api.getSummary();

  assert.equal(withdrawal.entry_type, "withdrawal");
  assert.equal(updated.progress.contribution_total_cents, 10_000);
  assert.ok(
    (updated.completion_projection.weeks_remaining ?? 0) >=
      (initial.completion_projection.weeks_remaining ?? 0),
  );
});

test("withdrawals cannot exceed the tracked balance", async () => {
  const api = new FixtureResilienceJarApi();

  await assert.rejects(
    () =>
      api.createWithdrawal({
        amount_cents: 12_501,
        contribution_date: "2026-09-02",
      }),
    /cannot exceed/i,
  );
});
