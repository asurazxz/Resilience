from __future__ import annotations

from collections.abc import Iterator
from uuid import UUID

import pytest

from backend.app.core.auth import current_user_id
from backend.app.main import app

TEST_USER_ID = UUID("00000000-0000-4000-8000-000000000001")


@pytest.fixture(autouse=True)
def authenticated_main_app() -> Iterator[None]:
    """Keep HTTP-contract tests deterministic without contacting Supabase."""
    app.dependency_overrides[current_user_id] = lambda: TEST_USER_ID
    yield
    app.dependency_overrides.clear()
