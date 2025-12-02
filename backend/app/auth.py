"""
Authentication utilities for verifying Clerk tokens.
Simplified version for POC - in production use proper JWT verification.
"""

from fastapi import Header, HTTPException
from typing import Optional
import os


async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Get current user ID from authorization header.
    For POC: Simplified version that allows anonymous access for testing.
    In production: Verify Clerk JWT token properly.
    """
    # For POC: If no auth header, use anonymous user for testing
    # This allows the app to work without full auth implementation
    if not authorization:
        return "anonymous_user"

    # Remove "Bearer " prefix if present
    token = authorization.replace("Bearer ", "")

    # For POC: Extract basic info from token without full JWT verification
    # In production: Use Clerk SDK to properly verify JWT signature
    try:
        # Simplified for POC - in production, verify token with Clerk
        # For now, we'll accept any token and return a mock user ID
        # In a real implementation, use the Clerk Python SDK to verify

        # Mock user ID based on token (for demonstration)
        # In production, decode and verify the JWT properly
        user_id = f"user_{hash(token) % 10000}"

        return user_id

    except Exception as e:
        # For POC: Fall back to anonymous instead of blocking
        print(f"⚠️ Token verification failed: {str(e)}")
        return "anonymous_user"


async def verify_clerk_token(authorization: Optional[str] = Header(None)) -> dict:
    """
    Verify Clerk JWT token and return user info.
    Simplified version for POC.

    In production:
    - Install clerk-backend-api package
    - Use Clerk SDK to verify JWT signature
    - Extract user claims from verified token
    - Handle token expiration properly
    """
    if not authorization:
        # For POC: Return anonymous user
        return {
            "user_id": "anonymous_user",
            "email": "anonymous@example.com"
        }

    token = authorization.replace("Bearer ", "")

    # For POC: Return mock user without verification
    # In production: Verify with Clerk API
    try:
        # Mock user data
        return {
            "user_id": f"user_{hash(token) % 10000}",
            "email": "user@example.com"
        }

    except Exception as e:
        # For POC: Fall back to anonymous
        return {
            "user_id": "anonymous_user",
            "email": "anonymous@example.com"
        }
