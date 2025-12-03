"""
Subscription service for checking user access to AI features
"""

from prisma import Prisma


class SubscriptionService:
    """Manage user subscriptions and feature access"""

    def __init__(self):
        self.prisma = Prisma()

    async def connect(self):
        await self.prisma.connect()

    async def disconnect(self):
        await self.prisma.disconnect()

    async def check_ai_access(self, user_id: str) -> bool:
        """Check if user has access to AI features"""
        try:
            await self.connect()

            user = await self.prisma.user.find_unique(
                where={"clerkId": user_id}
            )

            if not user:
                return False

            # Pro, Team, or Enterprise users have AI access
            allowed_tiers = ["pro", "team", "enterprise"]
            has_access = (
                user.subscriptionTier in allowed_tiers and
                user.subscriptionStatus == "active"
            )

            return has_access

        finally:
            await self.disconnect()

    async def get_user_tier(self, user_id: str) -> str:
        """Get user's subscription tier"""
        try:
            await self.connect()

            user = await self.prisma.user.find_unique(
                where={"clerkId": user_id}
            )

            return user.subscriptionTier if user else "free"

        finally:
            await self.disconnect()


def get_subscription_service() -> SubscriptionService:
    """Get subscription service instance"""
    return SubscriptionService()
