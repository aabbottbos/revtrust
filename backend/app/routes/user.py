"""
User routes for subscription status and user profile
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Dict, Any
from prisma import Prisma
import logging

from app.auth import get_current_user_id, get_current_user_email

router = APIRouter(prefix="/api/user", tags=["User"])
logger = logging.getLogger(__name__)


@router.get("/subscription")
async def get_subscription_status(
    user_id: str = Depends(get_current_user_id),
    user_email: str = Depends(get_current_user_email)
) -> Dict[str, Any]:
    """
    Get current user's subscription status.
    Returns tier, status, and feature access flags.
    Auto-creates user if they don't exist.
    """
    prisma = Prisma()
    await prisma.connect()

    try:
        user = await prisma.user.find_unique(
            where={"clerkId": user_id}
        )

        if not user:
            # Auto-create new user in database
            if user_email:
                user = await prisma.user.create(
                    data={
                        "clerkId": user_id,
                        "email": user_email,
                        "subscriptionTier": "free",
                        "subscriptionStatus": "active"
                    }
                )
            else:
                # Fallback if email not available
                return {
                    "tier": "free",
                    "status": "active",
                    "hasAIAccess": False,
                    "hasCRMWrite": False,
                    "hasTeamFeatures": False,
                    "hasScheduledReviews": False,
                    "hasActiveSubscription": False,
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
    user_id: str = Depends(get_current_user_id),
    user_email: str = Depends(get_current_user_email)
) -> Dict[str, Any]:
    """
    Get current user's profile information including sales profile fields.
    Auto-creates user if they don't exist yet.
    """
    prisma = Prisma()
    await prisma.connect()

    try:
        user = await prisma.user.find_unique(
            where={"clerkId": user_id}
        )

        # Auto-create user if they don't exist
        if not user:
            logger.info(f"User not found in GET profile, creating new user: {user_id}")

            email = user_email if user_email else f"{user_id}@temp.revtrust.net"
            if not user_email:
                logger.warning(f"Could not extract email from token, using placeholder: {email}")

            user = await prisma.user.create(
                data={
                    "clerkId": user_id,
                    "email": email,
                    "subscriptionTier": "free",
                    "subscriptionStatus": "active"
                }
            )
            logger.info(f"Created new user: {user.id} with email: {email}")

        return {
            "id": user.id,
            "email": user.email,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "createdAt": user.createdAt.isoformat() if user.createdAt else None,
            # Sales profile fields
            "role": user.role,
            "sellingMotion": user.sellingMotion,
            "yearsInSales": user.yearsInSales,
            "salesMethodology": user.salesMethodology,
            "typicalSalesCycle": user.typicalSalesCycle,
            "typicalDealSize": user.typicalDealSize,
            "onboardingCompleted": user.onboardingCompleted,
            "onboardingCompletedAt": user.onboardingCompletedAt.isoformat() if user.onboardingCompletedAt else None,
        }

    finally:
        await prisma.disconnect()
