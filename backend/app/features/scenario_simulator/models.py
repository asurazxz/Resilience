"""Input and output types for the scenario simulator.

Monetary values are integer cents everywhere. Integers avoid the floating-point
drift that would otherwise make the same scenario produce different totals on
different machines, which matters because these figures are shown to the user.
"""

from dataclasses import dataclass

Cents = int


def _require_non_negative(value: int, name: str) -> None:
    if value < 0:
        raise ValueError(f"{name} must be zero or positive, got {value}")


@dataclass(frozen=True)
class BaselineFinances:
    """The user's normal week, as confirmed in the income and expense flows."""

    weekly_gross_earnings_cents: Cents
    weekly_variable_work_costs_cents: Cents
    weekly_fixed_work_costs_cents: Cents
    weekly_essential_expenses_cents: Cents
    emergency_savings_cents: Cents

    def __post_init__(self) -> None:
        _require_non_negative(self.weekly_gross_earnings_cents, "weekly_gross_earnings_cents")
        _require_non_negative(
            self.weekly_variable_work_costs_cents, "weekly_variable_work_costs_cents"
        )
        _require_non_negative(self.weekly_fixed_work_costs_cents, "weekly_fixed_work_costs_cents")
        _require_non_negative(
            self.weekly_essential_expenses_cents, "weekly_essential_expenses_cents"
        )
        _require_non_negative(self.emergency_savings_cents, "emergency_savings_cents")

    @property
    def weekly_work_costs_cents(self) -> Cents:
        return self.weekly_variable_work_costs_cents + self.weekly_fixed_work_costs_cents

    @property
    def weekly_net_work_income_cents(self) -> Cents:
        return self.weekly_gross_earnings_cents - self.weekly_work_costs_cents

    @property
    def weekly_surplus_cents(self) -> Cents:
        return self.weekly_net_work_income_cents - self.weekly_essential_expenses_cents


@dataclass(frozen=True)
class ShockScenario:
    """One financial shock the user wants to prepare for.

    Time away from work is the same model as reduced earnings at 100 percent,
    so the engine keeps a single code path instead of two that could disagree.
    """

    income_reduction_percent: int
    weeks_affected: int
    unexpected_cost_cents: Cents = 0
    recovery_weeks: int = 0
    horizon_weeks: int | None = None

    def __post_init__(self) -> None:
        if not 0 <= self.income_reduction_percent <= 100:
            raise ValueError(
                "income_reduction_percent must be between 0 and 100, got "
                f"{self.income_reduction_percent}"
            )
        _require_non_negative(self.weeks_affected, "weeks_affected")
        _require_non_negative(self.unexpected_cost_cents, "unexpected_cost_cents")
        _require_non_negative(self.recovery_weeks, "recovery_weeks")
        if self.horizon_weeks is not None and self.horizon_weeks < 1:
            raise ValueError(f"horizon_weeks must be at least 1, got {self.horizon_weeks}")


@dataclass(frozen=True)
class WeekProjection:
    """One projected week. Every field is derived, never entered by the user."""

    week: int
    gross_earnings_cents: Cents
    work_costs_cents: Cents
    net_work_income_cents: Cents
    essential_expenses_cents: Cents
    one_off_cost_cents: Cents
    net_cash_flow_cents: Cents
    buffer_open_cents: Cents
    buffer_close_cents: Cents
    shortfall_cents: Cents


@dataclass(frozen=True)
class BaselineSummary:
    weekly_gross_earnings_cents: Cents
    weekly_work_costs_cents: Cents
    weekly_net_work_income_cents: Cents
    weekly_essential_expenses_cents: Cents
    weekly_surplus_cents: Cents
    emergency_savings_cents: Cents
    emergency_savings_weeks_of_essentials: int | None
    runway_weeks: int | None


@dataclass(frozen=True)
class ScenarioSummary:
    horizon_weeks: int
    weeks_affected: int
    recovery_weeks: int
    weekly_net_work_income_during_shock_cents: Cents
    weekly_net_cash_flow_during_shock_cents: Cents
    unexpected_cost_cents: Cents
    total_income_lost_cents: Cents
    lowest_buffer_cents: Cents
    lowest_buffer_week: int
    buffer_runway_weeks: int | None
    first_shortfall_week: int | None
    total_shortfall_cents: Cents
    buffer_at_horizon_cents: Cents
    buffer_holds_through_horizon: bool
    full_income_resumes_week: int | None


@dataclass(frozen=True)
class PreparatoryAction:
    """A deterministic prompt to check something. Never a recommendation to act."""

    id: str
    title: str
    detail: str
    severity: str
    resource_ids: tuple[str, ...] = ()


@dataclass(frozen=True)
class OfficialResource:
    id: str
    name: str
    description: str
    url: str
    last_reviewed: str


@dataclass(frozen=True)
class ScenarioResult:
    baseline: BaselineSummary
    scenario: ScenarioSummary
    weeks: tuple[WeekProjection, ...]
    actions: tuple[PreparatoryAction, ...]
    resources: tuple[OfficialResource, ...]
    disclaimers: tuple[str, ...]
