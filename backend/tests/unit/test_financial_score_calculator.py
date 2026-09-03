"""Unit tests for the pure financial-score calculator. No database involved."""

from __future__ import annotations

from datetime import date, timedelta

from backend.app.features.financial_score.calculator import (
    _NEXT_STEP_TEXT,
    _NO_SCORE_NEXT_STEP,
    ComponentResult,
    DepositInput,
    GoalContributionInput,
    JarInput,
    SavingsGoalInput,
    WeeklySurplusInput,
    _apply_band_cap,
    _band_for,
    calculate_financial_score,
)

TODAY = date(2026, 9, 3)


def _no_plan_jar() -> JarInput:
    return JarInput(
        goal_mode="coverage",
        goal_weeks=None,
        goal_amount_cents=None,
        weekly_essential_expenses_cents=None,
        balance_cents=0,
        plan_status="active",
        weekly_target_cents=0,
        recommendation_status="insufficient_data",
        recommendation_amount_cents=None,
    )


def _full_marks_jar() -> JarInput:
    return JarInput(
        goal_mode="coverage",
        goal_weeks=26,
        goal_amount_cents=None,
        weekly_essential_expenses_cents=30_000,
        balance_cents=30_000 * 26,
        plan_status="active",
        weekly_target_cents=10_000,
        recommendation_status="ready",
        recommendation_amount_cents=5_000,
    )


def _surpluses(count: int, income_cents: int, surplus_cents: int) -> list[WeeklySurplusInput]:
    return [
        WeeklySurplusInput(TODAY - timedelta(weeks=i), income_cents, surplus_cents)
        for i in range(count)
    ]


def test_full_marks_scores_100_and_resilient_band() -> None:
    jar = _full_marks_jar()
    goals = [SavingsGoalInput("active", 10_000)]
    surpluses = _surpluses(4, 100_000, 20_000)  # ratio exactly 0.20
    deposits = [DepositInput(TODAY, 10_000 * 4)]
    contributions = [GoalContributionInput(TODAY, 10_000 * 4)]

    result = calculate_financial_score(TODAY, jar, goals, surpluses, deposits, contributions)

    assert result.score == 100
    assert result.band == "resilient"
    assert result.scored_max_points == 100
    for component in result.components:
        assert component.status == "scored"
        assert component.points == component.max_points
    # Every component is maxed out (a three-way tie); the lowest-ratio pick
    # still resolves deterministically to the first component in order.
    assert result.next_step is not None


def test_thin_buffer_with_full_habit_and_cash_flow_caps_to_steady() -> None:
    """Regression for the live probe: S$200 emergency fund against a S$7,800
    target (ratio 0.025, 1/40 points) with a perfect savings habit and cash
    flow produces a raw score of 61 (naturally "strong"), but a 2.5% buffer
    must not be called "strong" -> the graduated cap holds it to "steady",
    while the component rows still show full marks so the card explains
    itself."""
    jar = JarInput(
        goal_mode="amount",
        goal_weeks=None,
        goal_amount_cents=780_000,  # S$7,800 target
        weekly_essential_expenses_cents=None,
        balance_cents=20_000,  # S$200 buffer
        plan_status="active",
        weekly_target_cents=10_000,
        recommendation_status="ready",
        recommendation_amount_cents=5_000,
    )
    goals = [SavingsGoalInput("active", 10_000)]
    surpluses = _surpluses(4, 100_000, 20_000)  # full cash-flow marks
    deposits = [DepositInput(TODAY, 10_000 * 4)]
    contributions = [GoalContributionInput(TODAY, 10_000 * 4)]

    result = calculate_financial_score(TODAY, jar, goals, surpluses, deposits, contributions)

    ef = next(c for c in result.components if c.id == "emergency_fund")
    habit = next(c for c in result.components if c.id == "savings_habit")
    cash_flow = next(c for c in result.components if c.id == "cash_flow")

    assert ef.status == "scored"
    assert ef.points == 1  # round(40 * 200/7800)
    assert ef.max_points == 40
    assert habit.points == habit.max_points == 30
    assert cash_flow.points == cash_flow.max_points == 30

    assert result.score == 61
    assert result.band == "steady"
    assert result.next_step == _NEXT_STEP_TEXT["emergency_fund"]


