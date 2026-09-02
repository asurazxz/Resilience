"""Registry of every questionnaire field a scheme rule can reference.

A rule's ``conditions`` list refers to fields by key only. The questionnaire
shown to the user is the union of keys actually referenced by the loaded
rules (see ``questionnaire.py``), resolved against this registry. Adding a
new scheme that reuses an existing field (e.g. ``citizenship_status``) does
not add a new prompt; adding a scheme that needs a genuinely new fact adds
exactly one new prompt, here.
"""

from __future__ import annotations

from .schemas import QuestionnaireField, SelectOption

FIELD_REGISTRY: dict[str, QuestionnaireField] = {
    "citizenship_status": QuestionnaireField(
        key="citizenship_status",
        label="What is your residency status?",
        field_type="select",
        options=[
            SelectOption(value="singapore_citizen", label="Singapore Citizen"),
            SelectOption(value="permanent_resident", label="Permanent Resident"),
            SelectOption(value="other", label="Other / work pass holder"),
        ],
    ),
    "age": QuestionnaireField(
        key="age",
        label="What is your age?",
        field_type="number",
        unit="years",
        min_value=0,
        max_value=120,
    ),
    "monthly_income": QuestionnaireField(
        key="monthly_income",
        label="What is your average gross monthly income from work?",
        field_type="number",
        unit="SGD",
        help_text="Include all platform earnings before deductions.",
        min_value=0,
    ),
    "owns_more_than_one_property": QuestionnaireField(
        key="owns_more_than_one_property",
        label="Do you own more than one property?",
        field_type="boolean",
    ),
    "residence_annual_value": QuestionnaireField(
        key="residence_annual_value",
        label="What is the annual value of your residence?",
        field_type="number",
        unit="SGD",
        help_text="Shown on your property tax bill. Enter 0 if you do not know it.",
        min_value=0,
    ),
    "spouse_annual_income": QuestionnaireField(
        key="spouse_annual_income",
        label="What is your spouse's assessable annual income?",
        field_type="number",
        unit="SGD",
        help_text="Enter 0 if you are not married.",
        min_value=0,
    ),
    "household_income_per_capita": QuestionnaireField(
        key="household_income_per_capita",
        label="What is your household income per household member?",
        field_type="number",
        unit="SGD per month",
        help_text="Total household income divided by number of household members.",
        min_value=0,
    ),
    "experiencing_financial_hardship": QuestionnaireField(
        key="experiencing_financial_hardship",
        label="Are you currently facing a loss of income or financial hardship?",
        field_type="boolean",
    ),
}
