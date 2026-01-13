"""
Admin routes for user management
Allows admins to view users, grant/revoke admin access, and view audit logs
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from prisma import Prisma

from app.auth import require_system_admin

router = APIRouter(prefix="/api/admin/users", tags=["Admin - Users"])


# ===========================================
# REQUEST/RESPONSE MODELS
# ===========================================

class UserResponse(BaseModel):
    id: str
    clerkId: str
    email: str
    firstName: Optional[str]
    lastName: Optional[str]
    isAdmin: bool
    subscriptionTier: str
    subscriptionStatus: str
    createdAt: datetime
    updatedAt: datetime


class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    pageSize: int
    totalPages: int


class UpdateAdminStatusRequest(BaseModel):
    isAdmin: bool


class AuditLogResponse(BaseModel):
    id: str
    performedBy: str
    performedByEmail: Optional[str]
    action: str
    actionCategory: str
    resourceType: str
    resourceId: Optional[str]
    resourceName: Optional[str]
    changeDetails: Optional[dict]
    ipAddress: Optional[str]
    success: bool
    errorMessage: Optional[str]
    createdAt: datetime


class AuditLogsResponse(BaseModel):
    logs: List[AuditLogResponse]
    total: int
    page: int
    pageSize: int


# ===========================================
# HELPER FUNCTIONS
# ===========================================

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
    """Log an admin action to the audit trail"""
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
        print(f"Failed to log admin action: {e}")
        # Don't fail the request if audit logging fails


async def get_admin_user_email(db: Prisma, clerk_id: str) -> Optional[str]:
    """Get admin user's email from database"""
    user = await db.user.find_unique(where={"clerkId": clerk_id})
    return user.email if user else None


# ===========================================
# USER MANAGEMENT ROUTES
# ===========================================

@router.get("", response_model=UserListResponse)
async def list_users(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    admin_only: Optional[bool] = Query(None),
    subscription_tier: Optional[str] = Query(None),
    admin_clerk_id: str = Depends(require_system_admin),
):
    """
    List all users with pagination and filtering.
    Requires admin access.
    """
    db = Prisma()
    await db.connect()

    try:
        # Build where clause
        where = {}

        if search:
            # Search in email, firstName, lastName
            where["OR"] = [
                {"email": {"contains": search, "mode": "insensitive"}},
                {"firstName": {"contains": search, "mode": "insensitive"}},
                {"lastName": {"contains": search, "mode": "insensitive"}},
            ]

        if admin_only is not None:
            where["isAdmin"] = admin_only

        if subscription_tier:
            where["subscriptionTier"] = subscription_tier

        # Get total count
        total = await db.user.count(where=where)

        # Calculate pagination
        skip = (page - 1) * page_size
        total_pages = (total + page_size - 1) // page_size

        # Get users
        users = await db.user.find_many(
            where=where,
            skip=skip,
            take=page_size,
            order={"createdAt": "desc"},
        )

        return UserListResponse(
            users=[
                UserResponse(
                    id=user.id,
                    clerkId=user.clerkId,
                    email=user.email,
                    firstName=user.firstName,
                    lastName=user.lastName,
                    isAdmin=user.isAdmin,
                    subscriptionTier=user.subscriptionTier,
                    subscriptionStatus=user.subscriptionStatus,
                    createdAt=user.createdAt,
                    updatedAt=user.updatedAt,
                )
                for user in users
            ],
            total=total,
            page=page,
            pageSize=page_size,
            totalPages=total_pages,
        )

    finally:
        await db.disconnect()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    admin_clerk_id: str = Depends(require_system_admin),
):
    """
    Get a specific user by ID.
    Requires admin access.
    """
    db = Prisma()
    await db.connect()

    try:
        user = await db.user.find_unique(where={"id": user_id})

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return UserResponse(
            id=user.id,
            clerkId=user.clerkId,
            email=user.email,
            firstName=user.firstName,
            lastName=user.lastName,
            isAdmin=user.isAdmin,
            subscriptionTier=user.subscriptionTier,
            subscriptionStatus=user.subscriptionStatus,
            createdAt=user.createdAt,
            updatedAt=user.updatedAt,
        )

    finally:
        await db.disconnect()


