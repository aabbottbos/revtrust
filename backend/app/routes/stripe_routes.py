"""
Stripe routes for checkout and subscription management
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
from app.services.stripe_service import get_stripe_service
from app.auth import get_current_user_id, get_current_user_email
from prisma import Prisma
import os
import requests

router = APIRouter(prefix="/api/stripe", tags=["Stripe"])


class CreateCheckoutRequest(BaseModel):
    """Request to create checkout session"""
    pass


@router.post("/create-checkout-session")
async def create_checkout_session(
    user_id: str = Depends(get_current_user_id),
    user_email: Optional[str] = Depends(get_current_user_email)
):
    """Create Stripe checkout session for Pro subscription"""

    try:
        # Get user details
        prisma = Prisma()
        await prisma.connect()

        user = await prisma.user.find_unique(
            where={"clerkId": user_id}
        )

        # Auto-create user if they don't exist yet
        if not user:
            # If email not in token, fetch from Clerk API
            if not user_email:
                import requests
                clerk_secret = os.getenv("CLERK_SECRET_KEY")
                headers = {"Authorization": f"Bearer {clerk_secret}"}

                try:
                    response = requests.get(
                        f"https://api.clerk.com/v1/users/{user_id}",
                        headers=headers,
                        timeout=5
                    )
                    if response.ok:
                        clerk_user = response.json()
                        email_addresses = clerk_user.get("email_addresses", [])
                        if email_addresses:
                            user_email = email_addresses[0].get("email_address")
                except Exception as e:
                    print(f"Failed to fetch user from Clerk API: {e}")

            if not user_email:
                raise HTTPException(400, "Email required for new users. Please ensure your email is verified in your account.")

            user = await prisma.user.create(
                data={
                    "clerkId": user_id,
                    "email": user_email,
                    "subscriptionTier": "free",
                    "subscriptionStatus": "active"
                }
            )

        # Check if already Pro
        if user.subscriptionTier == "pro" and user.subscriptionStatus == "active":
            raise HTTPException(400, "Already subscribed to Pro")

        # Create checkout session
        stripe_service = get_stripe_service()
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

        session = stripe_service.create_checkout_session(
            user_id=user_id,
            user_email=user.email,
            success_url=f"{frontend_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/pricing?canceled=true"
        )

        await prisma.disconnect()

        return session

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating checkout: {e}")
        raise HTTPException(500, f"Failed to create checkout: {str(e)}")


@router.post("/create-portal-session")
async def create_portal_session(
    user_id: str = Depends(get_current_user_id)
):
    """Create customer portal session for subscription management"""

    try:
        prisma = Prisma()
        await prisma.connect()

        user = await prisma.user.find_unique(
            where={"clerkId": user_id}
        )

        if not user or not user.stripeCustomerId:
            raise HTTPException(400, "No Stripe customer found")

        stripe_service = get_stripe_service()
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

        session = stripe_service.create_portal_session(
            customer_id=user.stripeCustomerId,
            return_url=f"{frontend_url}/subscription"
        )

        await prisma.disconnect()

        return session

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating portal: {e}")
        raise HTTPException(500, f"Failed to create portal: {str(e)}")


@router.get("/subscription-status")
async def get_subscription_status(
    user_id: str = Depends(get_current_user_id)
):
    """Get current subscription status"""

    try:
        prisma = Prisma()
        await prisma.connect()

        user = await prisma.user.find_unique(
            where={"clerkId": user_id}
        )

        if not user:
            raise HTTPException(404, "User not found")

        await prisma.disconnect()

        return {
            "tier": user.subscriptionTier,
            "status": user.subscriptionStatus,
            "stripe_customer_id": user.stripeCustomerId,
            "stripe_subscription_id": user.stripeSubscriptionId
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting status: {e}")
        raise HTTPException(500, str(e))
