"""Supabase authentication boundary for all user-owned API data.

Tokens are verified locally: HS256 against the project's JWT secret, and
asymmetric algorithms against the project's published JWKS. Only when neither
key source can serve the presented token does this fall back to asking
Supabase directly, which costs a network round trip per request.
"""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

import httpx
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .settings import Settings, get_settings

_bearer = HTTPBearer(auto_error=False)

# One client per process. PyJWKClient caches fetched keys internally, and a
# module-level httpx client keeps the fallback path from opening a fresh
# connection pool on every request.
_jwks_clients: dict[str, jwt.PyJWKClient] = {}
_http_client: httpx.AsyncClient | None = None

_SYMMETRIC_ALGORITHMS = frozenset({"HS256", "HS384", "HS512"})
_ASYMMETRIC_ALGORITHMS = frozenset({"RS256", "RS384", "RS512", "ES256", "ES384", "ES512"})


def _issuer(settings: Settings) -> str:
    return f"{settings.supabase_url.rstrip('/')}/auth/v1"


def _jwks_client(settings: Settings) -> jwt.PyJWKClient:
    url = f"{_issuer(settings)}/.well-known/jwks.json"
    client = _jwks_clients.get(url)
    if client is None:
        client = jwt.PyJWKClient(url, cache_keys=True, lifespan=600)
        _jwks_clients[url] = client
    return client


def _get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=5.0)
    return _http_client


def _unauthenticated(message: str) -> HTTPException:
    return HTTPException(status_code=401, detail=message)


def _decode(token: str, key: Any, algorithms: list[str], settings: Settings) -> dict[str, Any]:
    return jwt.decode(
        token,
        key,
        algorithms=algorithms,
        audience=settings.supabase_jwt_audience,
        issuer=_issuer(settings),
        options={"require": ["exp", "sub"]},
    )


def _subject(claims: dict[str, Any]) -> UUID:
    try:
        return UUID(str(claims["sub"]))
    except (KeyError, TypeError, ValueError) as exc:
        raise _unauthenticated("Invalid session identity.") from exc


async def _verify_remotely(token: str, settings: Settings) -> UUID:
    """Last resort: ask Supabase who this token belongs to."""
    if not settings.supabase_publishable_key:
        raise HTTPException(status_code=503, detail="Authentication is not configured.")
    try:
        response = await _get_http_client().get(
            f"{_issuer(settings)}/user",
            headers={
                "apikey": settings.supabase_publishable_key,
                "Authorization": f"Bearer {token}",
            },
        )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=503, detail="Authentication service is unavailable."
        ) from exc
    if response.status_code != 200:
        raise _unauthenticated("Invalid or expired session.")
    try:
        return _subject({"sub": response.json()["id"]})
    except (KeyError, TypeError, ValueError) as exc:
        raise _unauthenticated("Invalid session identity.") from exc


CredentialsDep = Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


async def current_user_id(credentials: CredentialsDep, settings: SettingsDep) -> UUID:
    """Return the verified Supabase Auth subject, never a caller-supplied id."""
    if not settings.supabase_url:
        raise HTTPException(status_code=503, detail="Authentication is not configured.")
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthenticated("Authentication is required.")
    token = credentials.credentials

    try:
        header = jwt.get_unverified_header(token)
    except jwt.PyJWTError as exc:
        raise _unauthenticated("Invalid or expired session.") from exc
    algorithm = str(header.get("alg", ""))

    if algorithm in _SYMMETRIC_ALGORITHMS and settings.supabase_jwt_secret:
        try:
            claims = _decode(token, settings.supabase_jwt_secret, [algorithm], settings)
        except jwt.PyJWTError as exc:
            raise _unauthenticated("Invalid or expired session.") from exc
        return _subject(claims)

    if algorithm in _ASYMMETRIC_ALGORITHMS:
        try:
            signing_key = _jwks_client(settings).get_signing_key_from_jwt(token)
        except jwt.PyJWKClientError:
            # No usable published key for this token; fall through to Supabase.
            signing_key = None
        except jwt.PyJWTError as exc:
            raise _unauthenticated("Invalid or expired session.") from exc
        if signing_key is not None:
            try:
                claims = _decode(token, signing_key.key, [algorithm], settings)
            except jwt.PyJWTError as exc:
                raise _unauthenticated("Invalid or expired session.") from exc
            return _subject(claims)

    return await _verify_remotely(token, settings)
