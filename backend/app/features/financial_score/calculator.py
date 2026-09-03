"""Pure, deterministic Financial Score calculation. No AI anywhere.

Every input is a plain dataclass; nothing here touches FastAPI or SQLAlchemy,
so this module is fully unit-testable without a database. See
``documentation/features/financial-score.md`` for the specification this
module implements.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from fractions import Fraction

CONTRIBUTION_WINDOW_DAYS = 28

_BAND_THRESHOLDS: tuple[tuple[int, str], ...] = (
    (80, "resilient"),
    (60, "strong"),
    (40, "steady"),
    (0, "building"),
)

_NEXT_STEP_TEXT: dict[str, str] = {
    "emergency_fund": (
        "Keep adding to your emergency fund so it covers more of your essential "
        "expenses if income stops."
    ),
    "savings_habit": (
        "Set up a weekly savings plan or goal, and keep contributing to it regularly."
    ),
    "cash_flow": (
        "Look for ways to grow your weekly surplus by increasing income or trimming costs."
    ),
}

_NO_SCORE_NEXT_STEP = (
    "Record a week of income and costs, or add your essential expenses, so we can "
    "calculate your first Financial Score."
)

_COMPONENT_ORDER = ("emergency_fund", "savings_habit", "cash_flow")
_COMPONENT_RANK: dict[str, int] = {
    component_id: index for index, component_id in enumerate(_COMPONENT_ORDER)
}

# Low to high. A band cap can only move the band down this list, never up.
_BAND_RANK: dict[str, int] = {"building": 0, "steady": 1, "strong": 2, "resilient": 3}

# Graduated emergency-fund ratio thresholds used to cap the band label. The
# buffer is what determines whether someone survives an income shock, so the
# label is held back until the buffer is genuinely substantial even when the
# other components (savings habit, cash flow) score well. Below
# _EMERGENCY_FUND_STEADY_CAP_RATIO the buffer is negligible and the band may
# not exceed "steady"; below _EMERGENCY_FUND_STRONG_CAP_RATIO it is partial
# and the band may not exceed "strong"; at or above that, no cap applies.
_EMERGENCY_FUND_STEADY_CAP_RATIO = Fraction(1, 4)
_EMERGENCY_FUND_STRONG_CAP_RATIO = Fraction(3, 4)


@dataclass(frozen=True)
class JarInput:
    """The pieces of the resilience-jar plan the score needs."""

    goal_mode: str  # "amount" or "coverage"
    goal_weeks: int | None
    goal_amount_cents: int | None
    weekly_essential_expenses_cents: int | None
    balance_cents: int
    plan_status: str  # "active" or "paused"
    weekly_target_cents: int
    recommendation_status: str  # "ready" or "insufficient_data"
    recommendation_amount_cents: int | None


@dataclass(frozen=True)
class SavingsGoalInput:
    status: str  # "active", "completed", or "archived"
    suggested_weekly_cents: int | None


@dataclass(frozen=True)
class WeeklySurplusInput:
    week_start: date
    income_cents: int
    available_surplus_cents: int


@dataclass(frozen=True)
class DepositInput:
    """An emergency-fund deposit (entry_type = deposit only; withdrawals excluded)."""

    contribution_date: date
    amount_cents: int


@dataclass(frozen=True)
class GoalContributionInput:
    contributed_on: date
    amount_cents: int


@dataclass(frozen=True)
class ComponentResult:
    id: str
    label: str
    status: str  # "scored" or "not_enough_information"
    points: int
    max_points: int
    detail: str


@dataclass(frozen=True)
class MissingInput:
    id: str
    label: str
    action: str
    route: str


@dataclass(frozen=True)
class FinancialScoreResult:
    score: int | None
    band: str
    scored_max_points: int
    components: tuple[ComponentResult, ...]
    next_step: str | None
    missing_inputs: tuple[MissingInput, ...]


_MISSING_INPUT_ESSENTIAL_EXPENSES = MissingInput(
    "essential_expenses",
    "Essential expenses",
    "Add your everyday essentials so we can size your emergency fund goal.",
    "/profile",
)
_MISSING_INPUT_EMERGENCY_FUND_GOAL = MissingInput(
    "emergency_fund_goal",
    "Emergency fund goal",
    "Set a target amount for your emergency fund.",
    "/resilience-jar",
)
_MISSING_INPUT_INCOME_TRANSACTIONS = MissingInput(
    "income_transactions",
    "Recorded income",
    "Record some income so we can measure your cash flow.",
    "/transactions/new",
)
_MISSING_INPUT_SAVINGS_PLAN = MissingInput(
    "savings_plan",
    "Savings plan",
    "Set a weekly saving amount, or add a savings goal.",
    "/savings",
)


def calculate_financial_score(
    today: date,
    jar: JarInput,
    savings_goals: list[SavingsGoalInput],
    weekly_surpluses: list[WeeklySurplusInput],
    emergency_deposits: list[DepositInput],
    goal_contributions: list[GoalContributionInput],
) -> FinancialScoreResult:
    emergency_fund = _emergency_fund_component(jar)
    savings_habit = _savings_habit_component(
        today, jar, savings_goals, emergency_deposits, goal_contributions
    )
    cash_flow = _cash_flow_component(weekly_surpluses)
    components = (emergency_fund, savings_habit, cash_flow)

    missing_inputs = _missing_inputs(jar, savings_goals, emergency_fund, savings_habit, cash_flow)

    scored = [c for c in components if c.status == "scored"]
    scored_max_points = sum(c.max_points for c in scored)

    # savings_habit always scores (a deliberate zero for "no plan" is real
    # data), so scored_max_points alone can never be 0 and is not a reliable
    # signal that the user has told us anything. Only emergency_fund and
    # cash_flow require genuine user-entered data, so require one of those
    # two before showing a number at all.
    has_score_basis = emergency_fund.status == "scored" or cash_flow.status == "scored"

    if not has_score_basis:
        score: int | None = None
        band = "unknown"
        next_step = _NO_SCORE_NEXT_STEP
    else:
        earned = sum(c.points for c in scored)
        score = _clamp_int(round(100 * Fraction(earned, scored_max_points)), 0, 100)
        band = _band_for(score)
        band, capped = _apply_band_cap(band, emergency_fund)
        next_step = _NEXT_STEP_TEXT["emergency_fund"] if capped else _next_step(scored)

    return FinancialScoreResult(
        score=score,
        band=band,
        scored_max_points=scored_max_points,
        components=components,
        next_step=next_step,
        missing_inputs=missing_inputs,
    )


def _missing_inputs(
    jar: JarInput,
    savings_goals: list[SavingsGoalInput],
    emergency_fund: ComponentResult,
    savings_habit: ComponentResult,
    cash_flow: ComponentResult,
) -> tuple[MissingInput, ...]:
    """Inputs the user still needs to supply before an unscored component
    (or the savings-habit plan half) can be scored.

    Emitted whether or not an overall score exists, so a partial score can
    still prompt the user toward the next thing to add. Ordered by the
    maxPoints of the component each entry unblocks, largest first, so the
    highest-value action leads.
    """
    entries: list[tuple[int, int, MissingInput]] = []

    if emergency_fund.status == "not_enough_information":
        if jar.goal_mode == "coverage" and (
            jar.weekly_essential_expenses_cents is None
            or jar.weekly_essential_expenses_cents <= 0
        ):
            item = _MISSING_INPUT_ESSENTIAL_EXPENSES
        else:
            item = _MISSING_INPUT_EMERGENCY_FUND_GOAL
        entries.append(
            (emergency_fund.max_points, _COMPONENT_RANK["emergency_fund"], item)
        )

    if cash_flow.status == "not_enough_information":
        entries.append(
            (cash_flow.max_points, _COMPONENT_RANK["cash_flow"], _MISSING_INPUT_INCOME_TRANSACTIONS)
        )

    if not _has_active_savings_plan(jar, savings_goals):
        entries.append(
            (
                savings_habit.max_points,
                _COMPONENT_RANK["savings_habit"],
                _MISSING_INPUT_SAVINGS_PLAN,
            )
        )

    entries.sort(key=lambda entry: (-entry[0], entry[1]))
    return tuple(item for _, _, item in entries)


def _has_active_savings_plan(jar: JarInput, savings_goals: list[SavingsGoalInput]) -> bool:
    active_goals = [g for g in savings_goals if g.status == "active"]
    return (jar.plan_status == "active" and jar.weekly_target_cents > 0) or bool(active_goals)


def _band_for(score: int) -> str:
    for threshold, name in _BAND_THRESHOLDS:
        if score >= threshold:
            return name
    return "building"  # pragma: no cover - unreachable, thresholds cover 0..100


def _apply_band_cap(band: str, emergency_fund: ComponentResult) -> tuple[str, bool]:
    """Cap the band so a user with no visible buffer is never called resilient.

    The numeric score is left untouched (it's a transparent points/maxPoints
    ratio over whatever components scored); only the qualitative label is
    capped, and only ever downward.
    """
    if emergency_fund.status != "scored":
        cap = "steady"
    elif emergency_fund.max_points:
        ratio = Fraction(emergency_fund.points, emergency_fund.max_points)
        if ratio < _EMERGENCY_FUND_STEADY_CAP_RATIO:
            cap = "steady"
        elif ratio < _EMERGENCY_FUND_STRONG_CAP_RATIO:
            cap = "strong"
        else:
            return band, False
    else:
        return band, False

    if _BAND_RANK[band] > _BAND_RANK[cap]:
        return cap, True
    return band, False


def _next_step(scored: list[ComponentResult]) -> str | None:
    if not scored:
        return None
    order = {component_id: index for index, component_id in enumerate(_COMPONENT_ORDER)}

    def sort_key(component: ComponentResult) -> tuple[Fraction, int]:
        ratio = (
            Fraction(component.points, component.max_points)
            if component.max_points
            else Fraction(0)
        )
        return (ratio, order.get(component.id, len(order)))

    weakest = min(scored, key=sort_key)
    return _NEXT_STEP_TEXT.get(weakest.id)


def _emergency_fund_component(jar: JarInput) -> ComponentResult:
    label = "Emergency fund"
    target_cents = _emergency_fund_target(jar)
    if target_cents is None or target_cents <= 0:
        if jar.goal_mode == "coverage" and (
            jar.weekly_essential_expenses_cents is None
            or jar.weekly_essential_expenses_cents <= 0
        ):
            detail = (
                "Add your everyday essential expenses under Profile so we can work out "
                "how big your emergency fund needs to be."
            )
        else:
            detail = (
                "Set a target amount for your emergency fund under Emergency fund so we "
                "can start measuring your progress toward it."
            )
        return ComponentResult(
            "emergency_fund",
            label,
            "not_enough_information",
            0,
            40,
            detail,
        )

    ratio = _ratio(jar.balance_cents, target_cents)
    points = _clamp_int(round(40 * ratio), 0, 40)

    if jar.goal_mode == "coverage" and jar.weekly_essential_expenses_cents:
        weeks_covered = Fraction(jar.balance_cents, jar.weekly_essential_expenses_cents)
        detail = (
            f"Your emergency fund covers about {_format_weeks(weeks_covered)} of essential "
            f"expenses, out of the {jar.goal_weeks} weeks you're aiming for."
        )
    else:
        detail = (
            f"You've saved {_format_cents(jar.balance_cents)} of your "
            f"{_format_cents(target_cents)} emergency fund target."
        )

    return ComponentResult("emergency_fund", label, "scored", points, 40, detail)


def _emergency_fund_target(jar: JarInput) -> int | None:
    if jar.goal_mode == "amount":
        return jar.goal_amount_cents
    if jar.weekly_essential_expenses_cents is None or jar.weekly_essential_expenses_cents <= 0:
        return None
    if jar.goal_weeks is None:
        return None
    return jar.weekly_essential_expenses_cents * jar.goal_weeks


def _savings_habit_component(
    today: date,
    jar: JarInput,
    savings_goals: list[SavingsGoalInput],
    emergency_deposits: list[DepositInput],
    goal_contributions: list[GoalContributionInput],
) -> ComponentResult:
    label = "Savings habit"
    active_goals = [g for g in savings_goals if g.status == "active"]
    has_plan = _has_active_savings_plan(jar, savings_goals)
    plan_points = 10 if has_plan else 0

    expected_4w = jar.weekly_target_cents * 4 + sum(
        (goal.suggested_weekly_cents or 0) * 4 for goal in active_goals
    )
    recommendation_ready = (
        jar.recommendation_status == "ready" and jar.recommendation_amount_cents
    )
    if expected_4w == 0 and recommendation_ready:
        expected_4w = jar.recommendation_amount_cents * 4

    if expected_4w == 0:
        detail = (
            "Set a weekly savings target or goal amount so we can measure your saving "
            "habit against it."
            if plan_points == 0
            else "You have a savings plan in place; add a weekly amount so we can track progress."
        )
        return ComponentResult("savings_habit", label, "scored", plan_points, 10, detail)

    window_start = today - timedelta(days=CONTRIBUTION_WINDOW_DAYS - 1)
    deposits_in_window = sum(
        item.amount_cents
        for item in emergency_deposits
        if window_start <= item.contribution_date <= today
    )
    goal_contributions_in_window = sum(
        item.amount_cents
        for item in goal_contributions
        if window_start <= item.contributed_on <= today
    )
    actual_4w = deposits_in_window + goal_contributions_in_window
    ratio = _ratio(actual_4w, expected_4w)
    achievement_points = _clamp_int(round(20 * ratio), 0, 20)
    points = plan_points + achievement_points
    detail = (
        f"Over the last 4 weeks you saved {_format_cents(actual_4w)} of the "
        f"{_format_cents(expected_4w)} expected from your plan."
    )
    return ComponentResult("savings_habit", label, "scored", points, 30, detail)


def _cash_flow_component(weekly_surpluses: list[WeeklySurplusInput]) -> ComponentResult:
    label = "Cash flow"
    recent = sorted(weekly_surpluses, key=lambda item: item.week_start, reverse=True)[:4]
    if not recent:
        return ComponentResult(
            "cash_flow",
            label,
            "not_enough_information",
            0,
            30,
            "Log a few weeks of income and costs under Transactions so we can measure "
            "your cash flow.",
        )

    avg_income = Fraction(sum(item.income_cents for item in recent), len(recent))
    avg_surplus = Fraction(sum(item.available_surplus_cents for item in recent), len(recent))
    if avg_income <= 0:
        return ComponentResult(
            "cash_flow",
            label,
            "not_enough_information",
            0,
            30,
            "Record some income under Transactions, not just costs, so we can measure "
            "your cash flow.",
        )

    ratio = avg_surplus / avg_income
    if ratio <= 0:
        points = 0
        detail = "You've been spending more than you earn in a typical recent week."
    elif ratio >= Fraction(1, 5):
        points = 30
        detail = "You're consistently keeping 20 cents or more of every dollar you earn."
    else:
        points = _clamp_int(round(30 * ratio / Fraction(1, 5)), 0, 30)
        cents_per_dollar = round(100 * ratio)
        detail = f"You keep about {cents_per_dollar} cents of every dollar you earn, on average."

    return ComponentResult("cash_flow", label, "scored", points, 30, detail)


def _ratio(numerator: int, denominator: int) -> Fraction:
    if denominator <= 0:
        return Fraction(0)
    return _clamp_fraction(Fraction(numerator, denominator), Fraction(0), Fraction(1))


def _clamp_fraction(value: Fraction, low: Fraction, high: Fraction) -> Fraction:
    return max(low, min(high, value))


def _clamp_int(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def _format_cents(cents: int) -> str:
    dollars, remainder = divmod(cents, 100)
    return f"${dollars:,}.{remainder:02d}"


def _format_weeks(weeks: Fraction) -> str:
    return f"{float(weeks):.1f} weeks"