def test_zero_progress_but_nonzero_plan_scores_low_and_building_band() -> None:
    """Balance 0, no contributions, negative cash flow: only the 'has a plan'
    points survive, so the score is low but not exactly zero."""
    jar = JarInput(
        goal_mode="coverage",
        goal_weeks=26,
        goal_amount_cents=None,
        weekly_essential_expenses_cents=30_000,
        balance_cents=0,
        plan_status="active",
        weekly_target_cents=10_000,
        recommendation_status="ready",
        recommendation_amount_cents=5_000,
    )
    surpluses = _surpluses(4, 100_000, -50_000)

    result = calculate_financial_score(TODAY, jar, [], surpluses, [], [])

    assert result.score == 10  # 10/100: the savings-habit plan-half only
    assert result.band == "building"
    assert result.next_step is not None


def test_fully_zero_scores_null_and_unknown_band() -> None:
    """With no target, no weeks logged, and no plan, only savings_habit scores
    (a real 0). That alone is not a basis for a number: score/band must be
    null/unknown, not a demoralising 0."""
    jar = _no_plan_jar()
    result = calculate_financial_score(TODAY, jar, [], [], [], [])
    assert result.score is None
    assert result.band == "unknown"
    assert result.next_step == _NO_SCORE_NEXT_STEP


def test_emergency_fund_not_enough_information_when_no_target() -> None:
    jar = _no_plan_jar()
    result = calculate_financial_score(TODAY, jar, [], [], [], [])
    ef = next(c for c in result.components if c.id == "emergency_fund")
    assert ef.status == "not_enough_information"
    assert ef.points == 0


def test_savings_habit_scored_zero_with_no_plan_not_not_enough_information() -> None:
    jar = _no_plan_jar()
    result = calculate_financial_score(TODAY, jar, [], [], [], [])
    habit = next(c for c in result.components if c.id == "savings_habit")
    assert habit.status == "scored"
    assert habit.points == 0
    assert habit.max_points == 10  # achievement half unscorable with nothing expected


def test_cash_flow_not_enough_information_with_no_weeks() -> None:
    jar = _full_marks_jar()
    result = calculate_financial_score(TODAY, jar, [], [], [], [])
    cash_flow = next(c for c in result.components if c.id == "cash_flow")
    assert cash_flow.status == "not_enough_information"


def test_cash_flow_not_enough_information_with_non_positive_avg_income() -> None:
    jar = _full_marks_jar()
    surpluses = _surpluses(4, 0, 0)
    result = calculate_financial_score(TODAY, jar, [], surpluses, [], [])
    cash_flow = next(c for c in result.components if c.id == "cash_flow")
    assert cash_flow.status == "not_enough_information"


def test_rescaling_when_achievement_half_is_unscorable() -> None:
    """No weekly target, no goals, no recommendation -> only the plan half (10) counts."""
    jar = JarInput(
        goal_mode="amount",
        goal_weeks=None,
        goal_amount_cents=100_000,
        weekly_essential_expenses_cents=None,
        balance_cents=100_000,
        plan_status="active",
        weekly_target_cents=0,
        recommendation_status="insufficient_data",
        recommendation_amount_cents=None,
    )
    goals = [SavingsGoalInput("active", None)]
    result = calculate_financial_score(TODAY, jar, goals, [], [], [])
    habit = next(c for c in result.components if c.id == "savings_habit")
    assert habit.max_points == 10
    assert habit.points == 10  # plan half: an active goal exists


def test_achievement_fallback_to_recommended_amount() -> None:
    jar = JarInput(
        goal_mode="amount",
        goal_weeks=None,
        goal_amount_cents=100_000,
        weekly_essential_expenses_cents=None,
        balance_cents=0,
        plan_status="active",
        weekly_target_cents=0,
        recommendation_status="ready",
        recommendation_amount_cents=5_000,
    )
    # expected_4w falls back to 5000 * 4 = 20000; deposit exactly that amount.
    deposits = [DepositInput(TODAY, 20_000)]
    result = calculate_financial_score(TODAY, jar, [], [], deposits, [])
    habit = next(c for c in result.components if c.id == "savings_habit")
    assert habit.max_points == 30
    assert habit.points == 20  # plan half 0 (no active plan/goal) + achievement 20


