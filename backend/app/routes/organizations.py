"""
API endpoints for organization/team management.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, Depends
from prisma import Prisma

from app.auth import get_current_user_id, require_auth
from app.utils.permissions import OrgPermissions, OrgRole, generate_slug
from app.models.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationDetailResponse,
    MembershipUpdate,
    MemberResponse,
    InvitationCreate,
    InvitationResponse,
    InvitationAccept,
    TeamDashboardResponse,
    TeamHealthSummary,
    TeamMemberSummary,
)
from app.services.team_service import TeamService
from app.services.email_service import send_invitation_email


router = APIRouter(prefix="/api/organizations", tags=["Organizations"])


async def get_user_from_clerk_id(db: Prisma, clerk_id: str):
    """Get database user from Clerk ID."""
    user = await db.user.find_unique(where={"clerkId": clerk_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure you have an account."
        )
    return user


# ===========================================
# ORGANIZATION CRUD
# ===========================================

@router.post("", response_model=OrganizationResponse)
async def create_organization(
    data: OrganizationCreate,
    clerk_id: str = Depends(require_auth)
):
    """
    Create a new organization.
    The creating user becomes the admin.
    """
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        # Generate unique slug
        base_slug = generate_slug(data.name)
        slug = base_slug
        counter = 1
        while await db.organization.find_first(where={"slug": slug}):
            slug = f"{base_slug}-{counter}"
            counter += 1

        # Create organization
        org = await db.organization.create(
            data={
                "name": data.name,
                "slug": slug,
                "planTier": "team",
            }
        )

        # Add creator as admin
        await db.orgmembership.create(
            data={
                "orgId": org.id,
                "userId": user_id,
                "role": "admin",
            }
        )

        return OrganizationResponse(
            id=org.id,
            name=org.name,
            slug=org.slug,
            planTier=org.planTier,
            memberCount=1,
            createdAt=org.createdAt,
        )
    finally:
        await db.disconnect()


@router.get("", response_model=List[OrganizationResponse])
async def list_my_organizations(
    clerk_id: str = Depends(require_auth)
):
    """List all organizations the current user belongs to."""
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        memberships = await db.orgmembership.find_many(
            where={"userId": user_id, "isActive": True},
            include={"organization": True}
        )

        result = []
        for m in memberships:
            org = m.organization
            member_count = await db.orgmembership.count(
                where={"orgId": org.id, "isActive": True}
            )
            result.append(OrganizationResponse(
                id=org.id,
                name=org.name,
                slug=org.slug,
                planTier=org.planTier,
                memberCount=member_count,
                createdAt=org.createdAt,
            ))

        return result
    finally:
        await db.disconnect()


@router.get("/{org_id}", response_model=OrganizationDetailResponse)
async def get_organization(
    org_id: str,
    clerk_id: str = Depends(require_auth)
):
    """Get organization details."""
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        perms = OrgPermissions(db)
        await perms.require_membership(user_id, org_id)

        org = await db.organization.find_unique(where={"id": org_id})
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")

        member_count = await db.orgmembership.count(
            where={"orgId": org_id, "isActive": True}
        )

        return OrganizationDetailResponse(
            id=org.id,
            name=org.name,
            slug=org.slug,
            planTier=org.planTier,
            memberCount=member_count,
            settings=org.settings or {},
            stripeCustomerId=org.stripeCustomerId,
            createdAt=org.createdAt,
        )
    finally:
        await db.disconnect()


@router.patch("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: str,
    data: OrganizationUpdate,
    clerk_id: str = Depends(require_auth)
):
    """Update organization (admin only)."""
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        perms = OrgPermissions(db)
        await perms.require_admin(user_id, org_id)

        update_data = data.model_dump(exclude_unset=True)

        org = await db.organization.update(
            where={"id": org_id},
            data=update_data
        )

        member_count = await db.orgmembership.count(
            where={"orgId": org_id, "isActive": True}
        )

        return OrganizationResponse(
            id=org.id,
            name=org.name,
            slug=org.slug,
            planTier=org.planTier,
            memberCount=member_count,
            createdAt=org.createdAt,
        )
    finally:
        await db.disconnect()


# ===========================================
# MEMBER MANAGEMENT
# ===========================================

@router.get("/{org_id}/members", response_model=List[MemberResponse])
async def list_members(
    org_id: str,
    include_inactive: bool = Query(False),
    clerk_id: str = Depends(require_auth)
):
    """List all members of an organization."""
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        perms = OrgPermissions(db)
        await perms.require_membership(user_id, org_id)

        where_clause = {"orgId": org_id}
        if not include_inactive:
            where_clause["isActive"] = True

        memberships = await db.orgmembership.find_many(
            where=where_clause,
            include={"user": True}
        )

        result = []
        for m in memberships:
            member_user = m.user

            # Build display name
            display_name = None
            if member_user.firstName and member_user.lastName:
                display_name = f"{member_user.firstName} {member_user.lastName}"
            elif member_user.firstName:
                display_name = member_user.firstName

            # Get their latest pipeline stats
            latest_analysis = await db.analysis.find_first(
                where={"userId": m.userId, "processingStatus": "COMPLETED"},
                order={"createdAt": "desc"}
            )

            result.append(MemberResponse(
                id=m.id,
                userId=m.userId,
                email=member_user.email,
                name=display_name,
                role=m.role,
                reportsTo=m.reportsTo,
                isActive=m.isActive,
                joinedAt=m.joinedAt,
                pipelineHealth=latest_analysis.healthScore if latest_analysis else None,
                totalDeals=latest_analysis.totalDeals if latest_analysis else None,
                totalValue=float(latest_analysis.totalAmount) if latest_analysis and latest_analysis.totalAmount else None,
                criticalIssues=latest_analysis.totalCritical if latest_analysis else None,
            ))

        return result
    finally:
        await db.disconnect()


@router.patch("/{org_id}/members/{member_user_id}", response_model=MemberResponse)
async def update_member(
    org_id: str,
    member_user_id: str,
    data: MembershipUpdate,
    clerk_id: str = Depends(require_auth)
):
    """Update a member's role or manager (admin only)."""
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        perms = OrgPermissions(db)
        await perms.require_admin(user_id, org_id)

        # Can't modify yourself if you're the only admin
        if member_user_id == user_id and data.role and data.role != OrgRole.ADMIN:
            admin_count = await db.orgmembership.count(
                where={"orgId": org_id, "role": "admin", "isActive": True}
            )
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot demote the only admin"
                )

        membership = await db.orgmembership.find_first(
            where={"orgId": org_id, "userId": member_user_id}
        )
        if not membership:
            raise HTTPException(status_code=404, detail="Member not found")

        update_data = data.model_dump(exclude_unset=True)
        # Convert role enum to string if present
        if "role" in update_data and update_data["role"]:
            update_data["role"] = update_data["role"].value if hasattr(update_data["role"], "value") else update_data["role"]

        updated = await db.orgmembership.update(
            where={"id": membership.id},
            data=update_data,
            include={"user": True}
        )

        # Build display name
        display_name = None
        if updated.user.firstName and updated.user.lastName:
            display_name = f"{updated.user.firstName} {updated.user.lastName}"
        elif updated.user.firstName:
            display_name = updated.user.firstName

        return MemberResponse(
            id=updated.id,
            userId=updated.userId,
            email=updated.user.email,
            name=display_name,
            role=updated.role,
            reportsTo=updated.reportsTo,
            isActive=updated.isActive,
            joinedAt=updated.joinedAt,
        )
    finally:
        await db.disconnect()


