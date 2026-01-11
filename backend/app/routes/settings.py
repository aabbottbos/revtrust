"""
Routes for user settings (delivery preferences, etc.)
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from prisma import Prisma
import logging

from app.auth import get_current_user_id, get_current_user_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/settings", tags=["Settings"])


class DeliverySettingsRequest(BaseModel):
    defaultEmailRecipients: List[str] = []
    slackWebhookUrl: Optional[str] = None
    slackEnabled: bool = False
    emailEnabled: bool = True


async def get_or_create_user(prisma: Prisma, clerk_id: str, email: Optional[str] = None):
    """Get user by Clerk ID or create if doesn't exist"""
    user = await prisma.user.find_unique(where={"clerkId": clerk_id})

    if not user:
        user_email = email or f"{clerk_id}@clerk.user"
        user = await prisma.user.create(data={
            "clerkId": clerk_id,
            "email": user_email
        })

    return user


@router.get("/delivery")
async def get_delivery_settings(
    user_id: str = Depends(get_current_user_id),
    email: Optional[str] = Depends(get_current_user_email)
):
    """Get user's delivery settings"""

    prisma = Prisma()
    await prisma.connect()

    try:
        user = await get_or_create_user(prisma, user_id, email)

        # Try to get existing settings
        settings = await prisma.usersettings.find_unique(
            where={"userId": user.id}
        )

        if not settings:
            # Return defaults
            return {
                "defaultEmailRecipients": [],
                "slackWebhookUrl": None,
                "slackEnabled": False,
                "emailEnabled": True
            }

        return {
            "defaultEmailRecipients": settings.defaultEmailRecipients or [],
            "slackWebhookUrl": settings.slackWebhookUrl,
            "slackEnabled": settings.slackEnabled,
            "emailEnabled": settings.emailEnabled
        }

    except Exception as e:
        # Model might not exist yet
        logger.warning(f"Error getting delivery settings: {e}")
        return {
            "defaultEmailRecipients": [],
            "slackWebhookUrl": None,
            "slackEnabled": False,
            "emailEnabled": True
        }

    finally:
        await prisma.disconnect()


@router.put("/delivery")
async def update_delivery_settings(
    request: DeliverySettingsRequest,
    user_id: str = Depends(get_current_user_id),
    email: Optional[str] = Depends(get_current_user_email)
):
    """Update user's delivery settings"""

    prisma = Prisma()
    await prisma.connect()

    try:
        user = await get_or_create_user(prisma, user_id, email)

        # Upsert settings
        settings = await prisma.usersettings.upsert(
            where={"userId": user.id},
            create={
                "userId": user.id,
                "defaultEmailRecipients": request.defaultEmailRecipients,
                "slackWebhookUrl": request.slackWebhookUrl,
                "slackEnabled": request.slackEnabled,
                "emailEnabled": request.emailEnabled
            },
            update={
                "defaultEmailRecipients": request.defaultEmailRecipients,
                "slackWebhookUrl": request.slackWebhookUrl,
                "slackEnabled": request.slackEnabled,
                "emailEnabled": request.emailEnabled
            }
        )

        return {
            "status": "updated",
            "defaultEmailRecipients": settings.defaultEmailRecipients,
            "slackWebhookUrl": settings.slackWebhookUrl,
            "slackEnabled": settings.slackEnabled,
            "emailEnabled": settings.emailEnabled
        }

    except Exception as e:
        logger.error(f"Error updating delivery settings: {e}")
        raise HTTPException(500, f"Failed to update settings: {str(e)}")

    finally:
        await prisma.disconnect()
