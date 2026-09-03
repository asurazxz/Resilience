"""Helpers for tests that talk to the real database.

Every test gets its own throwaway profile id so runs never collide, and the
profile row is deleted afterwards. Everything user-owned cascades from it.
"""

from __future__ import annotations

import os
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import date, datetime, timedelta
from uuid import UUID, uuid4
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.core.auth import current_user_id
from backend.app.db.models import Profile
from backend.app.db.session import get_engine
from backend.app.main import app

requires_database = pytest.mark.skipif(
    os.getenv("RUN_DATABASE_TESTS") != "1",
    reason="set RUN_DATABASE_TESTS=1 with local Supabase running",
)


def singapore_today() -> date:
    return datetime.now(ZoneInfo("Asia/Singapore")).date()


def last_monday(weeks_ago: int = 1) -> date:
    today = singapore_today()
    return today - timedelta(days=today.weekday() + 7 * weeks_ago)


def delete_profile(user_id: UUID) -> None:
    with Session(get_engine()) as session:
        profile = session.get(Profile, user_id)
        if profile is not None:
            session.delete(profile)
            session.commit()


@contextmanager
def throwaway_user() -> Iterator[tuple[TestClient, UUID]]:
    """A client authenticated as a fresh user, cleaned up on exit."""
    user_id = uuid4()
    previous = app.dependency_overrides.get(current_user_id)
    app.dependency_overrides[current_user_id] = lambda: user_id
    try:
        yield TestClient(app), user_id
    finally:
        # Restore rather than clear, so these nest.
        if previous is None:
            app.dependency_overrides.pop(current_user_id, None)
        else:
            app.dependency_overrides[current_user_id] = previous
        delete_profile(user_id)


@contextmanager
def throwaway_session() -> Iterator[tuple[Session, UUID]]:
    """A session plus a fresh profile row, for testing repositories directly."""
    user_id = uuid4()
    with Session(get_engine()) as session:
        session.add(Profile(id=user_id))
        session.commit()
        try:
            yield session, user_id
        finally:
            session.rollback()
            delete_profile(user_id)
