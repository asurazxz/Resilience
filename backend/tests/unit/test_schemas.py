from uuid import uuid4

import pytest
from backend.app.features.foundation_input.schemas import EarningInput, WeeklyEntryUpsert
from pydantic import ValidationError


def test_other_platform_requires_label() -> None:
    with pytest.raises(ValidationError):
        EarningInput(id=uuid4(), platformCode="other", amountCents=100)


def test_no_income_week_cannot_contain_earnings() -> None:
    with pytest.raises(ValidationError):
        WeeklyEntryUpsert(
            id=uuid4(),
            hadNoIncome=True,
            emergencySavingsCents=0,
            earnings=[{"id": str(uuid4()), "platformCode": "grab", "amountCents": 0}],
        )


def test_zero_income_week_is_valid() -> None:
    payload = WeeklyEntryUpsert(id=uuid4(), hadNoIncome=True, emergencySavingsCents=0, earnings=[])
    assert payload.had_no_income is True
