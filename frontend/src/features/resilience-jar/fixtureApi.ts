import { writeCachedSummary, type ResilienceJarApi } from "./api.ts";
import {
  addDaysToIsoDate,
  monthlyTargetToWeeklyCents,
  singaporeToday,
  weeklyTargetToMonthlyCents,
} from "./model.ts";
import type {
  Contribution,
  ContributionWrite,
  JarSummary,
  PlanPatch,
  RecommendationMethod,
} from "./types.ts";

const fixtureRecommendationAmounts: Record<RecommendationMethod, number> = {
  conservative_4_week: 9_000,
  latest_week: 9_600,
};

const initialFixture: JarSummary = {
  plan: {
    recommendation_method: "conservative_4_week",
    target_frequency: "weekly",
    target_amount_cents: 9_000,
    weekly_target_cents: 9_000,
    status: "active",
    goal: { mode: "coverage", weeks: 4 },
    goal_expense_baseline_cents: 65_000,
    updated_at: null,
  },
  recommendation: {
    status: "ready",
    method: "conservative_4_week",
    amount_cents: 9_000,
    latest_surplus_cents: 48_000,
    history_weeks_used: 4,
    as_of_week_start: "2026-08-24",
    rationale_code: "four_week_median_capped_by_latest",
  },
  progress: {
    contribution_total_cents: 12_500,
    goal_target_cents: 280_000,
    progress_percent: 4.5,
    coverage_days: 1.3,
    coverage_weeks: 0.2,
  },
  goal_review: {
    status: "expenses_changed",
    previous_weekly_expenses_cents: 65_000,
    current_weekly_expenses_cents: 70_000,
    expense_change_cents: 5_000,
  },
  completion_projection: {
    status: "projected",
    projected_date: "2027-04-20",
    weeks_remaining: 33,
    remaining_cents: 267_500,
  },
  milestones: [
    { percentage: 25, target_cents: 70_000, reached: false },
    { percentage: 50, target_cents: 140_000, reached: false },
    { percentage: 75, target_cents: 210_000, reached: false },
    { percentage: 100, target_cents: 280_000, reached: false },
  ],
  weekly_essential_expenses_cents: 70_000,
  contributions: [
    {
      id: "fixture-withdrawal-1",
      entry_type: "withdrawal",
      amount_cents: 2_500,
      contribution_date: "2026-09-01",
      note: "Urgent transport repair",
      created_at: "2026-09-01T01:00:00Z",
      updated_at: "2026-09-01T01:00:00Z",
    },
    {
      id: "fixture-contribution-2",
      entry_type: "deposit",
      amount_cents: 10_000,
      contribution_date: "2026-08-25",
      note: "Weekly contribution",
      created_at: "2026-08-25T01:00:00Z",
      updated_at: "2026-08-25T01:00:00Z",
    },
    {
      id: "fixture-contribution-1",
      entry_type: "deposit",
      amount_cents: 5_000,
      contribution_date: "2026-08-18",
      note: "First step",
      created_at: "2026-08-18T01:00:00Z",
      updated_at: "2026-08-18T01:00:00Z",
    },
  ],
};

export class FixtureResilienceJarApi implements ResilienceJarApi {
  private summary = clone(initialFixture);

  constructor() {
    this.recalculateProgress();
  }

  async getSummary(): Promise<JarSummary> {
    return this.snapshot();
  }

  async patchPlan(patch: PlanPatch): Promise<JarSummary> {
    const goalWasUpdated = patch.goal !== undefined;
    const targetFrequency =
      patch.target_frequency ?? this.summary.plan.target_frequency;
    let targetAmountCents =
      patch.target_amount_cents ?? this.summary.plan.target_amount_cents;
    let weeklyTargetCents =
      patch.weekly_target_cents ?? this.summary.plan.weekly_target_cents;
    if (patch.target_amount_cents !== undefined) {
      weeklyTargetCents =
        targetFrequency === "monthly"
          ? monthlyTargetToWeeklyCents(patch.target_amount_cents)
          : patch.target_amount_cents;
    } else if (patch.weekly_target_cents !== undefined) {
      targetAmountCents =
        targetFrequency === "monthly"
          ? weeklyTargetToMonthlyCents(patch.weekly_target_cents)
          : patch.weekly_target_cents;
    } else if (patch.target_frequency !== undefined) {
      targetAmountCents =
        targetFrequency === "monthly"
          ? weeklyTargetToMonthlyCents(weeklyTargetCents)
          : weeklyTargetCents;
    }
    this.summary.plan = {
      ...this.summary.plan,
      ...patch,
      target_frequency: targetFrequency,
      target_amount_cents: targetAmountCents,
      weekly_target_cents: weeklyTargetCents,
      goal_expense_baseline_cents: goalWasUpdated
        ? this.summary.weekly_essential_expenses_cents
        : this.summary.plan.goal_expense_baseline_cents,
      updated_at: new Date().toISOString(),
    };
    const method = this.summary.plan.recommendation_method;
    this.summary.recommendation = {
      ...this.summary.recommendation,
      method,
      amount_cents: fixtureRecommendationAmounts[method],
      history_weeks_used: method === "latest_week" ? 1 : 4,
      rationale_code:
        method === "latest_week"
          ? "latest_week_20_percent"
          : "four_week_median_capped_by_latest",
    };
    this.recalculateProgress();
    return this.snapshot();
  }

  async createContribution(payload: ContributionWrite): Promise<Contribution> {
    const now = new Date().toISOString();
    const contribution: Contribution = {
      id: crypto.randomUUID(),
      entry_type: "deposit",
      amount_cents: payload.amount_cents,
      contribution_date: payload.contribution_date,
      note: payload.note?.trim() || null,
      created_at: now,
      updated_at: now,
    };
    this.summary.contributions.unshift(contribution);
    this.recalculateProgress();
    await this.snapshot();
    return clone(contribution);
  }