@router.delete("/{org_id}/members/{member_user_id}")
async def remove_member(
    org_id: str,
    member_user_id: str,
    clerk_id: str = Depends(require_auth)
):
    """Remove a member from the organization (admin only)."""
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        perms = OrgPermissions(db)
        await perms.require_admin(user_id, org_id)

        # Can't remove yourself if you're the only admin
        if member_user_id == user_id:
            admin_count = await db.orgmembership.count(
                where={"orgId": org_id, "role": "admin", "isActive": True}
            )
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove the only admin"
                )

        membership = await db.orgmembership.find_first(
            where={"orgId": org_id, "userId": member_user_id}
        )
        if not membership:
            raise HTTPException(status_code=404, detail="Member not found")

        # Soft delete (set inactive)
        await db.orgmembership.update(
            where={"id": membership.id},
            data={"isActive": False}
        )

        return {"success": True, "message": "Member removed"}
    finally:
        await db.disconnect()


# ===========================================
# INVITATIONS
# ===========================================

@router.post("/{org_id}/invitations", response_model=InvitationResponse)
async def send_invitation(
    org_id: str,
    data: InvitationCreate,
    clerk_id: str = Depends(require_auth)
):
    """Send an invitation to join the organization (admin/manager)."""
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        perms = OrgPermissions(db)
        await perms.require_manager(user_id, org_id)

        # Check if user is already a member
        existing_user = await db.user.find_first(where={"email": data.email})
        if existing_user:
            existing_membership = await db.orgmembership.find_first(
                where={"orgId": org_id, "userId": existing_user.id, "isActive": True}
            )
            if existing_membership:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User is already a member of this organization"
                )

        # Check for pending invitation
        pending = await db.orginvitation.find_first(
            where={
                "orgId": org_id,
                "email": data.email,
                "status": "pending"
            }
        )
        if pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An invitation is already pending for this email"
            )

        # Create invitation (expires in 7 days)
        invitation = await db.orginvitation.create(
            data={
                "orgId": org_id,
                "invitedBy": user_id,
                "email": data.email,
                "role": data.role.value if hasattr(data.role, "value") else data.role,
                "reportsTo": data.reportsTo,
                "expiresAt": datetime.utcnow() + timedelta(days=7),
            }
        )

        # Get org name for email
        org = await db.organization.find_unique(where={"id": org_id})

        # Build inviter name
        inviter_name = user.email
        if user.firstName and user.lastName:
            inviter_name = f"{user.firstName} {user.lastName}"
        elif user.firstName:
            inviter_name = user.firstName

        # Send invitation email
        try:
            await send_invitation_email(
                to_email=data.email,
                org_name=org.name,
                inviter_name=inviter_name,
                invite_token=invitation.token,
            )
        except Exception as e:
            # Log but don't fail - invitation still created
            print(f"Failed to send invitation email: {e}")

        return InvitationResponse(
            id=invitation.id,
            email=invitation.email,
            role=invitation.role,
            status=invitation.status,
            invitedBy=invitation.invitedBy,
            inviterName=inviter_name,
            createdAt=invitation.createdAt,
            expiresAt=invitation.expiresAt,
        )
    finally:
        await db.disconnect()


