"""
Forecast tracking API routes
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from prisma import Prisma

from app.auth import get_current_user_id
from app.models.forecast import (
    QuarterlyTargetCreate,
    QuarterlyTargetResponse,
    ForecastAnalysis,
    ForecastCoaching,
    ForecastCoachingRequest,
    TeamForecastRollup,
)
from app.services.forecast_service import forecast_service, ForecastService
from app.services.salesforce_service import get_salesforce_service
from app.services.hubspot_service import get_hubspot_service
from app.services.ai_service import get_ai_service


router = APIRouter(prefix="/forecast", tags=["Forecast"])


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
# TARGET MANAGEMENT
# ===========================================

@router.post("/target", response_model=QuarterlyTargetResponse)
async def set_quarterly_target(
    data: QuarterlyTargetCreate,
    clerk_id: str = Depends(get_current_user_id),
):
    """Set quarterly target for self or (as manager) for a team member"""
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        # Determine target user
        target_user_id = data.user_id or user_id

        # If setting for someone else, verify permission
        if target_user_id != user_id and data.org_id:
            membership = await db.orgmembership.find_first(
                where={"userId": user_id, "orgId": data.org_id}
            )
            if not membership or membership.role not in ["admin", "manager"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only managers and admins can set targets for others"
                )

        result = await forecast_service.set_target(
            db=db,
            user_id=target_user_id,
            target_amount=data.target_amount,
            quarter=data.quarter,
            year=data.year,
            set_by_user_id=user_id,
            org_id=data.org_id,
        )

        return result

    finally:
        await db.disconnect()


@router.get("/target", response_model=Optional[QuarterlyTargetResponse])
async def get_my_target(
    quarter: Optional[int] = None,
    year: Optional[int] = None,
    org_id: Optional[str] = None,
    clerk_id: str = Depends(get_current_user_id),
):
    """Get current user's quarterly target"""
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        # Default to current quarter
        if quarter is None or year is None:
            q, y = ForecastService.get_current_quarter()
            quarter = quarter or q
            year = year or y

        result = await forecast_service.get_target(
            db=db,
            user_id=user_id,
            quarter=quarter,
            year=year,
            org_id=org_id,
        )

        return result

    finally:
        await db.disconnect()


@router.get("/target/{user_id}", response_model=Optional[QuarterlyTargetResponse])
async def get_user_target(
    user_id: str,
    quarter: Optional[int] = None,
    year: Optional[int] = None,
    org_id: Optional[str] = None,
    clerk_id: str = Depends(get_current_user_id),
):
    """Get a specific user's quarterly target (for managers)"""
    db = Prisma()
    await db.connect()

    try:
        viewer = await get_user_from_clerk_id(db, clerk_id)

        # Check if viewer has permission to see this user's target
        if org_id:
            membership = await db.orgmembership.find_first(
                where={"userId": viewer.id, "orgId": org_id}
            )
            if not membership or membership.role not in ["admin", "manager"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to view this target"
                )

        if quarter is None or year is None:
            q, y = ForecastService.get_current_quarter()
            quarter = quarter or q
            year = year or y

        result = await forecast_service.get_target(
            db=db,
            user_id=user_id,
            quarter=quarter,
            year=year,
            org_id=org_id,
        )

        return result

    finally:
        await db.disconnect()


# ===========================================
# FORECAST ANALYSIS
# ===========================================

@router.get("/analysis", response_model=ForecastAnalysis)
async def get_forecast_analysis(
    quarter: Optional[int] = None,
    year: Optional[int] = None,
    org_id: Optional[str] = None,
    clerk_id: str = Depends(get_current_user_id),
):
    """Get forecast analysis comparing pipeline to target"""
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        # Default to current quarter
        if quarter is None or year is None:
            q, y = ForecastService.get_current_quarter()
            quarter = quarter or q
            year = year or y

        # Get target
        target = await forecast_service.get_target(
            db=db,
            user_id=user_id,
            quarter=quarter,
            year=year,
            org_id=org_id,
        )

        # Get CRM connection
        connection = await db.crmconnection.find_first(
            where={"userId": user_id, "isActive": True}
        )

        if not connection:
            # Return empty analysis with target info
            return forecast_service.analyze_pipeline(
                deals=[],
                target=target,
                quarter=quarter,
                year=year,
            )

        # Fetch deals for quarter
        if connection.provider == "salesforce":
            sf_service = get_salesforce_service()
            deals = await sf_service.fetch_opportunities_for_quarter(
                connection_id=connection.id,
                quarter=quarter,
                year=year,
            )
        elif connection.provider == "hubspot":
            hs_service = get_hubspot_service()
            deals = await hs_service.fetch_deals_for_quarter(
                connection_id=connection.id,
                quarter=quarter,
                year=year,
            )
        else:
            deals = []

        # Analyze pipeline
        analysis = forecast_service.analyze_pipeline(
            deals=deals,
            target=target,
            quarter=quarter,
            year=year,
        )

        return analysis

    finally:
        await db.disconnect()