def test_contribution_window_excludes_deposits_outside_28_days() -> None:
    jar = JarInput(
        goal_mode="amount",
        goal_weeks=None,
        goal_amount_cents=100_000,
        weekly_essential_expenses_cents=None,
        balance_cents=0,
        plan_status="active",
        weekly_target_cents=5_000,
        recommendation_status="insufficient_data",
        recommendation_amount_cents=None,
    )
    outside_window = DepositInput(TODAY - timedelta(days=29), 100_000)
    inside_window = DepositInput(TODAY - timedelta(days=27), 5_000 * 4)
    result = calculate_financial_score(TODAY, jar, [], [], [outside_window, inside_window], [])
    habit = next(c for c in result.components if c.id == "savings_habit")
    assert habit.points == 10 + 20  # plan half + full achievement from the in-window deposit only


def test_band_boundaries() -> None:
    boundaries = {
        0: "building",
        39: "building",
        40: "steady",
        59: "steady",
        60: "strong",
        79: "strong",
        80: "resilient",
        100: "resilient",
    }
    for score, expected_band in boundaries.items():
        assert _band_for(score) == expected_band, f"score={score} got {_band_for(score)}"


def test_null_score_when_only_savings_habit_scored() -> None:
    jar = JarInput(
        goal_mode="coverage",
        goal_weeks=26,
        goal_amount_cents=None,
        weekly_essential_expenses_cents=None,  # unscoreable emergency fund
        balance_cents=0,
        plan_status="paused",
        weekly_target_cents=0,
        recommendation_status="insufficient_data",
        recommendation_amount_cents=None,
    )
    result = calculate_financial_score(TODAY, jar, [], [], [], [])
    ef = next(c for c in result.components if c.id == "emergency_fund")
    cf = next(c for c in result.components if c.id == "cash_flow")
    habit = next(c for c in result.components if c.id == "savings_habit")
    assert ef.status == "not_enough_information"
    assert cf.status == "not_enough_information"
    # savings_habit is always scored (0 in this case), but that alone is not
    # a sufficient basis for a number.
    assert habit.status == "scored"
    assert result.score is None
    assert result.band == "unknown"
    assert result.next_step == _NO_SCORE_NEXT_STEP


def test_amounts_always_sum_correctly_for_score_when_all_not_enough_information() -> None:
    jar = JarInput(
        goal_mode="coverage",
        goal_weeks=26,
        goal_amount_cents=None,
        weekly_essential_expenses_cents=None,
        balance_cents=0,
        plan_status="paused",
        weekly_target_cents=0,
        recommendation_status="insufficient_data",
        recommendation_amount_cents=None,
    )
    # savings_habit will still be "scored" (0/10), so scored_max_points > 0 here too,
    # but savings_habit alone is not a basis for a number.
    result = calculate_financial_score(TODAY, jar, [], [], [], [])
    assert result.scored_max_points == 10
    assert result.score is None
    assert result.band == "unknown"


def test_score_appears_as_soon_as_cash_flow_alone_is_scored() -> None:
    """No emergency-fund target at all, but a few weeks of income/costs logged:
    that's real user data, so a real score (and a real, non-null band) must
    appear even though the fund itself stays unscored."""
    jar = _no_plan_jar()
    surpluses = _surpluses(4, 100_000, 20_000)  # ratio exactly 0.20 -> full 30 points
    result = calculate_financial_score(TODAY, jar, [], surpluses, [], [])

    ef = next(c for c in result.components if c.id == "emergency_fund")
    cf = next(c for c in result.components if c.id == "cash_flow")
    assert ef.status == "not_enough_information"
    assert cf.status == "scored"

    # earned = savings_habit 0/10 + cash_flow 30/30 = 30, scored_max = 40 -> 75.
    assert result.score == 75
    # Raw band for 75 would be "strong", but the fund is unscored so it's
    # capped to "steady".
    assert result.band == "steady"


def test_band_capped_to_steady_when_emergency_fund_unscored() -> None:
    """A user with a strong savings habit and strong cash flow but no visible
    emergency-fund target must not be told they're resilient."""
    jar = JarInput(
        goal_mode="coverage",
        goal_weeks=26,
        goal_amount_cents=None,
        weekly_essential_expenses_cents=None,  # no target -> emergency_fund unscored
        balance_cents=0,
        plan_status="active",
        weekly_target_cents=10_000,
        recommendation_status="ready",
        recommendation_amount_cents=5_000,
    )
    surpluses = _surpluses(4, 100_000, 20_000)  # full cash-flow marks
    deposits = [DepositInput(TODAY, 10_000 * 4)]  # full savings-habit achievement

    result = calculate_financial_score(TODAY, jar, [], surpluses, deposits, [])

    ef = next(c for c in result.components if c.id == "emergency_fund")
    assert ef.status == "not_enough_information"
    # savings_habit (30/30) + cash_flow (30/30) = 100% -> would be "resilient".
    assert result.score == 100
    assert result.band == "steady"


