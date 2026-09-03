import type { Contribution, RecommendationMethod } from "./types.ts";

export function formatMoney(cents: number | null): string {
  if (cents === null) return "Not available";
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(cents / 100);
}

export function dollarsToCents(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [dollars, cents = ""] = normalized.split(".");
  const result = Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
  return Number.isSafeInteger(result) && result <= 100_000_000 ? result : null;
}

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** The recommended baseline buffer: about six months of essential expenses. */
export const DEFAULT_COVERAGE_GOAL_WEEKS = 26;

/**
 * Describes a coverage goal in the two units people think in, e.g.
 * "26 weeks of essentials ≈ 6 months".
 */
export function coverageGoalLabel(weeks: number): string {
  const base = `${weeks} ${weeks === 1 ? "week" : "weeks"} of essentials`;
  const months = Math.round((weeks * 12) / 52);
  if (months < 1) return base;
  return `${base} ≈ ${months} ${months === 1 ? "month" : "months"}`;
}

export function weeklyToMonthlyCents(weeklyCents: number): number {
  return Math.round((weeklyCents * 52) / 12);
}

export function weeklyTargetToMonthlyCents(weeklyCents: number): number {
  return Math.floor((weeklyCents * 52) / 12);
}

export function monthlyTargetToWeeklyCents(monthlyCents: number): number {
  return Math.floor((monthlyCents * 12) / 52);
}

export interface BalanceChartPoint {
  date: string;
  balance_cents: number;
  contribution_cents: number;
  withdrawal_cents: number;
}

export function buildBalanceTimeline(
  entries: Contribution[],
): BalanceChartPoint[] {
  const dailyChanges = new Map<
    string,
    { contribution_cents: number; withdrawal_cents: number }
  >();
  for (const entry of entries) {
    const existing = dailyChanges.get(entry.contribution_date) ?? {
      contribution_cents: 0,
      withdrawal_cents: 0,
    };
    if (entry.entry_type === "deposit") {
      existing.contribution_cents += entry.amount_cents;
    } else {
      existing.withdrawal_cents += entry.amount_cents;
    }
    dailyChanges.set(entry.contribution_date, existing);
  }
  let balance = 0;
  return [...dailyChanges.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, amounts]) => {
      balance += amounts.contribution_cents - amounts.withdrawal_cents;
      return { date, balance_cents: balance, ...amounts };
    });
}

export function recommendationExplanation(method: RecommendationMethod): string {
  if (method === "latest_week") {
    return "20% of your latest completed week's non-negative available surplus.";
  }
  return "20% of the lower of your latest non-negative surplus and the median positive surplus from up to four completed weeks.";
}

export function singaporeToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function addDaysToIsoDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
