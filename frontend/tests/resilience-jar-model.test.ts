import assert from "node:assert/strict";
import test from "node:test";

import {
  addDaysToIsoDate,
  buildBalanceTimeline,
  centsToDollars,
  dollarsToCents,
  monthlyTargetToWeeklyCents,
  recommendationExplanation,
  singaporeToday,
  visualFillPercent,
  weeklyToMonthlyCents,
  weeklyTargetToMonthlyCents,
} from "../src/features/resilience-jar/model.ts";
import type { Contribution } from "../src/features/resilience-jar/types.ts";

test("money input converts to integer cents without floating-point arithmetic", () => {
  assert.equal(dollarsToCents("12"), 1_200);
  assert.equal(dollarsToCents("12.3"), 1_230);
  assert.equal(dollarsToCents("12.34"), 1_234);
  assert.equal(dollarsToCents("12.345"), null);
  assert.equal(dollarsToCents("-1"), null);
  assert.equal(centsToDollars(1_234), "12.34");
});

test("visual fill is capped while the API percentage remains uncapped", () => {
  assert.equal(visualFillPercent(null), 0);
  assert.equal(visualFillPercent(-5), 0);
  assert.equal(visualFillPercent(45.5), 45.5);
  assert.equal(visualFillPercent(125), 100);
});

test("recommendation methods have transparent explanations", () => {
  assert.match(recommendationExplanation("latest_week"), /latest completed week/);
  assert.match(
    recommendationExplanation("conservative_4_week"),
    /median positive surplus/,
  );
});

test("contribution dates use the Singapore calendar day", () => {
  const lateUtcMonday = new Date("2026-08-31T17:30:00.000Z");
  assert.equal(singaporeToday(lateUtcMonday), "2026-09-01");
});

test("weekly expenses convert to an approximate monthly amount", () => {
  assert.equal(weeklyToMonthlyCents(70_000), 303_333);
});

test("weekly and monthly targets convert through a weekly canonical amount", () => {
  assert.equal(weeklyTargetToMonthlyCents(9_000), 39_000);
  assert.equal(monthlyTargetToWeeklyCents(39_000), 9_000);
  assert.equal(monthlyTargetToWeeklyCents(10_001), 2_307);
});

test("projection dates add whole calendar days without timezone drift", () => {
  assert.equal(addDaysToIsoDate("2026-09-02", 7), "2026-09-09");
  assert.equal(addDaysToIsoDate("2026-12-30", 7), "2027-01-06");
});

test("balance timeline rises for deposits and falls for withdrawals", () => {
  const entry = (
    id: string,
    entryType: Contribution["entry_type"],
    amountCents: number,
    date: string,
  ): Contribution => ({
    id,
    entry_type: entryType,
    amount_cents: amountCents,
    contribution_date: date,
    note: null,
    created_at: `${date}T00:00:00Z`,
    updated_at: `${date}T00:00:00Z`,
  });

  assert.deepEqual(
    buildBalanceTimeline([
      entry("3", "withdrawal", 2_500, "2026-09-01"),
      entry("1", "deposit", 5_000, "2026-08-18"),
      entry("2", "deposit", 10_000, "2026-08-25"),
      entry("4", "deposit", 1_000, "2026-09-01"),
    ]),
    [
      {
        date: "2026-08-18",
        balance_cents: 5_000,
        contribution_cents: 5_000,
        withdrawal_cents: 0,
      },
      {
        date: "2026-08-25",
        balance_cents: 15_000,
        contribution_cents: 10_000,
        withdrawal_cents: 0,
      },
      {
        date: "2026-09-01",
        balance_cents: 13_500,
        contribution_cents: 1_000,
        withdrawal_cents: 2_500,
      },
    ],
  );
});