def test_band_not_capped_when_emergency_fund_ratio_at_or_above_three_quarters() -> None:
    # 30/40 = 0.75, exactly at the "no cap" threshold.
    band, capped = _apply_band_cap(
        "resilient",
        ComponentResult("emergency_fund", "Emergency fund", "scored", 30, 40, ""),
    )
    assert band == "resilient"
    assert capped is False

    # Comfortably above the threshold too.
    band, capped = _apply_band_cap(
        "resilient",
        ComponentResult("emergency_fund", "Emergency fund", "scored", 40, 40, ""),
    )
    assert band == "resilient"
    assert capped is False


def test_band_capped_to_strong_just_below_three_quarters_ratio() -> None:
    # 29/40 = 0.725, just under the "no cap" threshold -> capped to "strong".
    band, capped = _apply_band_cap(
        "resilient",
        ComponentResult("emergency_fund", "Emergency fund", "scored", 29, 40, ""),
    )
    assert band == "strong"
    assert capped is True


def test_band_capped_to_strong_at_one_quarter_ratio() -> None:
    # 10/40 = 0.25, exactly at the "steady" threshold -> the "strong" cap
    # applies (still below the 0.75 "no cap" threshold).
    band, capped = _apply_band_cap(
        "resilient",
        ComponentResult("emergency_fund", "Emergency fund", "scored", 10, 40, ""),
    )
    assert band == "strong"
    assert capped is True


def test_band_capped_to_steady_just_below_one_quarter_ratio() -> None:
    # 9/40 = 0.225, just under the "steady" threshold -> capped to "steady".
    band, capped = _apply_band_cap(
        "resilient",
        ComponentResult("emergency_fund", "Emergency fund", "scored", 9, 40, ""),
    )
    assert band == "steady"
    assert capped is True


def test_missing_inputs_empty_when_everything_scored() -> None:
    jar = _full_marks_jar()
    goals = [SavingsGoalInput("active", 10_000)]
    surpluses = _surpluses(4, 100_000, 20_000)
    deposits = [DepositInput(TODAY, 10_000 * 4)]
    contributions = [GoalContributionInput(TODAY, 10_000 * 4)]

    result = calculate_financial_score(TODAY, jar, goals, surpluses, deposits, contributions)

    assert result.missing_inputs == ()


def test_missing_inputs_essential_expenses_for_coverage_goal_without_essentials() -> None:
    """Coverage plan with no weekly essential expenses at all: the fix is to
    add essential expenses, not to set a raw target directly."""
    jar = _no_plan_jar()  # coverage mode, weekly_essential_expenses_cents=None
    goals = [SavingsGoalInput("active", 10_000)]  # savings plan present, so it's excluded
    surpluses = _surpluses(4, 100_000, 20_000)  # cash flow scored, so it's excluded

    result = calculate_financial_score(TODAY, jar, goals, surpluses, [], [])

    ids = [item.id for item in result.missing_inputs]
    assert ids == ["essential_expenses"]


def test_missing_inputs_emergency_fund_goal_for_amount_goal_without_amount() -> None:
    """Amount-mode goal with no amount set: the fix is to set a target, not
    to add essential expenses (which wouldn't even apply to this goal mode)."""
    jar = JarInput(
        goal_mode="amount",
        goal_weeks=None,
        goal_amount_cents=None,
        weekly_essential_expenses_cents=None,
        balance_cents=0,
        plan_status="active",
        weekly_target_cents=10_000,
        recommendation_status="ready",
        recommendation_amount_cents=5_000,
    )
    goals = [SavingsGoalInput("active", 10_000)]
    surpluses = _surpluses(4, 100_000, 20_000)

    result = calculate_financial_score(TODAY, jar, goals, surpluses, [], [])

    ids = [item.id for item in result.missing_inputs]
    assert ids == ["emergency_fund_goal"]


