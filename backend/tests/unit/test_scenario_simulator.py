"""Deterministic tests for the Scenario Simulator engine.

Written on unittest so they run with no third-party packages installed, and
still collect normally under pytest once Workstream 1 lands the backend
manifest.
"""

import unittest

from backend.app.features.scenario_simulator import (
    BaselineFinances,
    ShockScenario,
    project_weeks,
    result_to_dict,
    simulate,
)
from backend.app.features.scenario_simulator.engine import MAX_HORIZON_WEEKS

# A Singapore platform worker renting a vehicle: S$900 gross, S$150 fuel,
# S$250 rental, S$400 essentials, S$1,200 saved. Weekly surplus is S$100.
WORKER = BaselineFinances(
    weekly_gross_earnings_cents=90_000,
    weekly_variable_work_costs_cents=15_000,
    weekly_fixed_work_costs_cents=25_000,
    weekly_essential_expenses_cents=40_000,
    emergency_savings_cents=120_000,
)


def action_ids(result) -> list[str]:
    return [action.id for action in result.actions]


class BaselineTests(unittest.TestCase):
    def test_derives_net_work_income_and_surplus(self):
        self.assertEqual(WORKER.weekly_work_costs_cents, 40_000)
        self.assertEqual(WORKER.weekly_net_work_income_cents, 50_000)
        self.assertEqual(WORKER.weekly_surplus_cents, 10_000)

    def test_positive_surplus_has_no_baseline_runway(self):
        summary = simulate(WORKER, ShockScenario(0, 0)).baseline
        self.assertIsNone(summary.runway_weeks)
        self.assertEqual(summary.emergency_savings_weeks_of_essentials, 3)

    def test_negative_baseline_surplus_reports_finite_runway(self):
        short = BaselineFinances(
            weekly_gross_earnings_cents=50_000,
            weekly_variable_work_costs_cents=0,
            weekly_fixed_work_costs_cents=0,
            weekly_essential_expenses_cents=60_000,
            emergency_savings_cents=100_000,
        )
        result = simulate(short, ShockScenario(0, 0))
        self.assertEqual(result.baseline.weekly_surplus_cents, -10_000)
        self.assertEqual(result.baseline.runway_weeks, 10)
        self.assertIn("baseline-deficit", action_ids(result))

    def test_zero_essential_expenses_reports_no_weeks_of_cover(self):
        no_expenses = BaselineFinances(90_000, 15_000, 25_000, 0, 120_000)
        summary = simulate(no_expenses, ShockScenario(0, 0)).baseline
        self.assertIsNone(summary.emergency_savings_weeks_of_essentials)


class PartialIncomeTests(unittest.TestCase):
    def test_reduction_scales_gross_and_variable_costs_only(self):
        week = project_weeks(WORKER, ShockScenario(50, 4))[0]
        self.assertEqual(week.gross_earnings_cents, 45_000)
        # S$75 fuel scales with the work done; S$250 rental does not.
        self.assertEqual(week.work_costs_cents, 7_500 + 25_000)
        self.assertEqual(week.net_work_income_cents, 12_500)
        self.assertEqual(week.net_cash_flow_cents, -27_500)
        self.assertEqual(week.buffer_close_cents, 92_500)

    def test_zero_reduction_leaves_every_week_at_baseline(self):
        weeks = project_weeks(WORKER, ShockScenario(0, 0))
        for week in weeks:
            self.assertEqual(week.net_cash_flow_cents, WORKER.weekly_surplus_cents)
            self.assertEqual(week.gross_earnings_cents, 90_000)

    def test_full_time_off_stops_earnings_but_not_fixed_costs(self):
        result = simulate(WORKER, ShockScenario(100, 3))
        first = result.weeks[0]
        self.assertEqual(first.gross_earnings_cents, 0)
        self.assertEqual(first.work_costs_cents, 25_000)
        self.assertEqual(first.net_work_income_cents, -25_000)
        self.assertEqual(first.net_cash_flow_cents, -65_000)
        self.assertIn("fixed-work-costs-continue", action_ids(result))

    def test_only_affected_weeks_are_reduced(self):
        weeks = project_weeks(WORKER, ShockScenario(40, 2))
        self.assertEqual(weeks[1].gross_earnings_cents, 54_000)
        self.assertEqual(weeks[2].gross_earnings_cents, 90_000)


