/**
 * Savings Goals transport types.
 *
 * These payloads are camelCase, matching the Foundation routes rather than the
 * snake_case emergency-fund routes. Every monetary value is integer cents in
 * SGD; every date is `YYYY-MM-DD` in the Singapore calendar.
 */

export type SavingsGoalStatus = "active" | "completed" | "archived";

export interface SavingsContribution {
  id: string;
  amountCents: number;
  contributedOn: string;
  note: string | null;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetCents: number;
  targetDate: string | null;
  status: SavingsGoalStatus;
  /** Sum of this goal's contributions. */
  savedCents: number;
  /** max(target − saved, 0). */
  remainingCents: number;
  reached: boolean;
  /** What to put aside each week to land on the target date, when one is set. */
  suggestedWeeklyCents: number | null;
  contributions: SavingsContribution[];
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoalList {
  goals: SavingsGoal[];
}

export interface SavingsGoalCreate {
  name: string;
  targetCents: number;
  targetDate?: string | null;
}

export interface SavingsGoalPatch {
  name?: string;
  targetCents?: number;
  targetDate?: string | null;
  status?: SavingsGoalStatus;
}

export interface SavingsContributionCreate {
  amountCents: number;
  contributedOn: string;
  note?: string | null;
}
