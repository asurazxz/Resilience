// Mirrors contracts/schemas/income-reality.schema.json - keep the two in
// sync when either changes. Monetary values are integer cents.

export interface PlatformEarning {
  platform: string;
  gross_cents: number;
}

export interface WeeklyEntryIn {
  week_start: string; // ISO 8601 date, Monday of the week
  platform_earnings: PlatformEarning[];
  work_costs_cents: number;
  essential_expenses_cents: number;
  recorded_cpf_cents?: number | null;
}

export interface AssumptionsIn {
  apply_cpf: boolean;
  cpf_rate_bps: number;
}

export interface IncomeRealityRequest {
  weeks: WeeklyEntryIn[];
  assumptions?: AssumptionsIn;
}

export interface WeekBreakdownOut {
  week_start: string;
  gross_earnings_cents: number;
  platform_breakdown: PlatformEarning[];
  work_costs_cents: number;
  cpf_cents: number;
  net_income_cents: number;
  essential_expenses_cents: number;
  surplus_cents: number;
}

export interface TrendSummaryOut {
  weeks_considered: number;
  average_net_income_cents: number;
  min_net_income_cents: number;
  max_net_income_cents: number;
  stdev_net_income_cents: number;
  conservative_weekly_income_cents: number;
}

export interface IncomeRealityResponse {
  weeks: WeekBreakdownOut[];
  trend: TrendSummaryOut;
  assumptions_applied: AssumptionsIn;
}

export const DEFAULT_ASSUMPTIONS: AssumptionsIn = {
  apply_cpf: false,
  cpf_rate_bps: 800,
};
