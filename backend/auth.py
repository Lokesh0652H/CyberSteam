"""JWT auth + RBAC for CyberStream (roles: admin, analyst, viewer)."""
from __future__ import annotations

import os
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
from bson import ObjectId
from fastapi import HTTPException, Request, Depends

JWT_ALGORITHM = "HS256"
ROLES = ("admin", "analyst", "viewer")
LOCKOUT_MAX = 5
LOCKOUT_MINUTES = 15


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def _extract_token(request: Request) -> str | None:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    return token


class Auth:
    """Bound to the app db at startup."""

    db = None

    @classmethod
    def bind(cls, db):
        cls.db = db

    @classmethod
    async def check_lockout(cls, identifier: str):
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=LOCKOUT_MINUTES)
        count = await cls.db.login_attempts.count_documents(
            {"identifier": identifier, "ts": {"$gt": cutoff.isoformat()}}
        )
        if count >= LOCKOUT_MAX:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")

    @classmethod
    async def record_failed(cls, identifier: str, email: str):
        await cls.db.login_attempts.insert_one({
            "identifier": identifier,
            "email": email,
            "ts": datetime.now(timezone.utc).isoformat(),
        })

    @classmethod
    async def clear_attempts(cls, identifier: str):
        await cls.db.login_attempts.delete_many({"identifier": identifier})


async def get_current_user(request: Request) -> dict:
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await Auth.db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user.pop("_id"))
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_roles(*allowed: str):
    async def _dep(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in allowed:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return _dep


async def seed_users(db):
    """Seed admin + demo analyst/viewer accounts (idempotent)."""
    Auth.bind(db)
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email, "password_hash": hash_password(admin_password),
            "name": "SOC Administrator", "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})
    demos = [
        ("analyst@cyberstream.io", "analyst123", "Security Analyst", "analyst"),
        ("viewer@cyberstream.io", "viewer123", "SOC Viewer", "viewer"),
    ]
    for email, pw, name, role in demos:
        if not await db.users.find_one({"email": email}):
            await db.users.insert_one({
                "email": email, "password_hash": hash_password(pw), "name": name,
                "role": role, "created_at": datetime.now(timezone.utc).isoformat(),
            })
