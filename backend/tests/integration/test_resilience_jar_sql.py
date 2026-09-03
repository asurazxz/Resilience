"""The SQL adapters and the jar HTTP routes against the real database."""

from __future__ import annotations

from datetime import timedelta
from uuid import uuid4

from sqlalchemy import text

from backend.app.db.models import (
    EmergencyFundPlan,
    EssentialExpense,
    RecurringWorkCost,
    Transaction,
)
from backend.app.features.resilience_jar.models import (
    DEFAULT_COVERAGE_WEEKS,
    CoverageGoal,
    JarPlan,
    PlanStatus,
    RecommendationMethod,
    TargetFrequency,
)
from backend.app.features.resilience_jar.sql_repositories import (
    SqlContributionRepository,
    SqlFinancialContextRepository,
    SqlPlanRepository,
)
from backend.tests.integration.db_support import (
    last_monday,
    requires_database,
    singapore_today,
    throwaway_session,
    throwaway_user,
)

pytestmark = requires_database


def test_plan_repository_round_trips_a_plan() -> None:
    with throwaway_session() as (session, user_id):
        repository = SqlPlanRepository(session)
        assert repository.get(str(user_id)) is None

        saved = repository.save(
            JarPlan(
                user_id=str(user_id),
                recommendation_method=RecommendationMethod.LATEST_WEEK,
                target_frequency=TargetFrequency.MONTHLY,
                target_amount_cents=39_000,
                weekly_target_cents=9_000,
                status=PlanStatus.PAUSED,
                goal=CoverageGoal(weeks=26),
                goal_expense_baseline_cents=30_461,
            )
        )
        reloaded = repository.get(str(user_id))

        assert saved == reloaded
        assert reloaded is not None
        assert reloaded.goal.weeks == 26
        assert reloaded.status is PlanStatus.PAUSED


def test_plan_repository_defaults_a_missing_goal_to_twenty_six_weeks() -> None:
    with throwaway_session() as (session, user_id):
        repository = SqlPlanRepository(session)
        repository.save(JarPlan(user_id=str(user_id)))

        plan = repository.get(str(user_id))

        assert plan is not None
        assert plan.goal.weeks == 26


def test_migration_upgrades_a_row_still_holding_the_old_four_week_default() -> None:
    """20260903210000_emergency_fund_default_six_months.sql already ran against

    this database, so any row that predates it and still held the shipped
    four-week default has been rewritten to twenty-six weeks. This inserts a
    row directly with the old default (bypassing the application, which
    always writes ``DEFAULT_COVERAGE_WEEKS``) and re-runs the migration's own
    update statement to prove it upgrades such a row, then confirms the
    repository reports the six-month goal.
    """
    with throwaway_session() as (session, user_id):
        session.add(
            EmergencyFundPlan(
                user_id=user_id,
                goal_mode="coverage",
                goal_weeks=4,
            )
        )
        session.commit()

        session.execute(
            text(
                "update resilience.emergency_fund_plans"
                "   set goal_weeks = 26"
                " where goal_mode = 'coverage' and goal_weeks = 4"
                "   and user_id = :user_id"
            ),
            {"user_id": user_id},
        )
        session.commit()

        plan = SqlPlanRepository(session).get(str(user_id))

        assert plan is not None
        assert plan.goal.weeks == DEFAULT_COVERAGE_WEEKS == 26


def test_contribution_repository_round_trips_and_scopes_by_user() -> None:
    with throwaway_session() as (session, user_id):
        repository = SqlContributionRepository(session)
        created = repository.create(str(user_id), "deposit", 5_000, singapore_today(), "  keep  ")

        assert repository.get(str(user_id), created.id) == created
        assert repository.get(str(uuid4()), created.id) is None
        assert [item.id for item in repository.list_for_user(str(user_id))] == [created.id]

        updated = repository.update(
            str(user_id), created.id, "deposit", 7_500, singapore_today(), None
        )
        assert updated is not None
        assert updated.amount_cents == 7_500
        assert updated.note is None
        stranger = repository.update(
            str(uuid4()), created.id, "deposit", 1, singapore_today(), None
        )
        assert stranger is None

        assert repository.delete(str(uuid4()), created.id) is False
        assert repository.delete(str(user_id), created.id) is True
        assert repository.list_for_user(str(user_id)) == []


