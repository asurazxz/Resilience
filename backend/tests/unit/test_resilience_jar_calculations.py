from __future__ import annotations

import unittest
from datetime import date

from backend.app.features.resilience_jar.calculations import (
    calculate_completion_projection,
    calculate_milestones,
    calculate_progress,
    recommend_weekly_savings,
    target_amount_to_weekly_cents,
    weekly_cents_to_target_amount,
)
from backend.app.features.resilience_jar.models import (
    AmountGoal,
    CoverageGoal,
    JarPlan,
    PlanStatus,
    Progress,
    RecommendationMethod,
    TargetFrequency,
    WeeklySurplus,
)


def week(day: int, surplus_cents: int) -> WeeklySurplus:
    return WeeklySurplus(date(2026, 8, day), surplus_cents)


class RecommendationTests(unittest.TestCase):
    def test_no_completed_weeks_is_explicitly_insufficient(self) -> None:
        result = recommend_weekly_savings(RecommendationMethod.CONSERVATIVE_FOUR_WEEK, [])

        self.assertEqual("insufficient_data", result.status)
        self.assertIsNone(result.amount_cents)
        self.assertEqual("no_completed_weeks", result.rationale_code)

    def test_latest_week_uses_twenty_percent_and_floors_cents(self) -> None:
        result = recommend_weekly_savings(RecommendationMethod.LATEST_WEEK, [week(24, 10_004)])

        self.assertEqual(2_000, result.amount_cents)
        self.assertEqual(1, result.history_weeks_used)

    def test_latest_week_returns_zero_for_negative_surplus(self) -> None:
        result = recommend_weekly_savings(RecommendationMethod.LATEST_WEEK, [week(24, -5_000)])

        self.assertEqual(0, result.amount_cents)
        self.assertEqual("latest_week_non_positive", result.rationale_code)

    def test_conservative_method_uses_four_week_median_but_caps_at_latest(self) -> None:
        result = recommend_weekly_savings(
            RecommendationMethod.CONSERVATIVE_FOUR_WEEK,
            [
                week(24, 50_000),
                week(17, 100_000),
                week(10, 30_000),
                week(3, 70_000),
            ],
        )

        self.assertEqual(10_000, result.amount_cents)
        self.assertEqual(4, result.history_weeks_used)

    def test_conservative_method_ignores_non_positive_history(self) -> None:
        result = recommend_weekly_savings(
            RecommendationMethod.CONSERVATIVE_FOUR_WEEK,
            [week(24, 50_000), week(17, 0), week(10, -20_000)],
        )

        self.assertEqual(10_000, result.amount_cents)

    def test_conservative_method_floors_an_even_median(self) -> None:
        result = recommend_weekly_savings(
            RecommendationMethod.CONSERVATIVE_FOUR_WEEK,
            [week(24, 10_000), week(17, 101)],
        )

        self.assertEqual(1_010, result.amount_cents)

    def test_weak_latest_week_never_uses_a_larger_historical_target(self) -> None:
        result = recommend_weekly_savings(
            RecommendationMethod.CONSERVATIVE_FOUR_WEEK,
            [week(24, 500), week(17, 100_000), week(10, 80_000)],
        )

        self.assertEqual(100, result.amount_cents)