@router.patch("/{user_id}/admin-status")
async def update_admin_status(
    user_id: str,
    data: UpdateAdminStatusRequest,
    request: Request,
    admin_clerk_id: str = Depends(require_system_admin),
):
    """
    Grant or revoke admin access for a user.
    Requires admin access.
    """
    db = Prisma()
    await db.connect()

    try:
        # Get the target user
        user = await db.user.find_unique(where={"id": user_id})

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Prevent self-demotion
        admin_user = await db.user.find_unique(where={"clerkId": admin_clerk_id})
        if admin_user and admin_user.id == user_id and not data.isAdmin:
            raise HTTPException(
                status_code=400,
                detail="You cannot revoke your own admin access"
            )

        # Store old value for audit log
        old_is_admin = user.isAdmin

        # Update admin status
        updated_user = await db.user.update(
            where={"id": user_id},
            data={"isAdmin": data.isAdmin},
        )

        # Log the action
        admin_email = await get_admin_user_email(db, admin_clerk_id)
        action = "grant_admin" if data.isAdmin else "revoke_admin"

        await log_admin_action(
            db=db,
            request=request,
            admin_clerk_id=admin_clerk_id,
            admin_email=admin_email,
            action=action,
            action_category="USER_MANAGEMENT",
            resource_type="User",
            resource_id=user_id,
            resource_name=user.email,
            change_details={
                "before": {"isAdmin": old_is_admin},
                "after": {"isAdmin": data.isAdmin},
            },
            success=True,
        )

        return {
            "success": True,
            "message": f"Admin status updated for {user.email}",
            "user": UserResponse(
                id=updated_user.id,
                clerkId=updated_user.clerkId,
                email=updated_user.email,
                firstName=updated_user.firstName,
                lastName=updated_user.lastName,
                isAdmin=updated_user.isAdmin,
                subscriptionTier=updated_user.subscriptionTier,
                subscriptionStatus=updated_user.subscriptionStatus,
                createdAt=updated_user.createdAt,
                updatedAt=updated_user.updatedAt,
            ),
        }

    except HTTPException:
        raise
    except Exception as e:
        # Log the failed action
        admin_email = await get_admin_user_email(db, admin_clerk_id)
        await log_admin_action(
            db=db,
            request=request,
            admin_clerk_id=admin_clerk_id,
            admin_email=admin_email,
            action="update_admin_status_failed",
            action_category="USER_MANAGEMENT",
            resource_type="User",
            resource_id=user_id,
            success=False,
            error_message=str(e),
        )
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        await db.disconnect()


# ===========================================
# AUDIT LOG ROUTES
# ===========================================

@router.get("/audit-logs/all", response_model=AuditLogsResponse)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action_category: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    admin_clerk_id: str = Depends(require_system_admin),
):
    """
    Get audit logs for all admin actions.
    Requires admin access.
    """
    db = Prisma()
    await db.connect()

    try:
        # Build where clause
        where = {}

        if action_category:
            where["actionCategory"] = action_category

        if resource_type:
            where["resourceType"] = resource_type

        # Get total count
        total = await db.adminauditlog.count(where=where)

        # Calculate pagination
        skip = (page - 1) * page_size

        # Get logs
        logs = await db.adminauditlog.find_many(
            where=where,
            skip=skip,
            take=page_size,
            order={"createdAt": "desc"},
        )

        return AuditLogsResponse(
            logs=[
                AuditLogResponse(
                    id=log.id,
                    performedBy=log.performedBy,
                    performedByEmail=log.performedByEmail,
                    action=log.action,
                    actionCategory=log.actionCategory,
                    resourceType=log.resourceType,
                    resourceId=log.resourceId,
                    resourceName=log.resourceName,
                    changeDetails=log.changeDetails,
                    ipAddress=log.ipAddress,
                    success=log.success,
                    errorMessage=log.errorMessage,
                    createdAt=log.createdAt,
                )
                for log in logs
            ],
            total=total,
            page=page,
            pageSize=page_size,
        )

    finally:
        await db.disconnect()


@router.get("/audit-logs/user/{user_id}", response_model=AuditLogsResponse)
async def get_user_audit_logs(
    user_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    admin_clerk_id: str = Depends(require_system_admin),
):
    """
    Get audit logs for a specific user (actions performed on that user).
    Requires admin access.
    """
    db = Prisma()
    await db.connect()

    try:
        # Get logs where this user was the resource
        where = {"resourceId": user_id, "resourceType": "User"}

        # Get total count
        total = await db.adminauditlog.count(where=where)

        # Calculate pagination
        skip = (page - 1) * page_size

        # Get logs
        logs = await db.adminauditlog.find_many(
            where=where,
            skip=skip,
            take=page_size,
            order={"createdAt": "desc"},
        )

        return AuditLogsResponse(
            logs=[
                AuditLogResponse(
                    id=log.id,
                    performedBy=log.performedBy,
                    performedByEmail=log.performedByEmail,
                    action=log.action,
                    actionCategory=log.actionCategory,
                    resourceType=log.resourceType,
                    resourceId=log.resourceId,
                    resourceName=log.resourceName,
                    changeDetails=log.changeDetails,
                    ipAddress=log.ipAddress,
                    success=log.success,
                    errorMessage=log.errorMessage,
                    createdAt=log.createdAt,
                )
                for log in logs
            ],
            total=total,
            page=page,
            pageSize=page_size,
        )

    finally:
        await db.disconnect()