def test_weekly_surplus_deducts_variable_costs_recurring_and_essentials() -> None:
    with throwaway_session() as (session, user_id):
        week_start = last_monday()
        for entry_type, amount, day in (
            ("income", 120_000, 0),
            ("income", 30_000, 2),
            ("cost", 20_000, 3),
        ):
            session.add(
                Transaction(
                    id=uuid4(),
                    user_id=user_id,
                    entry_type=entry_type,
                    amount_cents=amount,
                    occurred_on=week_start + timedelta(days=day),
                )
            )
        session.add(
            EssentialExpense(
                id=uuid4(),
                user_id=user_id,
                category="food",
                label="Food",
                amount_cents=12_000,
                cadence="weekly",
                is_active=True,
            )
        )
        session.add(
            RecurringWorkCost(
                id=uuid4(),
                user_id=user_id,
                category="vehicle_rental",
                label="Van",
                amount_cents=30_000,
                cadence="weekly",
                is_active=True,
            )
        )
        session.commit()

        context = SqlFinancialContextRepository(session)
        surpluses = context.list_completed_weekly_surpluses(str(user_id))

        # 150_000 income - 20_000 costs - 30_000 recurring - 12_000 essentials.
        assert [(item.week_start, item.available_surplus_cents) for item in surpluses] == [
            (week_start, 88_000)
        ]
        # E excludes the work cost.
        assert context.get_weekly_essential_expenses_cents(str(user_id)) == 12_000


def test_financial_context_balance_and_opening_balance_reconciliation() -> None:
    with throwaway_session() as (session, user_id):
        context = SqlFinancialContextRepository(session)
        contributions = SqlContributionRepository(session)
        contributions.create(str(user_id), "deposit", 5_000, singapore_today(), None)

        assert context.get_emergency_fund_balance_cents(str(user_id)) == 5_000

        context.set_emergency_fund_balance_cents(str(user_id), 105_000)

        assert context.get_emergency_fund_balance_cents(str(user_id)) == 105_000
        contributions.create(str(user_id), "withdrawal", 5_000, singapore_today(), None)
        assert context.get_emergency_fund_balance_cents(str(user_id)) == 100_000


def test_jar_routes_walk_the_real_sql_path() -> None:
    with throwaway_user() as (client, _user_id):
        today = singapore_today().isoformat()
        summary = client.get("/api/v1/resilience-jar/summary")
        assert summary.status_code == 200, summary.text
        body = summary.json()
        assert body["plan"]["goal"] == {"mode": "coverage", "weeks": 26}
        assert body["progress"]["contribution_total_cents"] == 0
        assert body["progress"]["goal_reached"] is False
        assert body["progress"]["remaining_cents"] is None

        opened = client.put(
            "/api/v1/resilience-jar/opening-balance", json={"amount_cents": 100_000}
        )
        assert opened.json()["progress"]["contribution_total_cents"] == 100_000

        deposit = client.post(
            "/api/v1/resilience-jar/contributions",
            json={"amount_cents": 5_000, "contribution_date": today, "note": "Payday"},
        )
        assert deposit.status_code == 201, deposit.text
        assert (
            client.get("/api/v1/resilience-jar/summary").json()["progress"][
                "contribution_total_cents"
            ]
            == 105_000
        )

        too_big = client.post(
            "/api/v1/resilience-jar/withdrawals",
            json={"amount_cents": 105_001, "contribution_date": today},
        )
        assert too_big.status_code == 400
        assert too_big.json()["error"]["code"] == "insufficient_jar_balance"
        assert too_big.json()["error"]["requestId"]

        client.post(
            "/api/v1/resilience-jar/withdrawals",
            json={"amount_cents": 105_000, "contribution_date": today},
        )
        blocked_delete = client.delete(
            f"/api/v1/resilience-jar/contributions/{deposit.json()['id']}"
        )
        assert blocked_delete.status_code == 409
        assert blocked_delete.json()["error"]["code"] == "insufficient_jar_balance"


def test_jar_contributions_are_not_visible_to_another_user() -> None:
    with throwaway_user() as (client, _user_id):
        created = client.post(
            "/api/v1/resilience-jar/contributions",
            json={"amount_cents": 5_000, "contribution_date": singapore_today().isoformat()},
        )
        contribution_id = created.json()["id"]

        with throwaway_user() as (other_client, _other_id):
            patched = other_client.patch(
                f"/api/v1/resilience-jar/contributions/{contribution_id}",
                json={"amount_cents": 1_000},
            )
            deleted = other_client.delete(f"/api/v1/resilience-jar/contributions/{contribution_id}")

            assert patched.status_code == 404
            assert deleted.status_code == 404
            assert other_client.get("/api/v1/resilience-jar/summary").json()["contributions"] == []
