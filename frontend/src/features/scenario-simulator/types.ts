/**
 * Scenario Simulator transport types.
 *
 * Mirrors contracts/schemas/scenario-simulator.schema.json. Every monetary
 * value is integer cents in SGD; every period is a whole number of weeks,
 * where week 1 is the first week of the simulated shock.
 */

export interface BaselineFinancesPayload {
  weekly_gross_earnings_cents: number;
  weekly_variable_work_costs_cents: number;
  weekly_fixed_work_costs_cents: number;
  weekly_essential_expenses_cents: number;
  emergency_savings_cents: number;
}

export interface ShockScenarioPayload {
  income_reduction_percent: number;
  weeks_affected: number;
  unexpected_cost_cents: number;
  recovery_weeks: number;
  horizon_weeks?: number | null;
}

export interface SimulationRequest {
  baseline: BaselineFinancesPayload;
  scenario: ShockScenarioPayload;
}

export interface WeekProjection {
  week: number;
  gross_earnings_cents: number;
  work_costs_cents: number;
  net_work_income_cents: number;
  essential_expenses_cents: number;
  one_off_cost_cents: number;
  net_cash_flow_cents: number;
  buffer_open_cents: number;
  buffer_close_cents: number;
  shortfall_cents: number;
}

export interface BaselineSummary {
  weekly_gross_earnings_cents: number;
  weekly_work_costs_cents: number;
  weekly_net_work_income_cents: number;
  weekly_essential_expenses_cents: number;
  weekly_surplus_cents: number;
  emergency_savings_cents: number;
  emergency_savings_weeks_of_essentials: number | null;
  runway_weeks: number | null;
}

export interface ScenarioSummary {
  horizon_weeks: number;
  weeks_affected: number;
  recovery_weeks: number;
  weekly_net_work_income_during_shock_cents: number;
  weekly_net_cash_flow_during_shock_cents: number;
  unexpected_cost_cents: number;
  total_income_lost_cents: number;
  lowest_buffer_cents: number;
  lowest_buffer_week: number;
  buffer_runway_weeks: number | null;
  first_shortfall_week: number | null;
  total_shortfall_cents: number;
  buffer_at_horizon_cents: number;
  buffer_holds_through_horizon: boolean;
  full_income_resumes_week: number | null;
}

export interface PreparatoryAction {
  id: string;
  title: string;
  detail: string;
  severity: 'info' | 'attention';
  resource_ids: string[];
}

export interface OfficialResource {
  id: string;
  name: string;
  description: string;
  url: string;
  last_reviewed: string;
}

export interface ScenarioResult {
  baseline: BaselineSummary;
  scenario: ScenarioSummary;
  weeks: WeekProjection[];
  actions: PreparatoryAction[];
  resources: OfficialResource[];
  disclaimers: string[];
}