@router.get("/{org_id}/invitations", response_model=List[InvitationResponse])
async def list_invitations(
    org_id: str,
    status_filter: Optional[str] = Query(None),
    clerk_id: str = Depends(require_auth)
):
    """List all invitations for an organization."""
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        perms = OrgPermissions(db)
        await perms.require_manager(user_id, org_id)

        where_clause = {"orgId": org_id}
        if status_filter:
            where_clause["status"] = status_filter

        invitations = await db.orginvitation.find_many(
            where=where_clause,
            include={"inviter": True},
            order={"createdAt": "desc"}
        )

        result = []
        for inv in invitations:
            inviter_name = None
            if inv.inviter:
                if inv.inviter.firstName and inv.inviter.lastName:
                    inviter_name = f"{inv.inviter.firstName} {inv.inviter.lastName}"
                elif inv.inviter.firstName:
                    inviter_name = inv.inviter.firstName
                else:
                    inviter_name = inv.inviter.email

            result.append(InvitationResponse(
                id=inv.id,
                email=inv.email,
                role=inv.role,
                status=inv.status,
                invitedBy=inv.invitedBy,
                inviterName=inviter_name,
                createdAt=inv.createdAt,
                expiresAt=inv.expiresAt,
            ))

        return result
    finally:
        await db.disconnect()


@router.post("/invitations/accept")
async def accept_invitation(
    data: InvitationAccept,
    clerk_id: str = Depends(require_auth)
):
    """Accept an invitation using the token."""
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        invitation = await db.orginvitation.find_first(
            where={"token": data.token}
        )

        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation not found")

        if invitation.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invitation is {invitation.status}"
            )

        if invitation.expiresAt < datetime.utcnow():
            await db.orginvitation.update(
                where={"id": invitation.id},
                data={"status": "expired"}
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation has expired"
            )

        # Check if already a member
        existing = await db.orgmembership.find_first(
            where={"orgId": invitation.orgId, "userId": user_id}
        )
        if existing:
            if existing.isActive:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You are already a member of this organization"
                )
            else:
                # Reactivate membership
                await db.orgmembership.update(
                    where={"id": existing.id},
                    data={
                        "isActive": True,
                        "role": invitation.role,
                        "reportsTo": invitation.reportsTo,
                    }
                )
        else:
            # Create new membership
            await db.orgmembership.create(
                data={
                    "orgId": invitation.orgId,
                    "userId": user_id,
                    "role": invitation.role,
                    "reportsTo": invitation.reportsTo,
                }
            )

        # Update invitation status
        await db.orginvitation.update(
            where={"id": invitation.id},
            data={
                "status": "accepted",
                "acceptedAt": datetime.utcnow(),
            }
        )

        org = await db.organization.find_unique(where={"id": invitation.orgId})

        return {
            "success": True,
            "message": f"You have joined {org.name}",
            "organizationId": org.id,
            "organizationName": org.name,
        }
    finally:
        await db.disconnect()