class ProgressTests(unittest.TestCase):
    def test_amount_goal_reports_partial_progress_and_coverage(self) -> None:
        result = calculate_progress(AmountGoal(100_000), [20_000, 30_000], 70_000)

        self.assertEqual(50_000, result.contribution_total_cents)
        self.assertEqual(50.0, result.progress_percent)
        self.assertEqual(5.0, result.coverage_days)
        self.assertEqual(0.7, result.coverage_weeks)

    def test_coverage_goal_derives_target_from_current_expenses(self) -> None:
        result = calculate_progress(CoverageGoal(4), [70_000], 70_000)

        self.assertEqual(280_000, result.goal_target_cents)
        self.assertEqual(25.0, result.progress_percent)
        self.assertEqual(210_000, result.remaining_cents)
        self.assertFalse(result.goal_reached)

    def test_coverage_goal_defaults_to_twenty_six_weeks(self) -> None:
        result = calculate_progress(CoverageGoal(), [0], 30_461)

        self.assertEqual(26, CoverageGoal().weeks)
        self.assertEqual(791_986, result.goal_target_cents)

    def test_goal_is_reached_once_the_balance_meets_the_target(self) -> None:
        exact = calculate_progress(AmountGoal(100_000), [100_000], 70_000)
        beyond = calculate_progress(AmountGoal(100_000), [120_000], 70_000)

        self.assertTrue(exact.goal_reached)
        self.assertEqual(0, exact.remaining_cents)
        self.assertTrue(beyond.goal_reached)
        self.assertEqual(0, beyond.remaining_cents)

    def test_remaining_and_reached_are_unavailable_without_a_target(self) -> None:
        result = calculate_progress(CoverageGoal(26), [2_500], None)

        self.assertIsNone(result.goal_target_cents)
        self.assertIsNone(result.remaining_cents)
        self.assertFalse(result.goal_reached)

    def test_progress_over_goal_is_not_capped(self) -> None:
        result = calculate_progress(AmountGoal(10_000), [12_500], 70_000)

        self.assertEqual(125.0, result.progress_percent)

    def test_missing_expenses_only_hides_coverage_dependent_values(self) -> None:
        amount_result = calculate_progress(AmountGoal(10_000), [2_500], None)
        coverage_result = calculate_progress(CoverageGoal(4), [2_500], 0)

        self.assertEqual(25.0, amount_result.progress_percent)
        self.assertIsNone(amount_result.coverage_days)
        self.assertIsNone(coverage_result.goal_target_cents)
        self.assertIsNone(coverage_result.progress_percent)


class ProjectionAndMilestoneTests(unittest.TestCase):
    def test_monthly_target_converts_through_a_weekly_equivalent(self) -> None:
        self.assertEqual(
            9_000,
            target_amount_to_weekly_cents(39_000, TargetFrequency.MONTHLY),
        )
        self.assertEqual(
            39_000,
            weekly_cents_to_target_amount(9_000, TargetFrequency.MONTHLY),
        )

    def test_projection_rounds_remaining_amount_up_to_complete_weeks(self) -> None:
        projection = calculate_completion_projection(
            JarPlan(user_id="user", weekly_target_cents=15_000),
            Progress(20_000, 100_000, 20.0, 2.0, 0.3),
            date(2026, 9, 1),
        )

        self.assertEqual("projected", projection.status)
        self.assertEqual(6, projection.weeks_remaining)
        self.assertEqual(date(2026, 10, 13), projection.projected_date)

    def test_projection_explains_paused_and_complete_states(self) -> None:
        paused = calculate_completion_projection(
            JarPlan(user_id="user", weekly_target_cents=10_000, status=PlanStatus.PAUSED),
            Progress(20_000, 100_000, 20.0, 2.0, 0.3),
            date(2026, 9, 1),
        )
        complete = calculate_completion_projection(
            JarPlan(user_id="user", weekly_target_cents=10_000),
            Progress(100_000, 100_000, 100.0, 10.0, 1.4),
            date(2026, 9, 1),
        )

        self.assertEqual("paused", paused.status)
        self.assertEqual("complete", complete.status)
        self.assertEqual(date(2026, 9, 1), complete.projected_date)

    def test_milestones_report_reached_and_upcoming_thresholds(self) -> None:
        milestones = calculate_milestones(100_000, 52_000)

        self.assertEqual([25, 50, 75, 100], [item.percentage for item in milestones])
        self.assertEqual([True, True, False, False], [item.reached for item in milestones])


if __name__ == "__main__":
    unittest.main()
