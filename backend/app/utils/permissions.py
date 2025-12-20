"""
Role-based permission utilities for team access control.
"""

import re
from enum import Enum
from typing import Optional, List
from fastapi import HTTPException, status
from prisma import Prisma


class OrgRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    AE = "ae"


# Permission levels (higher = more access)
ROLE_HIERARCHY = {
    OrgRole.ADMIN: 3,
    OrgRole.MANAGER: 2,
    OrgRole.AE: 1,
}


class OrgPermissions:
    """
    Check user permissions within an organization.
    """

    def __init__(self, db: Prisma):
        self.db = db

    async def get_membership(
        self,
        user_id: str,
        org_id: str
    ) -> Optional[dict]:
        """Get user's membership in an organization."""
        membership = await self.db.orgmembership.find_first(
            where={
                "userId": user_id,
                "orgId": org_id,
                "isActive": True
            }
        )
        return membership

    async def require_membership(
        self,
        user_id: str,
        org_id: str
    ) -> dict:
        """Require user to be a member of the org."""
        membership = await self.get_membership(user_id, org_id)
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this organization"
            )
        return membership

    async def require_role(
        self,
        user_id: str,
        org_id: str,
        min_role: OrgRole
    ) -> dict:
        """Require user to have at least the specified role."""
        membership = await self.require_membership(user_id, org_id)

        user_level = ROLE_HIERARCHY.get(membership.role, 0)
        required_level = ROLE_HIERARCHY.get(min_role, 999)

        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires {min_role} role or higher"
            )

        return membership

    async def require_admin(self, user_id: str, org_id: str) -> dict:
        """Require user to be an admin."""
        return await self.require_role(user_id, org_id, OrgRole.ADMIN)

    async def require_manager(self, user_id: str, org_id: str) -> dict:
        """Require user to be a manager or admin."""
        return await self.require_role(user_id, org_id, OrgRole.MANAGER)

    async def can_view_user(
        self,
        viewer_id: str,
        target_user_id: str,
        org_id: str
    ) -> bool:
        """
        Check if viewer can see target user's data.
        Rules:
        - Admins can see everyone
        - Managers can see their direct reports
        - AEs can only see themselves
        """
        if viewer_id == target_user_id:
            return True

        membership = await self.get_membership(viewer_id, org_id)
        if not membership:
            return False

        if membership.role == OrgRole.ADMIN:
            return True

        if membership.role == OrgRole.MANAGER:
            # Check if target reports to viewer
            target_membership = await self.db.orgmembership.find_first(
                where={
                    "userId": target_user_id,
                    "orgId": org_id,
                    "reportsTo": viewer_id
                }
            )
            return target_membership is not None

        return False

    async def get_viewable_user_ids(
        self,
        user_id: str,
        org_id: str
    ) -> List[str]:
        """
        Get list of user IDs this user can view.
        """
        membership = await self.get_membership(user_id, org_id)
        if not membership:
            return []

        if membership.role == OrgRole.ADMIN:
            # Admin sees everyone
            all_members = await self.db.orgmembership.find_many(
                where={"orgId": org_id, "isActive": True}
            )
            return [m.userId for m in all_members]

        if membership.role == OrgRole.MANAGER:
            # Manager sees self + direct reports
            reports = await self.db.orgmembership.find_many(
                where={
                    "orgId": org_id,
                    "reportsTo": user_id,
                    "isActive": True
                }
            )
            return [user_id] + [r.userId for r in reports]

        # AE sees only self
        return [user_id]


def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from organization name."""
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug
