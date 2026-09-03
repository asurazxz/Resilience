"""Pure, framework-free spreading of a ranged transaction across calendar days.

Mirrors ``transactionDailyAmounts`` in
``frontend/src/features/income-reality/foundationAdapter.ts`` exactly: the
amount is divided evenly across the inclusive day range, with any remainder
cents landing on the earliest days. Both implementations are checked against
the shared fixture ``contracts/fixtures/transaction-week-split.json``.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta


def daily_amounts(
    amount_cents: int, occurred_on: date, occurred_until: date | None
) -> list[tuple[date, int]]:
    """Split ``amount_cents`` evenly across the inclusive day range.

    Effective end is ``occurred_until`` when it is not ``None`` and is on or
    after ``occurred_on``, otherwise ``occurred_on`` (a single day). The
    remainder from integer division lands, one cent each, on the earliest
    days. The returned amounts always sum exactly to ``amount_cents``.
    """
    end = (
        occurred_until
        if occurred_until is not None and occurred_until >= occurred_on
        else occurred_on
    )
    days = (end - occurred_on).days + 1
    base = amount_cents // days
    remainder = amount_cents % days
    return [
        (occurred_on + timedelta(days=i), base + (1 if i < remainder else 0)) for i in range(days)
    ]


def weekly_amounts(
    amount_cents: int, occurred_on: date, occurred_until: date | None
) -> dict[date, int]:
    """Aggregate :func:`daily_amounts` onto the Monday of each day's ISO week."""
    totals: dict[date, int] = defaultdict(int)
    for day, cents in daily_amounts(amount_cents, occurred_on, occurred_until):
        monday = day - timedelta(days=day.weekday())
        totals[monday] += cents
    return dict(totals)
