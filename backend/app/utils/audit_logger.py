"""
Audit logging utility for admin actions
Provides a reusable function to log admin actions across the application
"""

from typing import Optional
from fastapi import Request
from prisma import Prisma


async def log_admin_action(
    db: Prisma,
    request: Request,
    admin_clerk_id: str,
    admin_email: Optional[str],
    action: str,
    action_category: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    resource_name: Optional[str] = None,
    change_details: Optional[dict] = None,
    success: bool = True,
    error_message: Optional[str] = None,
):
    """
    Log an admin action to the audit trail

    Args:
        db: Prisma database connection
        request: FastAPI request object (for IP and user agent)
        admin_clerk_id: Clerk ID of admin performing action
        admin_email: Email of admin performing action
        action: Action performed (e.g., "create_provider", "delete_rule")
        action_category: Category of action (USER_MANAGEMENT, RULE_MANAGEMENT, etc.)
        resource_type: Type of resource affected (User, Rule, Prompt, etc.)
        resource_id: ID of affected resource
        resource_name: Name/email of resource for display
        change_details: Dict with before/after values or additional context
        success: Whether the action succeeded
        error_message: Error message if action failed
    """
    try:
        # Get IP address from request
        ip_address = None
        if request.client:
            ip_address = request.client.host

        # Get user agent
        user_agent = request.headers.get("user-agent")

        await db.adminauditlog.create(
            data={
                "performedBy": admin_clerk_id,
                "performedByEmail": admin_email,
                "action": action,
                "actionCategory": action_category,
                "resourceType": resource_type,
                "resourceId": resource_id,
                "resourceName": resource_name,
                "changeDetails": change_details,
                "ipAddress": ip_address,
                "userAgent": user_agent,
                "success": success,
                "errorMessage": error_message,
            }
        )
    except Exception as e:
        # Log but don't fail the request if audit logging fails
        print(f"⚠️  Failed to log admin action: {e}")


async def get_admin_email(db: Prisma, clerk_id: str) -> Optional[str]:
    """
    Helper to get admin user's email from database

    Args:
        db: Prisma database connection
        clerk_id: Clerk ID of the admin user

    Returns:
        Email address or None if not found
    """
    try:
        user = await db.user.find_unique(where={"clerkId": clerk_id})
        return user.email if user else None
    except Exception:
        return None
