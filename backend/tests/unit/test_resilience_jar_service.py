from __future__ import annotations

import unittest
from datetime import date

from backend.app.features.resilience_jar.memory import (
    InMemoryContributionRepository,
    InMemoryFinancialContextRepository,
    InMemoryPlanRepository,
)
from backend.app.features.resilience_jar.models import WeeklySurplus
from backend.app.features.resilience_jar.service import DomainError, ResilienceJarService


class ServiceTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.user_id = "user-a"
        self.other_user_id = "user-b"
        self.plans = InMemoryPlanRepository()
        self.contributions = InMemoryContributionRepository()
        self.context = InMemoryFinancialContextRepository()
        self.context.set_surpluses(
            self.user_id,
            [
                WeeklySurplus(date(2026, 8, 24), 50_000),
                WeeklySurplus(date(2026, 8, 17), 70_000),
            ],
        )
        self.context.set_weekly_essential_expenses_cents(self.user_id, 70_000)
        self.service = ResilienceJarService(
            self.plans,
            self.contributions,
            self.context,
            today_provider=lambda: date(2026, 9, 1),
        )

    def test_default_plan_is_conservative_with_four_week_goal(self) -> None:
        summary = self.service.get_summary(self.user_id)

        self.assertEqual("conservative_4_week", summary.plan.recommendation_method)
        self.assertEqual("weekly", summary.plan.target_frequency)
        self.assertEqual("coverage", summary.plan.goal.mode)
        self.assertEqual(4, summary.plan.goal.weeks)
        self.assertEqual(70_000, summary.plan.goal_expense_baseline_cents)
        self.assertEqual("up_to_date", summary.goal_review.status)

    def test_method_change_does_not_accept_new_recommendation(self) -> None:
        self.service.patch_plan(self.user_id, {"weekly_target_cents": 12_345})
        summary = self.service.patch_plan(
            self.user_id, {"recommendation_method": "latest_week"}
        )

        self.assertEqual(12_345, summary.plan.weekly_target_cents)
        self.assertEqual(10_000, summary.recommendation.amount_cents)

    def test_new_income_never_changes_an_accepted_target(self) -> None:
        self.service.patch_plan(self.user_id, {"weekly_target_cents": 10_000})
        self.context.set_surpluses(
            self.user_id, [WeeklySurplus(date(2026, 8, 31), 200_000)]
        )

        summary = self.service.get_summary(self.user_id)

        self.assertEqual(10_000, summary.plan.weekly_target_cents)
        self.assertEqual(40_000, summary.recommendation.amount_cents)

    def test_monthly_target_preference_is_persisted_with_weekly_equivalent(self) -> None:
        summary = self.service.patch_plan(
            self.user_id,
            {"target_frequency": "monthly", "target_amount_cents": 39_000},
        )

        self.assertEqual("monthly", summary.plan.target_frequency)
        self.assertEqual(39_000, summary.plan.target_amount_cents)
        self.assertEqual(9_000, summary.plan.weekly_target_cents)

    def test_pause_retains_plan_settings_and_allows_contributions(self) -> None:
        self.service.patch_plan(
            self.user_id,
            {
                "status": "paused",
                "weekly_target_cents": 9_000,
                "goal": {"mode": "amount", "amount_cents": 100_000},
            },
        )
        self.service.create_contribution(
            self.user_id,
            {"amount_cents": 5_000, "contribution_date": "2026-09-01"},
        )

        summary = self.service.get_summary(self.user_id)

        self.assertEqual("paused", summary.plan.status)
        self.assertEqual(9_000, summary.plan.weekly_target_cents)
        self.assertEqual(5_000, summary.progress.contribution_total_cents)

    def test_coverage_goal_recalculates_when_expenses_change(self) -> None:
        first = self.service.get_summary(self.user_id)
        self.context.set_weekly_essential_expenses_cents(self.user_id, 80_000)
        second = self.service.get_summary(self.user_id)
        acknowledged = self.service.patch_plan(
            self.user_id,
            {"goal": {"mode": "coverage", "weeks": 4}},
        )

        self.assertEqual(280_000, first.progress.goal_target_cents)
        self.assertEqual(320_000, second.progress.goal_target_cents)
        self.assertEqual("expenses_changed", second.goal_review.status)
        self.assertEqual(10_000, second.goal_review.expense_change_cents)
        self.assertEqual("up_to_date", acknowledged.goal_review.status)
        self.assertEqual(80_000, acknowledged.plan.goal_expense_baseline_cents)

    def test_missing_expenses_do_not_create_a_false_goal_alert(self) -> None:
        self.context.set_weekly_essential_expenses_cents(self.user_id, None)

        summary = self.service.get_summary(self.user_id)

        self.assertEqual("unavailable", summary.goal_review.status)
        self.assertIsNone(summary.goal_review.expense_change_cents)

    def test_contribution_can_be_created_edited_and_deleted(self) -> None:
        contribution = self.service.create_contribution(
            self.user_id,
            {
                "amount_cents": 5_000,
                "contribution_date": "2026-08-31",
                "note": "  Weekly save  ",
            },
        )
        updated = self.service.update_contribution(
            self.user_id,
            contribution.id,
            {"amount_cents": 7_500, "note": ""},
        )
        self.service.delete_contribution(self.user_id, contribution.id)

        self.assertEqual(7_500, updated.amount_cents)
        self.assertIsNone(updated.note)
        self.assertEqual(0, len(self.service.get_summary(self.user_id).contributions))

    def test_future_contribution_date_is_rejected(self) -> None:
        with self.assertRaises(DomainError) as raised:
            self.service.create_contribution(
                self.user_id,
                {"amount_cents": 5_000, "contribution_date": "2026-09-02"},
            )

        self.assertEqual("validation_error", raised.exception.code)
        self.assertIn("contribution_date", raised.exception.field_errors)

    def test_invalid_goal_and_unknown_fields_use_shared_error_shape(self) -> None:
        with self.assertRaises(DomainError) as raised:
            self.service.patch_plan(
                self.user_id,
                {"goal": {"mode": "coverage", "weeks": 0}, "extra": True},
            )

        error = raised.exception.as_dict()
        self.assertEqual({"code", "message", "field_errors"}, set(error))
        self.assertIn("extra", error["field_errors"])

    def test_other_user_cannot_edit_or_delete_contribution(self) -> None:
        contribution = self.service.create_contribution(
            self.user_id,
            {"amount_cents": 5_000, "contribution_date": "2026-09-01"},
        )

        with self.assertRaises(DomainError) as update_error:
            self.service.update_contribution(
                self.other_user_id, contribution.id, {"amount_cents": 10_000}
            )
        with self.assertRaises(DomainError) as delete_error:
            self.service.delete_contribution(self.other_user_id, contribution.id)

        self.assertEqual(404, update_error.exception.status_code)
        self.assertEqual(404, delete_error.exception.status_code)

    def test_withdrawal_reduces_progress_and_is_recorded_in_history(self) -> None:
        self.service.create_contribution(
            self.user_id,
            {"amount_cents": 10_000, "contribution_date": "2026-09-01"},
        )
        withdrawal = self.service.create_withdrawal(
            self.user_id,
            {
                "amount_cents": 3_000,
                "contribution_date": "2026-09-01",
                "note": "Urgent repair",
            },
        )

        summary = self.service.get_summary(self.user_id)

        self.assertEqual("withdrawal", withdrawal.entry_type)
        self.assertEqual(7_000, summary.progress.contribution_total_cents)

    def test_withdrawal_cannot_exceed_tracked_balance(self) -> None:
        self.service.create_contribution(
            self.user_id,
            {"amount_cents": 5_000, "contribution_date": "2026-09-01"},
        )

        with self.assertRaises(DomainError) as raised:
            self.service.create_withdrawal(
                self.user_id,
                {"amount_cents": 5_001, "contribution_date": "2026-09-01"},
            )

        self.assertEqual("insufficient_jar_balance", raised.exception.code)

    def test_deposit_cannot_be_deleted_when_withdrawal_depends_on_it(self) -> None:
        deposit = self.service.create_contribution(
            self.user_id,
            {"amount_cents": 5_000, "contribution_date": "2026-09-01"},
        )
        self.service.create_withdrawal(
            self.user_id,
            {"amount_cents": 3_000, "contribution_date": "2026-09-01"},
        )

        with self.assertRaises(DomainError) as raised:
            self.service.delete_contribution(self.user_id, deposit.id)

        self.assertEqual(409, raised.exception.status_code)


if __name__ == "__main__":
    unittest.main()
