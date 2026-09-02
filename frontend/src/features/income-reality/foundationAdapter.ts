import type { WeeklyEntry } from "../../types/foundation";
import type { PlatformEarning, WeeklyEntryIn } from "./types";

export interface AdaptedIncomeRealityWeeks {
  weeks: WeeklyEntryIn[];
  missingExpenseSnapshotCount: number;
}

function weeklyAmount(amountCents: number, cadence: "weekly" | "monthly"): number {
  return cadence === "monthly" ? Math.round((amountCents * 12) / 52) : amountCents;
}

function platformName(entry: WeeklyEntry["earnings"][number]): string {
  if (entry.platformCode === "other") return entry.platformLabel?.trim() || "Other";
  return entry.platformCode.charAt(0).toUpperCase() + entry.platformCode.slice(1);
}

function aggregatePlatformEarnings(entry: WeeklyEntry): PlatformEarning[] {
  const totals = new Map<string, number>();
  for (const earning of entry.earnings) {
    const platform = platformName(earning);
    totals.set(platform, (totals.get(platform) ?? 0) + earning.amountCents);
  }
  return Array.from(totals, ([platform, gross_cents]) => ({ platform, gross_cents }));
}

export function adaptFoundationWeeks(entries: WeeklyEntry[]): AdaptedIncomeRealityWeeks {
  let missingExpenseSnapshotCount = 0;
  const weeks = entries
    .filter((entry) => entry.status === "confirmed")
    .map((entry): WeeklyEntryIn => {
      const recurringSnapshots = entry.inputSnapshots.filter(
        (snapshot) => snapshot.inputKind === "recurring_work_cost",
      );
      const essentialSnapshots = entry.inputSnapshots.filter(
        (snapshot) => snapshot.inputKind === "essential_expense",
      );
      if (entry.inputSnapshots.length === 0) missingExpenseSnapshotCount += 1;

      const recordedCpfItems = entry.variableCosts.filter((cost) => cost.category === "cpf");
      const variableWorkCosts = entry.variableCosts
        .filter((cost) => cost.category !== "cpf")
        .reduce((total, cost) => total + cost.amountCents, 0);
      const recurringWorkCosts = recurringSnapshots.reduce(
        (total, cost) => total + weeklyAmount(cost.amountCents, cost.cadence),
        0,
      );
      const essentialExpenses = essentialSnapshots.reduce(
        (total, cost) => total + weeklyAmount(cost.amountCents, cost.cadence),
        0,
      );

      return {
        week_start: entry.weekStart,
        platform_earnings: aggregatePlatformEarnings(entry),
        work_costs_cents: variableWorkCosts + recurringWorkCosts,
        essential_expenses_cents: essentialExpenses,
        recorded_cpf_cents:
          recordedCpfItems.length > 0
            ? recordedCpfItems.reduce((total, cost) => total + cost.amountCents, 0)
            : null,
      };
    });
  weeks.sort((left, right) => left.week_start.localeCompare(right.week_start));

  return { weeks, missingExpenseSnapshotCount };
}