# ===========================================
# AI COACHING
# ===========================================

@router.post("/coaching")
async def get_forecast_coaching(
    request: ForecastCoachingRequest,
    clerk_id: str = Depends(get_current_user_id),
):
    """Get AI coaching for hitting forecast target"""
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        user_id = user.id

        # Default to current quarter
        quarter = request.quarter
        year = request.year
        if quarter is None or year is None:
            q, y = ForecastService.get_current_quarter()
            quarter = quarter or q
            year = year or y

        # Get target
        target = await forecast_service.get_target(
            db=db,
            user_id=user_id,
            quarter=quarter,
            year=year,
            org_id=request.org_id,
        )

        if not target:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No target set for this quarter. Set a target first."
            )

        # Get CRM connection
        connection = await db.crmconnection.find_first(
            where={"userId": user_id, "isActive": True}
        )

        if not connection:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No CRM connected. Connect Salesforce or HubSpot first."
            )

        # Fetch deals for quarter
        if connection.provider == "salesforce":
            sf_service = get_salesforce_service()
            deals = await sf_service.fetch_opportunities_for_quarter(
                connection_id=connection.id,
                quarter=quarter,
                year=year,
            )
        elif connection.provider == "hubspot":
            hs_service = get_hubspot_service()
            deals = await hs_service.fetch_deals_for_quarter(
                connection_id=connection.id,
                quarter=quarter,
                year=year,
            )
        else:
            deals = []

        if not deals:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No deals found closing this quarter."
            )

        # Analyze pipeline
        analysis = forecast_service.analyze_pipeline(
            deals=deals,
            target=target,
            quarter=quarter,
            year=year,
        )

        # Get AI coaching
        ai_service = get_ai_service()
        coaching = await ai_service.generate_forecast_coaching(
            target_amount=analysis.target_amount,
            current_pipeline=analysis.current_pipeline,
            weighted_pipeline=analysis.weighted_pipeline,
            gap=analysis.gap,
            coverage_ratio=analysis.coverage_ratio,
            deals=[d.model_dump() for d in analysis.deals],
            days_remaining=analysis.days_remaining,
            quarter=quarter,
            year=year,
        )

        return {
            "analysis": analysis.model_dump(),
            "coaching": coaching,
        }

    finally:
        await db.disconnect()


# ===========================================
# TEAM FORECAST
# ===========================================

@router.get("/team/{org_id}", response_model=TeamForecastRollup)
async def get_team_forecast(
    org_id: str,
    quarter: Optional[int] = None,
    year: Optional[int] = None,
    clerk_id: str = Depends(get_current_user_id),
):
    """Get team forecast rollup for managers"""
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)

        # Verify permission
        membership = await db.orgmembership.find_first(
            where={"userId": user.id, "orgId": org_id}
        )
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You're not a member of this organization"
            )

        # Default to current quarter
        if quarter is None or year is None:
            q, y = ForecastService.get_current_quarter()
            quarter = quarter or q
            year = year or y

        # Get all team members
        members = await db.orgmembership.find_many(
            where={"orgId": org_id, "isActive": True},
            include={"user": True},
        )

        # Build analyses for each member
        member_analyses = []
        for member in members:
            if not member.user:
                continue

            # Get their target
            target = await forecast_service.get_target(
                db=db,
                user_id=member.userId,
                quarter=quarter,
                year=year,
                org_id=org_id,
            )

            # Get their CRM connection
            connection = await db.crmconnection.find_first(
                where={"userId": member.userId, "isActive": True}
            )

            deals = []
            if connection:
                if connection.provider == "salesforce":
                    sf_service = get_salesforce_service()
                    try:
                        deals = await sf_service.fetch_opportunities_for_quarter(
                            connection_id=connection.id,
                            quarter=quarter,
                            year=year,
                        )
                    except Exception as e:
                        print(f"Error fetching SF deals for {member.userId}: {e}")
                elif connection.provider == "hubspot":
                    hs_service = get_hubspot_service()
                    try:
                        deals = await hs_service.fetch_deals_for_quarter(
                            connection_id=connection.id,
                            quarter=quarter,
                            year=year,
                        )
                    except Exception as e:
                        print(f"Error fetching HS deals for {member.userId}: {e}")

            analysis = forecast_service.analyze_pipeline(
                deals=deals,
                target=target,
                quarter=quarter,
                year=year,
            )

            member_analyses.append((member.userId, analysis))

        # Build rollup
        rollup = await forecast_service.get_team_forecast_rollup(
            db=db,
            org_id=org_id,
            quarter=quarter,
            year=year,
            member_analyses=member_analyses,
        )

        return rollup

    finally:
        await db.disconnect()
