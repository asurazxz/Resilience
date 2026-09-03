from __future__ import annotations

from .models import (
    CompletionProjection,
    Contribution,
    Goal,
    GoalReview,
    JarPlan,
    JarSummary,
    Milestone,
    Progress,
    Recommendation,
)


def goal_dict(goal: Goal) -> dict[str, object]:
    if goal.mode == "amount":
        return {"mode": "amount", "amount_cents": goal.amount_cents}
    return {"mode": "coverage", "weeks": goal.weeks}


def plan_dict(plan: JarPlan) -> dict[str, object]:
    return {
        "recommendation_method": plan.recommendation_method.value,
        "target_frequency": plan.target_frequency.value,
        "target_amount_cents": plan.target_amount_cents,
        "weekly_target_cents": plan.weekly_target_cents,
        "status": plan.status.value,
        "goal": goal_dict(plan.goal),
        "goal_expense_baseline_cents": plan.goal_expense_baseline_cents,
        "updated_at": plan.updated_at.isoformat() if plan.updated_at else None,
    }


def recommendation_dict(recommendation: Recommendation) -> dict[str, object]:
    return {
        "status": recommendation.status,
        "method": recommendation.method.value,
        "amount_cents": recommendation.amount_cents,
        "latest_surplus_cents": recommendation.latest_surplus_cents,
        "history_weeks_used": recommendation.history_weeks_used,
        "as_of_week_start": (
            recommendation.as_of_week_start.isoformat() if recommendation.as_of_week_start else None
        ),
        "rationale_code": recommendation.rationale_code,
    }


def progress_dict(progress: Progress) -> dict[str, object]:
    return {
        "contribution_total_cents": progress.contribution_total_cents,
        "goal_target_cents": progress.goal_target_cents,
        "progress_percent": progress.progress_percent,
        "coverage_days": progress.coverage_days,
        "coverage_weeks": progress.coverage_weeks,
        "goal_reached": progress.goal_reached,
        "remaining_cents": progress.remaining_cents,
    }


def contribution_dict(contribution: Contribution) -> dict[str, object]:
    return {
        "id": contribution.id,
        "entry_type": contribution.entry_type,
        "amount_cents": contribution.amount_cents,
        "contribution_date": contribution.contribution_date.isoformat(),
        "note": contribution.note,
        "created_at": contribution.created_at.isoformat(),
        "updated_at": contribution.updated_at.isoformat(),
    }


def goal_review_dict(goal_review: GoalReview) -> dict[str, object]:
    return {
        "status": goal_review.status,
        "previous_weekly_expenses_cents": (goal_review.previous_weekly_expenses_cents),
        "current_weekly_expenses_cents": goal_review.current_weekly_expenses_cents,
        "expense_change_cents": goal_review.expense_change_cents,
    }


def completion_projection_dict(
    projection: CompletionProjection,
) -> dict[str, object]:
    return {
        "status": projection.status,
        "projected_date": (
            projection.projected_date.isoformat() if projection.projected_date else None
        ),
        "weeks_remaining": projection.weeks_remaining,
        "remaining_cents": projection.remaining_cents,
    }


def milestone_dict(milestone: Milestone) -> dict[str, object]:
    return {
        "percentage": milestone.percentage,
        "target_cents": milestone.target_cents,
        "reached": milestone.reached,
    }


def summary_dict(summary: JarSummary) -> dict[str, object]:
    return {
        "plan": plan_dict(summary.plan),
        "recommendation": recommendation_dict(summary.recommendation),
        "progress": progress_dict(summary.progress),
        "goal_review": goal_review_dict(summary.goal_review),
        "completion_projection": completion_projection_dict(summary.completion_projection),
        "milestones": [milestone_dict(item) for item in summary.milestones],
        "weekly_essential_expenses_cents": (summary.weekly_essential_expenses_cents),
        "contributions": [
            contribution_dict(contribution) for contribution in summary.contributions
        ],
    }