def test_missing_inputs_income_transactions_when_cash_flow_unscored() -> None:
    jar = _full_marks_jar()
    goals = [SavingsGoalInput("active", 10_000)]
    deposits = [DepositInput(TODAY, 10_000 * 4)]
    contributions = [GoalContributionInput(TODAY, 10_000 * 4)]

    result = calculate_financial_score(TODAY, jar, goals, [], deposits, contributions)

    ids = [item.id for item in result.missing_inputs]
    assert ids == ["income_transactions"]


def test_missing_inputs_savings_plan_when_no_plan_and_no_active_goal() -> None:
    jar = _full_marks_jar()
    surpluses = _surpluses(4, 100_000, 20_000)
    jar_no_plan = JarInput(
        goal_mode=jar.goal_mode,
        goal_weeks=jar.goal_weeks,
        goal_amount_cents=jar.goal_amount_cents,
        weekly_essential_expenses_cents=jar.weekly_essential_expenses_cents,
        balance_cents=jar.balance_cents,
        plan_status="paused",
        weekly_target_cents=0,
        recommendation_status=jar.recommendation_status,
        recommendation_amount_cents=jar.recommendation_amount_cents,
    )

    result = calculate_financial_score(TODAY, jar_no_plan, [], surpluses, [], [])

    ids = [item.id for item in result.missing_inputs]
    assert ids == ["savings_plan"]


def test_missing_inputs_ordered_by_unblocked_max_points_descending() -> None:
    """All three at once: emergency fund (40) leads, then cash flow (30),
    then the savings plan (10, the plan half)."""
    jar = _no_plan_jar()  # coverage, no essentials, no plan, and no surpluses given below

    result = calculate_financial_score(TODAY, jar, [], [], [], [])

    ids = [item.id for item in result.missing_inputs]
    assert ids == ["essential_expenses", "income_transactions", "savings_plan"]
    # Sanity: the maxPoints backing the order really is descending.
    max_points_by_id = {"essential_expenses": 40, "income_transactions": 30, "savings_plan": 10}
    ordered_points = [max_points_by_id[i] for i in ids]
    assert ordered_points == sorted(ordered_points, reverse=True)


def test_missing_inputs_reported_scenario_no_essentials_no_income() -> None:
    """The reported bug: an emergency-fund balance and a savings goal exist,
    but essential expenses were never entered (so the coverage target can't
    be sized) and the only transactions logged are costs (so cash flow has
    no measurable income). The score must be null, but missingInputs must
    tell the user exactly what to add."""
    jar = JarInput(
        goal_mode="coverage",
        goal_weeks=26,
        goal_amount_cents=None,
        weekly_essential_expenses_cents=None,  # no essential expenses recorded
        balance_cents=50_000,  # the user did save something into the fund
        plan_status="paused",
        weekly_target_cents=0,
        recommendation_status="insufficient_data",
        recommendation_amount_cents=None,
    )
    goals = [SavingsGoalInput("active", 5_000)]  # a savings goal exists
    surpluses = _surpluses(4, 0, -60_000)  # cost-only "income": zero, so unscoreable

    result = calculate_financial_score(TODAY, jar, goals, surpluses, [], [])

    assert result.score is None
    assert result.band == "unknown"
    ids = {item.id for item in result.missing_inputs}
    assert "essential_expenses" in ids
    assert "income_transactions" in ids
    # A savings goal is active, so the plan half is already satisfied.
    assert "savings_plan" not in ids


def test_band_cap_never_raises_a_band() -> None:
    # An unscored fund caps at "steady", but a band already below that must
    # not be pulled up to it.
    band, capped = _apply_band_cap(
        "building",
        ComponentResult("emergency_fund", "Emergency fund", "not_enough_information", 0, 40, ""),
    )
    assert band == "building"
    assert capped is False

    # Same for the below-one-quarter cap at "steady": a band already at or
    # below the cap is left alone.
    band, capped = _apply_band_cap(
        "steady",
        ComponentResult("emergency_fund", "Emergency fund", "scored", 1, 40, ""),
    )
    assert band == "steady"
    assert capped is False

    # And for the below-three-quarters cap at "strong": a raw low band with a
    # full buffer must stay at its natural low band, never get pulled up.
    band, capped = _apply_band_cap(
        "building",
        ComponentResult("emergency_fund", "Emergency fund", "scored", 40, 40, ""),
    )
    assert band == "building"
    assert capped is False
