/**
 * Turns the user's own Foundation records into a Scenario Simulator baseline.
 *
 * The simulator asks for "a normal week". Irregular work has no normal week, so
 * the two variable figures are averaged over the last four Monday-Sunday weeks
 * of recorded activity, and the two fixed figures are the weekly-normalised
 * standing costs the user has already entered. Weeks inside that window with no
 * activity still count, so a quiet week pulls the average down rather than
 * disappearing.
 *
 * The window is anchored on the most recent transaction rather than on today,
 * so the function is pure and a user who records in bursts still gets a
 * baseline built from real weeks.
 */

import { transactionDailyAmounts, weeklyNormalisedTotal } from "../income-reality/foundationAdapter";
import type {
  EssentialExpense,
  RecurringWorkCost,
  Transaction,
} from "../../types/foundation";
import type { BaselineFinancesPayload } from "./types";

/** How many Monday-Sunday weeks the variable averages look back over. */
export const BASELINE_WINDOW_WEEKS = 4;

export interface FoundationBaselineInput {
  transactions: Transaction[];
  recurringWorkCosts: RecurringWorkCost[];
  essentialExpenses: EssentialExpense[];
  /** profile.emergencyFundBalanceCents — opening balance + deposits − withdrawals. */
  emergencyFundBalanceCents: number;
}

/** The Monday of the ISO week containing `isoDate`, as `YYYY-MM-DD`. */
export function mondayOf(isoDate: string): string {
  const occurred = new Date(`${isoDate}T00:00:00Z`);
  const monday = new Date(occurred);
  monday.setUTCDate(occurred.getUTCDate() - ((occurred.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

function shiftDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Returns null when the user has recorded no transactions at all, which is the
 * caller's signal to fall back to example figures and say so.
 */
export function buildFoundationBaseline(
  input: FoundationBaselineInput,
): BaselineFinancesPayload | null {
  const { transactions } = input;
  if (transactions.length === 0) return null;

  const latestDate = transactions.reduce(
    (latest, transaction) =>
      (transaction.occurredUntil ?? transaction.occurredOn) > latest
        ? (transaction.occurredUntil ?? transaction.occurredOn) : latest,
    transactions[0].occurredOn,
  );
  const windowEndMonday = mondayOf(latestDate);
  const windowStartMonday = shiftDays(
    windowEndMonday,
    -7 * (BASELINE_WINDOW_WEEKS - 1),
  );
  const windowEndSunday = shiftDays(windowEndMonday, 6);

  let incomeCents = 0;
  let variableCostCents = 0;
  for (const transaction of transactions) {
    for (const daily of transactionDailyAmounts(transaction)) {
      if (daily.date < windowStartMonday || daily.date > windowEndSunday) continue;
      if (transaction.entryType === "income") incomeCents += daily.amountCents;
      else variableCostCents += daily.amountCents;
    }
  }

  return {
    weekly_gross_earnings_cents: Math.round(incomeCents / BASELINE_WINDOW_WEEKS),
    weekly_variable_work_costs_cents: Math.round(
      variableCostCents / BASELINE_WINDOW_WEEKS,
    ),
    weekly_fixed_work_costs_cents: weeklyNormalisedTotal(input.recurringWorkCosts),
    weekly_essential_expenses_cents: weeklyNormalisedTotal(input.essentialExpenses),
    emergency_savings_cents: input.emergencyFundBalanceCents,
  };
}