class BufferRunwayTests(unittest.TestCase):
    def test_runway_counts_full_weeks_before_shortfall(self):
        result = simulate(WORKER, ShockScenario(100, 3))
        # Week 1 leaves S$550; week 2 needs S$650, so money runs out in week 2.
        self.assertEqual(result.weeks[0].buffer_close_cents, 55_000)
        self.assertEqual(result.scenario.first_shortfall_week, 2)
        self.assertEqual(result.scenario.buffer_runway_weeks, 1)
        self.assertIn("buffer-runs-out-during-shock", action_ids(result))

    def test_no_buffer_reports_shortfall_from_week_one(self):
        broke = BaselineFinances(90_000, 15_000, 25_000, 40_000, 0)
        result = simulate(broke, ShockScenario(100, 2))
        self.assertEqual(result.scenario.first_shortfall_week, 1)
        self.assertEqual(result.scenario.buffer_runway_weeks, 0)
        self.assertEqual(result.weeks[0].shortfall_cents, 65_000)

    def test_buffer_is_never_reported_negative(self):
        broke = BaselineFinances(0, 0, 0, 40_000, 0)
        for week in project_weeks(broke, ShockScenario(100, 4)):
            self.assertGreaterEqual(week.buffer_close_cents, 0)

    def test_surviving_scenario_reports_no_shortfall(self):
        result = simulate(WORKER, ShockScenario(50, 4))
        self.assertTrue(result.scenario.buffer_holds_through_horizon)
        self.assertIsNone(result.scenario.first_shortfall_week)
        self.assertIsNone(result.scenario.buffer_runway_weeks)
        self.assertEqual(result.scenario.total_shortfall_cents, 0)
        self.assertEqual(result.scenario.lowest_buffer_cents, 10_000)
        self.assertEqual(result.scenario.lowest_buffer_week, 4)
        self.assertIn("buffer-holds", action_ids(result))

    def test_zero_cash_flow_holds_the_buffer_flat(self):
        break_even = BaselineFinances(80_000, 0, 0, 80_000, 50_000)
        result = simulate(break_even, ShockScenario(0, 0))
        self.assertEqual(result.baseline.weekly_surplus_cents, 0)
        for week in result.weeks:
            self.assertEqual(week.net_cash_flow_cents, 0)
            self.assertEqual(week.buffer_close_cents, 50_000)
        self.assertTrue(result.scenario.buffer_holds_through_horizon)

    def test_shortfall_after_shock_is_reported_separately(self):
        # Savings absorb the two reduced weeks, but the ongoing baseline
        # deficit empties the buffer later in the horizon.
        deficit = BaselineFinances(60_000, 10_000, 10_000, 45_000, 80_000)
        result = simulate(deficit, ShockScenario(50, 2))
        self.assertEqual(result.scenario.first_shortfall_week, 7)
        self.assertEqual(result.scenario.buffer_runway_weeks, 6)
        self.assertIn("buffer-runs-out-after-shock", action_ids(result))


