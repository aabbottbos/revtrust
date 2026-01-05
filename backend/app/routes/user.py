"""
User routes for subscription status and user profile
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from prisma import Prisma

from app.auth import get_current_user_id

router = APIRouter(prefix="/api/user", tags=["User"])


@router.get("/subscription")
async def get_subscription_status(
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Get current user's subscription status.
    Returns tier, status, and feature access flags.
    """
    prisma = Prisma()
    await prisma.connect()

    try:
        user = await prisma.user.find_unique(
            where={"clerkId": user_id}
        )

        if not user:
            # New user - return free tier defaults
            return {
                "tier": "free",
                "status": "active",
                "hasAIAccess": False,
                "hasCRMWrite": False,
                "hasTeamFeatures": False,
                "hasScheduledReviews": False,
            }

        # Define feature access by tier
        tier = user.subscriptionTier or "free"
        status = user.subscriptionStatus or "active"
        is_active = status == "active"

        # Feature access matrix
        ai_tiers = ["pro", "team", "enterprise"]
        crm_write_tiers = ["pro", "team", "enterprise"]
        team_tiers = ["team", "enterprise"]
        scheduled_tiers = ["pro", "team", "enterprise"]

        return {
            "tier": tier,
            "status": status,
            "hasAIAccess": is_active and tier in ai_tiers,
            "hasCRMWrite": is_active and tier in crm_write_tiers,
            "hasTeamFeatures": is_active and tier in team_tiers,
            "hasScheduledReviews": is_active and tier in scheduled_tiers,
            # Additional metadata
            "stripeCustomerId": user.stripeCustomerId,
            "hasActiveSubscription": is_active and tier != "free",
        }

    finally:
        await prisma.disconnect()


@router.get("/profile")
async def get_user_profile(
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Get current user's profile information.
    """
    prisma = Prisma()
    await prisma.connect()

    try:
        user = await prisma.user.find_unique(
            where={"clerkId": user_id}
        )

        if not user:
            raise HTTPException(404, "User not found")

        return {
            "id": user.id,
            "email": user.email,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "createdAt": user.createdAt.isoformat() if user.createdAt else None,
        }

    finally:
        await prisma.disconnect()
