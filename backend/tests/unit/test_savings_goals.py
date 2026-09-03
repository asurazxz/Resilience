"""Pure calculations behind a savings goal: saved, remaining, reached, weekly."""

from __future__ import annotations

import unittest
from datetime import date

from pydantic import ValidationError

from backend.app.features.savings_goals.schemas import (
    SavingsGoalContributionCreate,
    SavingsGoalCreate,
    SavingsGoalPatch,
)
from backend.app.features.savings_goals.service import suggested_weekly_cents, weeks_until

TODAY = date(2026, 9, 3)


class SuggestedWeeklyTests(unittest.TestCase):
    def test_no_target_date_means_no_suggestion(self) -> None:
        self.assertIsNone(suggested_weekly_cents(100_000, None, TODAY))

    def test_reached_goal_has_no_suggestion(self) -> None:
        self.assertIsNone(suggested_weekly_cents(0, date(2026, 12, 1), TODAY))

    def test_past_or_present_target_date_has_no_suggestion(self) -> None:
        self.assertIsNone(suggested_weekly_cents(100_000, date(2026, 8, 1), TODAY))
        self.assertIsNone(suggested_weekly_cents(100_000, TODAY, TODAY))

    def test_remaining_is_divided_over_whole_weeks_and_rounded_up(self) -> None:
        # 28 days ahead is exactly four weeks.
        self.assertEqual(4, weeks_until(date(2026, 10, 1), TODAY))
        self.assertEqual(25_000, suggested_weekly_cents(100_000, date(2026, 10, 1), TODAY))
        self.assertEqual(25_001, suggested_weekly_cents(100_001, date(2026, 10, 1), TODAY))

    def test_partial_week_counts_as_a_whole_week(self) -> None:
        self.assertEqual(1, weeks_until(date(2026, 9, 4), TODAY))
        self.assertEqual(2, weeks_until(date(2026, 9, 11), TODAY))
        self.assertEqual(50_000, suggested_weekly_cents(100_000, date(2026, 9, 11), TODAY))


class SchemaTests(unittest.TestCase):
    def test_goal_name_is_required_and_trimmed(self) -> None:
        goal = SavingsGoalCreate(name="  Laptop  ", targetCents=100_000)

        self.assertEqual("Laptop", goal.name)
        with self.assertRaises(ValidationError):
            SavingsGoalCreate(name="   ", targetCents=100_000)
        with self.assertRaises(ValidationError):
            SavingsGoalCreate(name="Laptop", targetCents=0)
        with self.assertRaises(ValidationError):
            SavingsGoalCreate(name="Laptop", targetCents=100_000_001)

    def test_patch_needs_at_least_one_field(self) -> None:
        with self.assertRaises(ValidationError):
            SavingsGoalPatch()
        self.assertEqual("archived", SavingsGoalPatch(status="archived").status)
        with self.assertRaises(ValidationError):
            SavingsGoalPatch(status="paused")

    def test_contribution_note_is_stripped_to_none_when_blank(self) -> None:
        contribution = SavingsGoalContributionCreate(
            amountCents=5_000, contributedOn="2026-09-01", note="   "
        )

        self.assertIsNone(contribution.note)
        with self.assertRaises(ValidationError):
            SavingsGoalContributionCreate(amountCents=0, contributedOn="2026-09-01")
        with self.assertRaises(ValidationError):
            SavingsGoalContributionCreate(amountCents=1, contributedOn="2026-09-01", note="x" * 201)


if __name__ == "__main__":
    unittest.main()