  async createWithdrawal(payload: ContributionWrite): Promise<Contribution> {
    if (payload.amount_cents > this.summary.progress.contribution_total_cents) {
      throw new Error("Withdrawal cannot exceed the tracked Jar balance.");
    }
    const now = new Date().toISOString();
    const withdrawal: Contribution = {
      id: crypto.randomUUID(),
      entry_type: "withdrawal",
      amount_cents: payload.amount_cents,
      contribution_date: payload.contribution_date,
      note: payload.note?.trim() || null,
      created_at: now,
      updated_at: now,
    };
    this.summary.contributions.unshift(withdrawal);
    this.recalculateProgress();
    await this.snapshot();
    return clone(withdrawal);
  }

  async updateContribution(
    contributionId: string,
    payload: Partial<ContributionWrite>,
  ): Promise<Contribution> {
    const index = this.summary.contributions.findIndex(
      (contribution) => contribution.id === contributionId,
    );
    if (index < 0) throw new Error("Contribution was not found.");
    const existing = this.summary.contributions[index];
    const updated: Contribution = {
      ...existing,
      ...payload,
      note:
        payload.note === undefined ? existing.note : payload.note?.trim() || null,
      updated_at: new Date().toISOString(),
    };
    this.summary.contributions[index] = updated;
    this.recalculateProgress();
    await this.snapshot();
    return clone(updated);
  }

  async deleteContribution(contributionId: string): Promise<void> {
    const entry = this.summary.contributions.find(
      (contribution) => contribution.id === contributionId,
    );
    if (
      entry?.entry_type === "deposit" &&
      this.summary.progress.contribution_total_cents - entry.amount_cents < 0
    ) {
      throw new Error(
        "This deposit cannot be deleted while a withdrawal depends on it.",
      );
    }
    this.summary.contributions = this.summary.contributions.filter(
      (contribution) => contribution.id !== contributionId,
    );
    this.recalculateProgress();
    await this.snapshot();
  }

  async setWeeklyEssentialExpensesCentsForDemo(
    amountCents: number | null,
  ): Promise<JarSummary> {
    this.summary.weekly_essential_expenses_cents = amountCents;
    this.recalculateProgress();
    return this.snapshot();
  }

  private recalculateProgress(): void {
    const total = this.summary.contributions.reduce(
      (sum, contribution) =>
        sum +
        (contribution.entry_type === "deposit"
          ? contribution.amount_cents
          : -contribution.amount_cents),
      0,
    );
    const expenses = this.summary.weekly_essential_expenses_cents;
    const goal = this.summary.plan.goal;
    const goalTarget =
      goal.mode === "amount"
        ? goal.amount_cents
        : expenses === null || expenses <= 0
          ? null
          : expenses * goal.weeks;
    this.summary.progress = {
      contribution_total_cents: total,
      goal_target_cents: goalTarget,
      progress_percent:
        goalTarget === null ? null : oneDecimal((total * 100) / goalTarget),
      coverage_days:
        expenses === null || expenses <= 0
          ? null
          : oneDecimal((total * 7) / expenses),
      coverage_weeks:
        expenses === null || expenses <= 0
          ? null
          : oneDecimal(total / expenses),
    };
    this.recalculateProjectionAndMilestones();
    const baseline = this.summary.plan.goal_expense_baseline_cents;
    if (expenses === null || expenses <= 0 || baseline === null) {
      this.summary.goal_review = {
        status: "unavailable",
        previous_weekly_expenses_cents: baseline,
        current_weekly_expenses_cents: expenses,
        expense_change_cents: null,
      };
    } else {
      const change = expenses - baseline;
      this.summary.goal_review = {
        status: change === 0 ? "up_to_date" : "expenses_changed",
        previous_weekly_expenses_cents: baseline,
        current_weekly_expenses_cents: expenses,
        expense_change_cents: change,
      };
    }
  }

  private recalculateProjectionAndMilestones(): void {
    const goalTarget = this.summary.progress.goal_target_cents;
    const total = this.summary.progress.contribution_total_cents;
    this.summary.milestones = goalTarget
      ? ([25, 50, 75, 100] as const).map((percentage) => {
          const target = Math.ceil((goalTarget * percentage) / 100);
          return { percentage, target_cents: target, reached: total >= target };
        })
      : [];

    if (goalTarget === null) {
      this.summary.completion_projection = {
        status: "unavailable",
        projected_date: null,
        weeks_remaining: null,
        remaining_cents: null,
      };
      return;
    }

    const remaining = Math.max(goalTarget - total, 0);
    if (remaining === 0) {
      this.summary.completion_projection = {
        status: "complete",
        projected_date: singaporeToday(),
        weeks_remaining: 0,
        remaining_cents: 0,
      };
      return;
    }

    if (
      this.summary.plan.status === "paused" ||
      this.summary.plan.weekly_target_cents <= 0
    ) {
      this.summary.completion_projection = {
        status:
          this.summary.plan.status === "paused" ? "paused" : "no_weekly_target",
        projected_date: null,
        weeks_remaining: null,
        remaining_cents: remaining,
      };
      return;
    }

    const weeks = Math.ceil(remaining / this.summary.plan.weekly_target_cents);
    this.summary.completion_projection = {
      status: "projected",
      projected_date: addDaysToIsoDate(singaporeToday(), weeks * 7),
      weeks_remaining: weeks,
      remaining_cents: remaining,
    };
  }

  private async snapshot(): Promise<JarSummary> {
    const snapshot = clone(this.summary);
    writeCachedSummary(snapshot);
    return snapshot;
  }
}

function oneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
