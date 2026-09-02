"""Convert scenario results into plain JSON-compatible structures."""

from dataclasses import asdict

from .models import ScenarioResult


def _to_plain(value: object) -> object:
    if isinstance(value, dict):
        return {key: _to_plain(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_to_plain(item) for item in value]
    return value


def result_to_dict(result: ScenarioResult) -> dict:
    """Return the result as nested dicts and lists, ready for JSON encoding."""
    return _to_plain(asdict(result))  # type: ignore[return-value]
