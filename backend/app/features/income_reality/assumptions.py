"""Editable default assumptions for the Income Reality Engine.

These are prototype estimates for a one-week hackathon build, not statutory
figures. They exist as plain, editable data so callers (API requests, tests,
a future UI control) can override them per the "editable assumptions"
requirement in documentation/initial-scaffold.md - none of the formulas in
engine.py hardcode these values.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class IncomeAssumptions:
    apply_cpf: bool = False
    # Flat contribution rate standing in for CPF/MediSave self-employed
    # contributions, expressed in basis points (1/100 of a percent).
    # This is NOT the real statutory schedule, which depends on age band
    # and Net Trade Income - it is a simplified, editable estimate only.
    cpf_rate_bps: int = 800  # 8.00%


DEFAULT_ASSUMPTIONS = IncomeAssumptions()
