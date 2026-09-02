export type RecommendationMethod = "conservative_4_week" | "latest_week";
export type PlanStatus = "active" | "paused";
export type TargetFrequency = "weekly" | "monthly";

export type Goal =
  | { mode: "amount"; amount_cents: number }
  | { mode: "coverage"; weeks: number };

export interface JarPlan {
  recommendation_method: RecommendationMethod;
  target_frequency: TargetFrequency;
  target_amount_cents: number;
  weekly_target_cents: number;
  status: PlanStatus;
  goal: Goal;
  goal_expense_baseline_cents: number | null;
  updated_at: string | null;
}

export interface Recommendation {
  status: "ready" | "insufficient_data";
  method: RecommendationMethod;
  amount_cents: number | null;
  latest_surplus_cents: number | null;
  history_weeks_used: number;
  as_of_week_start: string | null;
  rationale_code: string;
}

export interface JarProgress {
  contribution_total_cents: number;
  goal_target_cents: number | null;
  progress_percent: number | null;
  coverage_days: number | null;
  coverage_weeks: number | null;
}

export interface GoalReview {
  status: "up_to_date" | "expenses_changed" | "unavailable";
  previous_weekly_expenses_cents: number | null;
  current_weekly_expenses_cents: number | null;
  expense_change_cents: number | null;
}

export interface Contribution {
  id: string;
  entry_type: "deposit" | "withdrawal";
  amount_cents: number;
  contribution_date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompletionProjection {
  status: "projected" | "complete" | "paused" | "no_weekly_target" | "unavailable";
  projected_date: string | null;
  weeks_remaining: number | null;
  remaining_cents: number | null;
}

export interface Milestone {
  percentage: 25 | 50 | 75 | 100;
  target_cents: number;
  reached: boolean;
}

export interface JarSummary {
  plan: JarPlan;
  recommendation: Recommendation;
  progress: JarProgress;
  goal_review: GoalReview;
  completion_projection: CompletionProjection;
  milestones: Milestone[];
  weekly_essential_expenses_cents: number | null;
  contributions: Contribution[];
}

export interface ApiErrorBody {
  code: string;
  message: string;
  field_errors: Record<string, string>;
}

export type PlanPatch = Partial<
  Pick<
    JarPlan,
    | "recommendation_method"
    | "target_frequency"
    | "target_amount_cents"
    | "weekly_target_cents"
    | "status"
    | "goal"
  >
>;

export interface ContributionWrite {
  amount_cents: number;
  contribution_date: string;
  note?: string | null;
}
