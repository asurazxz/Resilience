import type {
  EssentialExpense,
  RecurringWorkCost,
  Transaction,
} from "../../types/foundation";
import type { WeeklyEntryIn } from "./types";

export interface AdaptedIncomeRealityWeeks {
  weeks: WeeklyEntryIn[];
  missingExpenseSnapshotCount: number;
}

function weeklyAmount(amountCents: number, cadence: "weekly" | "monthly"): number {
  return cadence === "monthly" ? Math.round((amountCents * 12) / 52) : amountCents;
}

/** Weekly-normalised total of the active rows only. */
export function weeklyNormalisedTotal(
  items: Array<{ amountCents: number; cadence: "weekly" | "monthly"; isActive: boolean }>,
): number {
  return items
    .filter((item) => item.isActive)
    .reduce((total, item) => total + weeklyAmount(item.amountCents, item.cadence), 0);
}

function addDays(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function daysInclusive(start: string, end: string): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1;
}

/** Splits a date-range amount exactly across its calendar days (including cents). */
export function transactionDailyAmounts(transaction: Transaction): Array<{ date: string; amountCents: number }> {
  const start = transaction.occurredOn;
  const end = transaction.occurredUntil && transaction.occurredUntil >= start
    ? transaction.occurredUntil : start;
  const days = daysInclusive(start, end);
  const base = Math.floor(transaction.amountCents / days);
  const remainder = transaction.amountCents % days;
  return Array.from({ length: days }, (_, index) => ({
    date: addDays(start, index), amountCents: base + (index < remainder ? 1 : 0),
  }));
}

/**
 * Group individual ledger items into Monday-to-Sunday actuals for irregular work.
 *
 * Each week carries the same three deductions the backend uses for a weekly
 * surplus: variable cost transactions, weekly-normalised recurring work costs,
 * and weekly-normalised essential expenses. Without the last two the screen
 * would report a larger surplus than every other feature.
 */
export function adaptTransactions(
  transactions: Transaction[],
  recurringWorkCosts: RecurringWorkCost[] = [],
  essentialExpenses: EssentialExpense[] = [],
): AdaptedIncomeRealityWeeks {
  const weeklyRecurringWorkCosts = weeklyNormalisedTotal(recurringWorkCosts);
  const weeklyEssentialExpenses = weeklyNormalisedTotal(essentialExpenses);
  const grouped = new Map<string, { income: number; costs: number }>();
  for (const transaction of transactions) {
    for (const daily of transactionDailyAmounts(transaction)) {
      const occurred = new Date(`${daily.date}T00:00:00Z`);
      const monday = new Date(occurred);
      monday.setUTCDate(occurred.getUTCDate() - ((occurred.getUTCDay() + 6) % 7));
      const weekStart = monday.toISOString().slice(0, 10);
      const totals = grouped.get(weekStart) ?? { income: 0, costs: 0 };
      if (transaction.entryType === "income") totals.income += daily.amountCents;
      else totals.costs += daily.amountCents;
      grouped.set(weekStart, totals);
    }
  }
  return {
    weeks: Array.from(grouped, ([week_start, totals]) => ({
      week_start,
      platform_earnings: totals.income ? [{ platform: "Recorded income", gross_cents: totals.income }] : [],
      work_costs_cents: totals.costs + weeklyRecurringWorkCosts,
      essential_expenses_cents: weeklyEssentialExpenses,
      recorded_cpf_cents: null,
    })).sort((left, right) => left.week_start.localeCompare(right.week_start)),
    missingExpenseSnapshotCount: 0,
  };
}