class OneOffCostTests(unittest.TestCase):
    def test_cost_applies_only_in_week_one(self):
        weeks = project_weeks(WORKER, ShockScenario(0, 0, unexpected_cost_cents=50_000))
        self.assertEqual(weeks[0].one_off_cost_cents, 50_000)
        self.assertEqual(weeks[0].net_cash_flow_cents, -40_000)
        self.assertEqual(weeks[0].buffer_close_cents, 80_000)
        self.assertEqual(weeks[1].one_off_cost_cents, 0)
        self.assertEqual(weeks[1].buffer_close_cents, 90_000)

    def test_cost_larger_than_buffer_creates_immediate_shortfall(self):
        result = simulate(WORKER, ShockScenario(0, 0, unexpected_cost_cents=200_000))
        self.assertEqual(result.weeks[0].shortfall_cents, 70_000)
        self.assertEqual(result.scenario.buffer_runway_weeks, 0)
        self.assertEqual(result.scenario.total_shortfall_cents, 70_000)
        self.assertIn("one-off-cost-exceeds-buffer", action_ids(result))
        self.assertIn("check-support-schemes", action_ids(result))

    def test_shortfall_without_an_income_change_avoids_recovery_wording(self):
        result = simulate(WORKER, ShockScenario(0, 0, unexpected_cost_cents=200_000))
        ids = action_ids(result)
        self.assertIn("savings-run-out-without-income-change", ids)
        self.assertNotIn("buffer-runs-out-after-shock", ids)
        self.assertNotIn("buffer-runs-out-during-shock", ids)
        joined = " ".join(action.detail for action in result.actions).lower()
        self.assertNotIn("recover", joined)
        self.assertNotIn("disruption", joined)

    def test_recurring_weekly_cash_flow_excludes_the_one_off_cost(self):
        result = simulate(WORKER, ShockScenario(50, 4, unexpected_cost_cents=30_000))
        self.assertEqual(result.scenario.weekly_net_cash_flow_during_shock_cents, -27_500)
        self.assertEqual(result.scenario.unexpected_cost_cents, 30_000)


class RecoveryTests(unittest.TestCase):
    def test_income_ramps_linearly_back_to_baseline(self):
        weeks = project_weeks(WORKER, ShockScenario(50, 2, recovery_weeks=2))
        self.assertEqual(weeks[1].gross_earnings_cents, 45_000)
        self.assertEqual(weeks[2].gross_earnings_cents, 60_000)
        self.assertEqual(weeks[3].gross_earnings_cents, 75_000)
        self.assertEqual(weeks[4].gross_earnings_cents, 90_000)

    def test_variable_costs_ramp_with_income(self):
        weeks = project_weeks(WORKER, ShockScenario(50, 2, recovery_weeks=2))
        self.assertEqual(weeks[2].work_costs_cents, 10_000 + 25_000)
        self.assertEqual(weeks[2].net_work_income_cents, 25_000)

    def test_full_income_resume_week_is_reported(self):
        result = simulate(WORKER, ShockScenario(50, 2, recovery_weeks=2))
        self.assertEqual(result.scenario.full_income_resumes_week, 5)

    def test_recovery_without_affected_weeks_leaves_earnings_untouched(self):
        # "For: 0 weeks" means nothing was disrupted, so a recovery period has
        # nothing to climb back from and must not reduce earnings.
        weeks = project_weeks(WORKER, ShockScenario(50, 0, recovery_weeks=3))
        for week in weeks:
            self.assertEqual(week.gross_earnings_cents, 90_000)
            self.assertEqual(week.net_cash_flow_cents, WORKER.weekly_surplus_cents)

    def test_no_resume_week_without_a_shock(self):
        result = simulate(WORKER, ShockScenario(0, 0))
        self.assertIsNone(result.scenario.full_income_resumes_week)

    def test_recovery_extends_the_default_horizon(self):
        result = simulate(WORKER, ShockScenario(50, 20, recovery_weeks=6))
        self.assertEqual(result.scenario.horizon_weeks, 30)


class HorizonTests(unittest.TestCase):
    def test_short_shock_still_projects_a_minimum_horizon(self):
        self.assertEqual(len(project_weeks(WORKER, ShockScenario(50, 1))), 8)

    def test_horizon_is_capped(self):
        weeks = project_weeks(WORKER, ShockScenario(50, 2, horizon_weeks=60))
        self.assertEqual(len(weeks), MAX_HORIZON_WEEKS)

    def test_explicit_horizon_is_respected(self):
        weeks = project_weeks(WORKER, ShockScenario(50, 2, horizon_weeks=3))
        self.assertEqual(len(weeks), 3)


