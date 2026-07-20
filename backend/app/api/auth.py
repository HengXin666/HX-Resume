import asyncio

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.core.security import (
    authenticated_username,
    create_session,
    credentials_match,
    login_rate_limiter,
    require_authenticated,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=128)
    password: str = Field(min_length=1, max_length=1024)


class SessionResponse(BaseModel):
    authenticated: bool
    username: str | None = None
    csrf_token: str | None = None


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For", "").split(",", 1)[0].strip()
    return forwarded or (request.client.host if request.client else "unknown")


@router.post("/login", response_model=SessionResponse)
async def login(body: LoginRequest, request: Request) -> SessionResponse:
    client_key = _client_key(request)
    login_rate_limiter.check(client_key)
    if not credentials_match(body.username, body.password):
        login_rate_limiter.failed(client_key)
        # Keep failed requests non-trivial even when the configured password is short.
        await asyncio.sleep(0.25)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    login_rate_limiter.succeeded(client_key)
    csrf_token = create_session(request)
    return SessionResponse(
        authenticated=True,
        username=body.username,
        csrf_token=csrf_token,
    )


@router.get("/session", response_model=SessionResponse)
async def session_status(request: Request) -> SessionResponse:
    username = authenticated_username(request)
    if username is None:
        return SessionResponse(authenticated=False)
    return SessionResponse(
        authenticated=True,
        username=username,
        csrf_token=request.session.get("csrf_token"),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, _username: str = Depends(require_authenticated)) -> None:
    request.session.clear()
