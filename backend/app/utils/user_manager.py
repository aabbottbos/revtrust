"""
User management utilities for Clerk integration.
Simplified version for POC without database persistence.
"""

from typing import Optional, Dict
from datetime import datetime


class UserManager:
    """Manage user records in memory (POC version)"""

    def __init__(self):
        # In-memory user storage for POC
        # In production, use database (Prisma)
        self.users: Dict[str, dict] = {}

    def get_or_create_user(
        self,
        clerk_user_id: str,
        email: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None
    ) -> dict:
        """
        Get existing user or create new one.
        Called when user authenticates via Clerk.
        """
        # Try to find existing user
        if clerk_user_id in self.users:
            return self.users[clerk_user_id]

        # Create new user
        user = {
            "clerk_user_id": clerk_user_id,
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "created_at": datetime.now().isoformat(),
        }

        self.users[clerk_user_id] = user
        print(f"✅ Created new user: {email}")
        return user

    def get_user_by_clerk_id(self, clerk_user_id: str) -> Optional[dict]:
        """Get user by Clerk ID"""
        return self.users.get(clerk_user_id)


# Singleton instance
_user_manager = UserManager()


def get_user_manager() -> UserManager:
    """Get user manager singleton"""
    return _user_manager
