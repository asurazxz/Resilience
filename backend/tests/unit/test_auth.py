"""Local verification of Supabase access tokens.

Local Supabase signs with HS256: ``supabase/config.toml`` sets no
``signing_keys_path``, so ``supabase status`` reports a shared ``JWT_SECRET``
rather than a JWKS keypair. These tests mint HS256 tokens with a test secret
and exercise the same code path production uses for symmetric tokens.
"""

from __future__ import annotations

import asyncio
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from backend.app.core import auth
from backend.app.core.auth import current_user_id, delete_auth_user
from backend.app.core.settings import Settings, get_settings

SECRET = "test-jwt-secret-with-at-least-32-characters"
SUPABASE_URL = "http://127.0.0.1:54321"
ISSUER = f"{SUPABASE_URL}/auth/v1"
SUBJECT = "8f14e45f-ceea-4d1e-8b2c-2c0f0f1a2b3c"


@pytest.fixture
def settings(monkeypatch: pytest.MonkeyPatch) -> Iterator[Settings]:
    monkeypatch.setenv("SUPABASE_URL", SUPABASE_URL)
    monkeypatch.setenv("SUPABASE_JWT_SECRET", SECRET)
    monkeypatch.setenv("SUPABASE_JWT_AUDIENCE", "authenticated")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "")
    get_settings.cache_clear()
    yield get_settings()
    get_settings.cache_clear()


def mint(
    *,
    subject: str = SUBJECT,
    audience: str = "authenticated",
    issuer: str = ISSUER,
    expires_in: timedelta = timedelta(minutes=30),
    secret: str = SECRET,
) -> str:
    now = datetime.now(UTC)
    return jwt.encode(
        {
            "sub": subject,
            "aud": audience,
            "iss": issuer,
            "iat": int(now.timestamp()),
            "exp": int((now + expires_in).timestamp()),
        },
        secret,
        algorithm="HS256",
    )


def resolve(token: str | None, settings: Settings) -> UUID:
    credentials = (
        HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        if token is not None
        else None
    )
    return asyncio.run(current_user_id(credentials, settings))


def test_valid_token_returns_the_subject(settings: Settings) -> None:
    assert resolve(mint(), settings) == UUID(SUBJECT)


@pytest.mark.parametrize(
    ("label", "token"),
    [
        ("expired", mint(expires_in=timedelta(minutes=-5))),
        ("wrong audience", mint(audience="anon")),
        ("wrong issuer", mint(issuer="https://evil.example.com/auth/v1")),
        ("wrong secret", mint(secret="a-different-secret-entirely-000000")),
        ("garbage", "not-a-token"),
        ("empty", ""),
    ],
)
def test_unusable_tokens_are_unauthenticated(
    label: str, token: str, settings: Settings
) -> None:
    with pytest.raises(HTTPException) as raised:
        resolve(token, settings)

    assert raised.value.status_code == 401, label


def test_missing_header_is_unauthenticated(settings: Settings) -> None:
    with pytest.raises(HTTPException) as raised:
        resolve(None, settings)

    assert raised.value.status_code == 401


def test_non_uuid_subject_is_unauthenticated(settings: Settings) -> None:
    with pytest.raises(HTTPException) as raised:
        resolve(mint(subject="not-a-uuid"), settings)

    assert raised.value.status_code == 401


def test_unconfigured_supabase_url_is_service_unavailable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("SUPABASE_URL", "")
    get_settings.cache_clear()
    try:
        with pytest.raises(HTTPException) as raised:
            resolve(mint(), get_settings())
        assert raised.value.status_code == 503
    finally:
        get_settings.cache_clear()


def test_delete_auth_user_uses_the_server_only_service_role_key(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class Response:
        status_code = 204

    class Client:
        url = ""
        headers: dict[str, str] = {}

        async def delete(self, url: str, *, headers: dict[str, str]) -> Response:
            self.url = url
            self.headers = headers
            return Response()

    client = Client()
    monkeypatch.setattr(auth, "_get_http_client", lambda: client)
    settings = Settings(
        supabase_url=SUPABASE_URL,
        supabase_service_role_key="server-only-key",
    )

    asyncio.run(delete_auth_user(UUID(SUBJECT), settings))

    assert client.url == f"{SUPABASE_URL}/auth/v1/admin/users/{SUBJECT}"
    assert client.headers == {
        "apikey": "server-only-key",
        "Authorization": "Bearer server-only-key",
    }
