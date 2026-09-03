import { describe, expect, it } from "vitest";

import type {
  EssentialExpense,
  RecurringWorkCost,
  Transaction,
} from "../../types/foundation";
import { buildFoundationBaseline, mondayOf } from "./foundationBaseline";

function income(amountCents: number, occurredOn: string): Transaction {
  return { id: `i-${occurredOn}-${amountCents}`, entryType: "income", amountCents, occurredOn };
}

function cost(amountCents: number, occurredOn: string): Transaction {
  return { id: `c-${occurredOn}-${amountCents}`, entryType: "cost", amountCents, occurredOn };
}

const recurring: RecurringWorkCost[] = [
  { id: "r1", category: "vehicle_rental", label: "Van", amountCents: 20000, cadence: "weekly", isActive: true },
  { id: "r2", category: "insurance", label: "Insurance", amountCents: 5200, cadence: "monthly", isActive: true },
  { id: "r3", category: "other", label: "Cancelled", amountCents: 50000, cadence: "weekly", isActive: false },
];

const essentials: EssentialExpense[] = [
  { id: "e1", category: "housing", label: "Rent", amountCents: 80000, cadence: "monthly", isActive: true },
  { id: "e2", category: "food", label: "Food", amountCents: 12000, cadence: "weekly", isActive: true },
];

describe("scenario simulator baseline from Foundation data", () => {
  it("returns null when nothing has been recorded, so the caller can show example data", () => {
    expect(
      buildFoundationBaseline({
        transactions: [],
        recurringWorkCosts: recurring,
        essentialExpenses: essentials,
        emergencyFundBalanceCents: 105000,
      }),
    ).toBeNull();
  });

  it("averages income and variable costs over the last four Monday-Sunday weeks", () => {
    const baseline = buildFoundationBaseline({
      transactions: [
        // Week of 2026-08-31, the most recent, so the window is 2026-08-10 to 2026-09-06.
        income(40000, "2026-09-02"),
        cost(6000, "2026-09-05"),
        income(20000, "2026-08-24"),
        income(60000, "2026-08-10"),
        cost(2000, "2026-08-12"),
        // Outside the window and therefore ignored.
        income(999999, "2026-08-09"),
      ],
      recurringWorkCosts: recurring,
      essentialExpenses: essentials,
      emergencyFundBalanceCents: 105000,
    });

    expect(baseline).toEqual({
      weekly_gross_earnings_cents: 30000, // (40000 + 20000 + 60000) / 4
      weekly_variable_work_costs_cents: 2000, // (6000 + 2000) / 4
      weekly_fixed_work_costs_cents: 21200, // 20000 + 5200 * 12 / 52
      weekly_essential_expenses_cents: 30462, // 80000 * 12 / 52 + 12000
      emergency_savings_cents: 105000,
    });
  });

  it("counts a silent week inside the window as a zero week", () => {
    const baseline = buildFoundationBaseline({
      transactions: [income(40000, "2026-09-02")],
      recurringWorkCosts: [],
      essentialExpenses: [],
      emergencyFundBalanceCents: 0,
    });

    expect(baseline?.weekly_gross_earnings_cents).toBe(10000);
    expect(baseline?.weekly_variable_work_costs_cents).toBe(0);
    expect(baseline?.weekly_fixed_work_costs_cents).toBe(0);
    expect(baseline?.weekly_essential_expenses_cents).toBe(0);
  });

  it("anchors weeks on Monday", () => {
    expect(mondayOf("2026-09-06")).toBe("2026-08-31"); // A Sunday.
    expect(mondayOf("2026-08-31")).toBe("2026-08-31"); // A Monday.
    expect(mondayOf("2026-09-07")).toBe("2026-09-07");
  });
});
