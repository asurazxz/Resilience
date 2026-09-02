import { describe, expect, it } from "vitest";

import type { WeeklyEntry } from "../../types/foundation";
import { adaptFoundationWeeks } from "./foundationAdapter";

function weeklyEntry(overrides: Partial<WeeklyEntry> = {}): WeeklyEntry {
  return {
    id: "30000000-0000-4000-8000-000000000001",
    weekStart: "2026-08-31",
    hadNoIncome: false,
    emergencySavingsCents: 120000,
    status: "confirmed",
    revision: 1,
    earnings: [],
    variableCosts: [],
    inputSnapshots: [],
    ...overrides,
  };
}

describe("Feature 1 to Income Reality adapter", () => {
  it("aggregates platforms and keeps recorded CPF separate from work costs", () => {
    const result = adaptFoundationWeeks([
      weeklyEntry({
        earnings: [
          { id: "1", platformCode: "grab", amountCents: 20000 },
          { id: "2", platformCode: "grab", amountCents: 10000 },
        ],
        variableCosts: [
          { id: "3", category: "fuel", label: "Fuel", amountCents: 1000 },
          { id: "4", category: "cpf", label: "CPF", amountCents: 5000 },
        ],
        inputSnapshots: [
          {
            id: "5",
            inputKind: "recurring_work_cost",
            category: "insurance",
            label: "Insurance",
            amountCents: 5200,
            cadence: "monthly",
          },
          {
            id: "6",
            inputKind: "essential_expense",
            category: "food",
            label: "Food",
            amountCents: 3000,
            cadence: "weekly",
          },
        ],
      }),
    ]);

    expect(result.missingExpenseSnapshotCount).toBe(0);
    expect(result.weeks).toEqual([
      {
        week_start: "2026-08-31",
        platform_earnings: [{ platform: "Grab", gross_cents: 30000 }],
        work_costs_cents: 2200,
        essential_expenses_cents: 3000,
        recorded_cpf_cents: 5000,
      },
    ]);
  });

  it("excludes drafts, orders confirmed weeks oldest first, and reports missing snapshots", () => {
    const result = adaptFoundationWeeks([
      weeklyEntry({ id: "new", weekStart: "2026-08-31" }),
      weeklyEntry({ id: "draft", weekStart: "2026-08-24", status: "draft" }),
      weeklyEntry({
        id: "old",
        weekStart: "2026-08-17",
        inputSnapshots: [
          {
            id: "snapshot",
            inputKind: "essential_expense",
            category: "food",
            label: "Food",
            amountCents: 1000,
            cadence: "weekly",
          },
        ],
      }),
    ]);

    expect(result.weeks.map((week) => week.week_start)).toEqual(["2026-08-17", "2026-08-31"]);
    expect(result.missingExpenseSnapshotCount).toBe(1);
  });
});
