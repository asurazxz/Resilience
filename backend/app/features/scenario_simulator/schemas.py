"""Transport schemas for the scenario simulator endpoint.

These types validate the HTTP boundary only. All arithmetic stays in `engine`,
which is why every response field mirrors a value the engine already computed.
"""

from pydantic import BaseModel, Field


class BaselineFinancesPayload(BaseModel):
    weekly_gross_earnings_cents: int = Field(ge=0)
    weekly_variable_work_costs_cents: int = Field(ge=0)
    weekly_fixed_work_costs_cents: int = Field(ge=0)
    weekly_essential_expenses_cents: int = Field(ge=0)
    emergency_savings_cents: int = Field(ge=0)


class ShockScenarioPayload(BaseModel):
    income_reduction_percent: int = Field(ge=0, le=100)
    weeks_affected: int = Field(ge=0)
    unexpected_cost_cents: int = Field(default=0, ge=0)
    recovery_weeks: int = Field(default=0, ge=0)
    horizon_weeks: int | None = Field(default=None, ge=1)


class SimulationRequest(BaseModel):
    baseline: BaselineFinancesPayload
    scenario: ShockScenarioPayload


class WeekProjectionResponse(BaseModel):
    week: int
    gross_earnings_cents: int
    work_costs_cents: int
    net_work_income_cents: int
    essential_expenses_cents: int
    one_off_cost_cents: int
    net_cash_flow_cents: int
    buffer_open_cents: int
    buffer_close_cents: int
    shortfall_cents: int


class BaselineSummaryResponse(BaseModel):
    weekly_gross_earnings_cents: int
    weekly_work_costs_cents: int
    weekly_net_work_income_cents: int
    weekly_essential_expenses_cents: int
    weekly_surplus_cents: int
    emergency_savings_cents: int
    emergency_savings_weeks_of_essentials: int | None
    runway_weeks: int | None


class ScenarioSummaryResponse(BaseModel):
    horizon_weeks: int
    weeks_affected: int
    recovery_weeks: int
    weekly_net_work_income_during_shock_cents: int
    weekly_net_cash_flow_during_shock_cents: int
    unexpected_cost_cents: int
    total_income_lost_cents: int
    lowest_buffer_cents: int
    lowest_buffer_week: int
    buffer_runway_weeks: int | None
    first_shortfall_week: int | None
    total_shortfall_cents: int
    buffer_at_horizon_cents: int
    buffer_holds_through_horizon: bool
    full_income_resumes_week: int | None


class PreparatoryActionResponse(BaseModel):
    id: str
    title: str
    detail: str
    severity: str
    resource_ids: list[str]


class OfficialResourceResponse(BaseModel):
    id: str
    name: str
    description: str
    url: str
    last_reviewed: str


class ScenarioResultResponse(BaseModel):
    baseline: BaselineSummaryResponse
    scenario: ScenarioSummaryResponse
    weeks: list[WeekProjectionResponse]
    actions: list[PreparatoryActionResponse]
    resources: list[OfficialResourceResponse]
    disclaimers: list[str]
