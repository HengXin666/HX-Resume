import hashlib
import secrets
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field

from fastapi import HTTPException, Request, status

from app.core.config import settings

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


def credentials_match(username: str, password: str) -> bool:
    """Compare both credentials without leaking password length or mismatch timing."""
    username_ok = secrets.compare_digest(username.encode(), settings.AUTH_USERNAME.encode())
    supplied_digest = hashlib.sha256(password.encode()).digest()
    expected_digest = hashlib.sha256(settings.AUTH_PASSWORD.encode()).digest()
    password_ok = secrets.compare_digest(supplied_digest, expected_digest)
    return username_ok and password_ok


def create_session(request: Request) -> str:
    csrf_token = secrets.token_urlsafe(32)
    request.session.clear()
    request.session.update({"username": settings.AUTH_USERNAME, "csrf_token": csrf_token})
    return csrf_token


def authenticated_username(request: Request) -> str | None:
    username = request.session.get("username")
    if not isinstance(username, str) or not secrets.compare_digest(
        username.encode(), settings.AUTH_USERNAME.encode()
    ):
        return None
    return username


async def require_authenticated(request: Request) -> str:
    """Protect API routes and require a session-bound CSRF token on writes."""
    username = authenticated_username(request)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    if request.method not in SAFE_METHODS:
        expected = request.session.get("csrf_token")
        supplied = request.headers.get("X-CSRF-Token")
        if not isinstance(expected, str) or not supplied or not secrets.compare_digest(
            supplied.encode(), expected.encode()
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid CSRF token",
            )
    return username


@dataclass
class LoginRateLimiter:
    """Small in-memory limiter suitable for this single-process deployment."""

    attempts: dict[str, deque[float]] = field(default_factory=lambda: defaultdict(deque))

    def _active_attempts(self, client_key: str) -> deque[float]:
        now = time.monotonic()
        entries = self.attempts[client_key]
        cutoff = now - settings.LOGIN_WINDOW_SECONDS
        while entries and entries[0] <= cutoff:
            entries.popleft()
        return entries

    def check(self, client_key: str) -> None:
        entries = self._active_attempts(client_key)
        if len(entries) < settings.LOGIN_MAX_ATTEMPTS:
            return
        retry_after = max(1, int(settings.LOGIN_WINDOW_SECONDS - (time.monotonic() - entries[0])))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts",
            headers={"Retry-After": str(retry_after)},
        )

    def failed(self, client_key: str) -> None:
        self._active_attempts(client_key).append(time.monotonic())

    def succeeded(self, client_key: str) -> None:
        self.attempts.pop(client_key, None)


login_rate_limiter = LoginRateLimiter()
