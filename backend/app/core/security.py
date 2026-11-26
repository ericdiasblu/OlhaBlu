import base64
import hashlib
import hmac
import secrets
from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.models import User, UserSession

SESSION_COOKIE_NAME = "olhablu_session"
_SCRYPT_N = 16384
_SCRYPT_R = 8
_SCRYPT_P = 1
_SCRYPT_DKLEN = 32


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=_SCRYPT_N,
        r=_SCRYPT_R,
        p=_SCRYPT_P,
        dklen=_SCRYPT_DKLEN,
    )
    salt_b64 = base64.b64encode(salt).decode("ascii")
    dk_b64 = base64.b64encode(derived).decode("ascii")
    return f"scrypt${_SCRYPT_N}${_SCRYPT_R}${_SCRYPT_P}${salt_b64}${dk_b64}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        scheme, n_str, r_str, p_str, salt_b64, dk_b64 = stored_hash.split("$", 5)
        if scheme != "scrypt":
            return False
        salt = base64.b64decode(salt_b64.encode("ascii"))
        expected = base64.b64decode(dk_b64.encode("ascii"))
        derived = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=int(n_str),
            r=int(r_str),
            p=int(p_str),
            dklen=len(expected),
        )
        return hmac.compare_digest(derived, expected)
    except Exception:
        return False


def generate_session_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(32)
    return raw, hash_token(raw)


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def extract_session_token(request: Request) -> str | None:
    cookie = request.cookies.get(SESSION_COOKIE_NAME)
    if cookie:
        return cookie
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        if token:
            return token
    return None


def get_optional_user(
    request: Request,
    session: Annotated[Session, Depends(get_session)],
) -> User | None:
    raw_token = extract_session_token(request)
    if not raw_token:
        return None
    token_digest = hash_token(raw_token)
    now = utc_now()
    user_session = session.scalar(
        select(UserSession).where(
            UserSession.token_hash == token_digest,
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > now,
        )
    )
    if user_session is None or user_session.user.disabled_at is not None:
        return None
    return user_session.user


def get_current_user(
    user: Annotated[User | None, Depends(get_optional_user)],
) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="Autenticação necessária.")
    return user


def require_moderator(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if user.role != "moderator":
        raise HTTPException(status_code=403, detail="Acesso restrito à moderação.")
    return user