class ValidationTests(unittest.TestCase):
    def test_reduction_outside_zero_to_one_hundred_is_rejected(self):
        for percent in (-1, 101):
            with self.assertRaises(ValueError):
                ShockScenario(percent, 2)

    def test_negative_amounts_are_rejected(self):
        with self.assertRaises(ValueError):
            BaselineFinances(-1, 0, 0, 0, 0)
        with self.assertRaises(ValueError):
            ShockScenario(50, 2, unexpected_cost_cents=-1)
        with self.assertRaises(ValueError):
            ShockScenario(50, -2)

    def test_horizon_below_one_week_is_rejected(self):
        with self.assertRaises(ValueError):
            ShockScenario(50, 2, horizon_weeks=0)


class ResultContractTests(unittest.TestCase):
    def test_every_monetary_field_is_a_whole_number_of_cents(self):
        result = simulate(
            WORKER, ShockScenario(37, 5, unexpected_cost_cents=12_345, recovery_weeks=3)
        )
        for week in result.weeks:
            for value in vars(week).values():
                self.assertIsInstance(value, int)

    def test_the_same_scenario_always_produces_the_same_result(self):
        scenario = ShockScenario(63, 7, unexpected_cost_cents=98_765, recovery_weeks=4)
        self.assertEqual(simulate(WORKER, scenario), simulate(WORKER, scenario))

    def test_results_always_carry_estimate_disclaimers(self):
        result = simulate(WORKER, ShockScenario(50, 4))
        self.assertTrue(result.disclaimers)
        joined = " ".join(result.disclaimers).lower()
        self.assertIn("estimate", joined)
        self.assertIn("not a prediction", joined)
        self.assertIn("does not provide financial advice", joined)

    def test_referenced_resources_are_returned_once_each_with_review_dates(self):
        result = simulate(WORKER, ShockScenario(100, 6))
        ids = [resource.id for resource in result.resources]
        self.assertTrue(ids)
        self.assertEqual(len(ids), len(set(ids)))
        for resource in result.resources:
            self.assertTrue(resource.url.startswith("https://"))
            self.assertTrue(resource.last_reviewed)
        referenced = {rid for action in result.actions for rid in action.resource_ids}
        self.assertEqual(set(ids), referenced)

    def test_result_serialises_to_plain_json_types(self):
        import json

        payload = result_to_dict(simulate(WORKER, ShockScenario(50, 4)))
        self.assertIsInstance(payload["weeks"], list)
        self.assertEqual(json.loads(json.dumps(payload)), payload)


class TransportContractTests(unittest.TestCase):
    """Guard the response schemas against engine drift.

    The schemas import pydantic, which is not installed until the backend
    manifest lands, so the field names are compared by parsing the source.
    """

    def _declared_fields(self) -> dict[str, set[str]]:
        import ast
        import pathlib

        source = (
            pathlib.Path(__file__).parents[2]
            / "app"
            / "features"
            / "scenario_simulator"
            / "schemas.py"
        )
        tree = ast.parse(source.read_text())
        return {
            node.name: {
                statement.target.id
                for statement in node.body
                if isinstance(statement, ast.AnnAssign)
            }
            for node in tree.body
            if isinstance(node, ast.ClassDef)
        }

    def test_response_schemas_match_engine_output(self):
        declared = self._declared_fields()
        payload = result_to_dict(
            simulate(WORKER, ShockScenario(50, 4, unexpected_cost_cents=30_000, recovery_weeks=2))
        )
        for schema_name, produced in (
            ("BaselineSummaryResponse", payload["baseline"]),
            ("ScenarioSummaryResponse", payload["scenario"]),
            ("WeekProjectionResponse", payload["weeks"][0]),
            ("PreparatoryActionResponse", payload["actions"][0]),
            ("OfficialResourceResponse", payload["resources"][0]),
        ):
            self.assertEqual(declared[schema_name], set(produced), schema_name)

    def test_request_schema_matches_engine_inputs(self):
        declared = self._declared_fields()
        self.assertEqual(declared["BaselineFinancesPayload"], set(vars(WORKER)))
        self.assertEqual(declared["ShockScenarioPayload"], set(vars(ShockScenario(50, 4))))


if __name__ == "__main__":
    unittest.main()
