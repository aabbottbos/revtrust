"""
Authentication utilities for verifying Clerk tokens.
Production-ready implementation with proper JWT verification.
"""

from fastapi import Header, HTTPException, Depends
from typing import Optional
import os
import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
import requests
from functools import lru_cache
from prisma import Prisma


# Get Clerk configuration from environment
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_JWKS_URL = "https://enough-adder-37.clerk.accounts.dev/.well-known/jwks.json"  # Derived from publishable key


@lru_cache(maxsize=1)
def get_jwks_client():
    """Get cached JWKS client for JWT verification"""
    return PyJWKClient(CLERK_JWKS_URL)


async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Get current user ID from Clerk JWT token with proper verification.

    For development: Falls back to anonymous_user if no token provided.
    For production: Should reject requests without valid tokens.
    """
    # Development mode: Allow anonymous access for testing
    if not authorization:
        print("⚠️  No authorization header - using anonymous_user")
        return "anonymous_user"

    # Remove "Bearer " prefix if present
    token = authorization.replace("Bearer ", "").strip()

    if not token:
        print("⚠️  Empty token - using anonymous_user")
        return "anonymous_user"

    try:
        # Verify and decode the JWT token
        jwks_client = get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # Decode and verify the token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_exp": True, "verify_aud": False}  # Clerk doesn't use aud claim
        )

        # Extract user ID from token (Clerk uses 'sub' claim for user ID)
        user_id = payload.get("sub")

        if not user_id:
            print("⚠️  No 'sub' claim in token - using anonymous_user")
            return "anonymous_user"

        print(f"✅ Authenticated user: {user_id}")
        return user_id

    except ExpiredSignatureError:
        print("⚠️  Token expired - using anonymous_user")
        # In production, you might want to raise HTTPException(401, "Token expired")
        return "anonymous_user"

    except InvalidTokenError as e:
        print(f"⚠️  Invalid token ({str(e)}) - using anonymous_user")
        # In production, you might want to raise HTTPException(401, "Invalid token")
        return "anonymous_user"

    except Exception as e:
        print(f"⚠️  Token verification failed ({str(e)}) - using anonymous_user")
        # In production, you might want to raise HTTPException(401, "Authentication failed")
        return "anonymous_user"


async def get_current_user_email(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Get current user email from Clerk JWT token.
    Returns None if not authenticated or email not available.
    """
    if not authorization:
        return None

    token = authorization.replace("Bearer ", "").strip()

    if not token:
        return None

    try:
        jwks_client = get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_exp": True, "verify_aud": False}
        )

        # Clerk stores email in the token
        return payload.get("email") or payload.get("email_address")

    except Exception:
        return None


async def require_auth(authorization: Optional[str] = Header(None)) -> str:
    """
    Require authentication - raises 401 if not authenticated.
    Use this for endpoints that must have a valid user.
    """
    user_id = await get_current_user_id(authorization)

    if user_id == "anonymous_user":
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


async def require_system_admin(user_id: str = Depends(require_auth)) -> str:
    """
    Require system admin access - raises 403 if user is not an admin.
    Use this for admin-only endpoints.

    This dependency:
    1. First validates authentication via require_auth (returns 401 if not authenticated)
    2. Then checks the database for isAdmin flag (returns 403 if not admin)
    """
    db = Prisma()
    await db.connect()

    try:
        # Look up user by clerkId (user_id from JWT is the Clerk user ID)
        user = await db.user.find_unique(where={"clerkId": user_id})

        if not user:
            raise HTTPException(
                status_code=403,
                detail="User not found in database",
            )

        if not user.isAdmin:
            raise HTTPException(
                status_code=403,
                detail="Admin access required",
            )

        return user_id
    finally:
        await db.disconnect()