@router.delete("/{org_id}/invitations/{invitation_id}")
async def cancel_invitation(
    org_id: str,
    invitation_id: str,
    clerk_id: str = Depends(require_auth)
):
    """Cancel a pending invitation."""
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        perms = OrgPermissions(db)
        await perms.require_manager(user_id, org_id)

        invitation = await db.orginvitation.find_first(
            where={"id": invitation_id, "orgId": org_id}
        )

        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation not found")

        if invitation.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only cancel pending invitations"
            )

        await db.orginvitation.delete(where={"id": invitation_id})

        return {"success": True, "message": "Invitation cancelled"}
    finally:
        await db.disconnect()


# ===========================================
# TEAM DASHBOARD
# ===========================================

@router.get("/{org_id}/dashboard", response_model=TeamDashboardResponse)
async def get_team_dashboard(
    org_id: str,
    clerk_id: str = Depends(require_auth)
):
    """
    Get aggregate team dashboard data.
    Admins see entire org, Managers see their reports.
    """
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        perms = OrgPermissions(db)
        await perms.require_membership(user_id, org_id)

        team_service = TeamService(db)

        # Get viewable user IDs based on role
        viewable_ids = await perms.get_viewable_user_ids(user_id, org_id)

        # Get org info
        org = await db.organization.find_unique(where={"id": org_id})
        member_count = await db.orgmembership.count(
            where={"orgId": org_id, "isActive": True}
        )

        # Calculate aggregate metrics
        summary = await team_service.get_team_health_summary(org_id, viewable_ids)

        # Get member summaries
        members = await team_service.get_member_summaries(org_id, viewable_ids)

        # Get pipeline by stage
        pipeline_by_stage = await team_service.get_pipeline_by_stage(org_id, viewable_ids)

        # Get top issues
        top_issues = await team_service.get_top_issues(org_id, viewable_ids)

        return TeamDashboardResponse(
            organization=OrganizationResponse(
                id=org.id,
                name=org.name,
                slug=org.slug,
                planTier=org.planTier,
                memberCount=member_count,
                createdAt=org.createdAt,
            ),
            summary=summary,
            members=members,
            pipelineByStage=pipeline_by_stage,
            topIssues=top_issues,
        )
    finally:
        await db.disconnect()


@router.get("/{org_id}/members/{member_user_id}/pipeline")
async def get_member_pipeline(
    org_id: str,
    member_user_id: str,
    clerk_id: str = Depends(require_auth)
):
    """
    Get detailed pipeline data for a specific team member.
    Used for drill-down from team dashboard.
    """
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        perms = OrgPermissions(db)

        # Check if current user can view this member
        can_view = await perms.can_view_user(user_id, member_user_id, org_id)
        if not can_view:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this member's data"
            )

        # Get member info
        membership = await db.orgmembership.find_first(
            where={"orgId": org_id, "userId": member_user_id},
            include={"user": True}
        )
        if not membership:
            raise HTTPException(status_code=404, detail="Member not found")

        # Build display name
        display_name = None
        if membership.user.firstName and membership.user.lastName:
            display_name = f"{membership.user.firstName} {membership.user.lastName}"
        elif membership.user.firstName:
            display_name = membership.user.firstName

        # Get their latest analysis
        latest_analysis = await db.analysis.find_first(
            where={"userId": member_user_id, "processingStatus": "COMPLETED"},
            order={"createdAt": "desc"}
        )

        # Get their analysis history (last 10)
        analysis_history = await db.analysis.find_many(
            where={"userId": member_user_id, "processingStatus": "COMPLETED"},
            order={"createdAt": "desc"},
            take=10
        )

        # Format analysis data
        current_analysis = None
        if latest_analysis:
            current_analysis = {
                "id": latest_analysis.id,
                "fileName": latest_analysis.fileName,
                "healthScore": latest_analysis.healthScore,
                "totalDeals": latest_analysis.totalDeals,
                "dealsWithIssues": latest_analysis.dealsWithIssues,
                "totalAmount": float(latest_analysis.totalAmount) if latest_analysis.totalAmount else None,
                "totalCritical": latest_analysis.totalCritical,
                "totalWarnings": latest_analysis.totalWarnings,
                "createdAt": latest_analysis.createdAt.isoformat(),
            }

        history = []
        for analysis in analysis_history:
            history.append({
                "id": analysis.id,
                "fileName": analysis.fileName,
                "healthScore": analysis.healthScore,
                "totalDeals": analysis.totalDeals,
                "createdAt": analysis.createdAt.isoformat(),
            })

        return {
            "member": {
                "userId": membership.userId,
                "email": membership.user.email,
                "name": display_name,
                "role": membership.role,
            },
            "currentAnalysis": current_analysis,
            "analysisHistory": history,
        }
    finally:
        await db.disconnect()
