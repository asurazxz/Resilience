"""The one place emergency-fund money is defined.

``documentation/features/emergency-fund-model.md`` is the specification. Every
feature that needs the balance, the weekly essential expenses, or the weekly
recurring work costs calls into this module so the numbers cannot drift apart.
Each function is a single SQL aggregate; none of them loads rows into Python.
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from backend.app.db.models import (
    EmergencyFundContribution,
    EssentialExpense,
    Profile,
    RecurringWorkCost,
)


def emergency_fund_balance(session: Session, user_id: UUID) -> int:
    """``B = O + D - W`` for the user, or 0 when there is no profile row."""
    net_activity = (
        select(
            func.coalesce(
                func.sum(
                    case(
                        (
                            EmergencyFundContribution.entry_type == "deposit",
                            EmergencyFundContribution.amount_cents,
                        ),
                        else_=-EmergencyFundContribution.amount_cents,
                    )
                ),
                0,
            )
        )
        .where(EmergencyFundContribution.user_id == user_id)
        .scalar_subquery()
    )
    balance = session.scalar(
        select(Profile.latest_emergency_savings_cents + net_activity).where(Profile.id == user_id)
    )
    return int(balance) if balance is not None else 0


def emergency_fund_net_activity_cents(session: Session, user_id: UUID) -> int:
    """``N = D - W``: the ledger's own movement, excluding the opening balance."""
    net_activity = session.scalar(
        select(
            func.coalesce(
                func.sum(
                    case(
                        (
                            EmergencyFundContribution.entry_type == "deposit",
                            EmergencyFundContribution.amount_cents,
                        ),
                        else_=-EmergencyFundContribution.amount_cents,
                    )
                ),
                0,
            )
        ).where(EmergencyFundContribution.user_id == user_id)
    )
    return int(net_activity or 0)


def weekly_essential_expenses_cents(session: Session, user_id: UUID) -> int | None:
    """``E``: active essential expenses only, weekly-normalised.

    Recurring work costs are deliberately excluded — the fund covers weeks the
    user cannot work, so work costs are not what it has to replace. ``None``
    means the user has recorded no active essential expense at all, which is
    different from having essentials that total zero.
    """
    total = session.scalar(
        select(func.sum(_weekly_cents(EssentialExpense))).where(
            EssentialExpense.user_id == user_id, EssentialExpense.is_active.is_(True)
        )
    )
    return int(total) if total is not None else None


def weekly_recurring_work_costs_cents(session: Session, user_id: UUID) -> int:
    """``R``: active recurring work costs, weekly-normalised, 0 when there are none."""
    total = session.scalar(
        select(func.coalesce(func.sum(_weekly_cents(RecurringWorkCost)), 0)).where(
            RecurringWorkCost.user_id == user_id, RecurringWorkCost.is_active.is_(True)
        )
    )
    return int(total or 0)


def _weekly_cents(
    model: type[EssentialExpense] | type[RecurringWorkCost],
) -> ColumnElement[int]:
    """Weekly-normalised amount for one row: monthly amounts become ``* 12 // 52``."""
    return case(
        (model.cadence == "weekly", model.amount_cents),
        else_=model.amount_cents * 12 / 52,
    )
