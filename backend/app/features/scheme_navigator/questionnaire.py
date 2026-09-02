"""Derives the questionnaire shown to the user from the loaded rules.

The set of prompts is the union of fields referenced by every rule's
conditions, resolved against the field registry -- not a hand-maintained
form. Two rules that both need ``citizenship_status`` produce one prompt,
not two, and a new rule that reuses only existing fields changes nothing
here at all.
"""

from __future__ import annotations

from app.features.scheme_navigator.fields import FIELD_REGISTRY
from app.features.scheme_navigator.schemas import QuestionnaireField, SchemeRule

# Fields listed here are asked first, in this order, when present in the
# derived set; any remaining referenced fields follow in alphabetical order
# by key. This keeps the questionnaire ordering stable and predictable as
# rules are added, without hard-coding which schemes need them.
_PREFERRED_ORDER: tuple[str, ...] = (
    "citizenship_status",
    "age",
    "monthly_income",
    "household_income_per_capita",
    "experiencing_financial_hardship",
    "owns_more_than_one_property",
    "residence_annual_value",
    "spouse_annual_income",
)


def get_required_field_keys(rules: list[SchemeRule]) -> set[str]:
    return {condition.field for rule in rules for condition in rule.conditions}


def build_questionnaire(rules: list[SchemeRule]) -> list[QuestionnaireField]:
    required_keys = get_required_field_keys(rules)

    unknown_keys = required_keys - FIELD_REGISTRY.keys()
    if unknown_keys:
        raise KeyError(
            f"Rule references field(s) missing from FIELD_REGISTRY: {sorted(unknown_keys)}"
        )

    ordered_keys = [key for key in _PREFERRED_ORDER if key in required_keys]
    ordered_keys += sorted(required_keys - set(_PREFERRED_ORDER))

    return [FIELD_REGISTRY[key] for key in ordered_keys]
