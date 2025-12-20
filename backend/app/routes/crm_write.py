"""
API endpoints for writing updates to CRM systems and fetching flagged deals.
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends
from prisma import Prisma
import uuid

from app.auth import get_current_user_id
from app.services.crm_write_service import get_crm_write_service
from app.models.crm_write import (
    DealUpdateRequest,
    DealUpdateResponse,
    BulkUpdateRequest,
    BulkUpdateResponse,
    DealWithIssues,
    FlaggedDealsResponse,
)
from app.routes.analyze import analysis_status_store

router = APIRouter(prefix="/api/crm", tags=["CRM Write"])


async def get_user_from_clerk_id(db: Prisma, clerk_id: str):
    """Get database user from Clerk ID."""
    user = await db.user.find_unique(where={"clerkId": clerk_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure you have an account."
        )
    return user


@router.patch("/deals/{crm_type}/{deal_id}", response_model=DealUpdateResponse)
async def update_deal(
    crm_type: str,
    deal_id: str,
    update: DealUpdateRequest,
    clerk_id: str = Depends(get_current_user_id),
):
    """
    Update a single deal in the connected CRM.
    """
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)

        # Ensure the path params match the body
        update.crm_type = crm_type
        update.crm_deal_id = deal_id

        service = get_crm_write_service()
        result = await service.update_deal(user.id, update)

        return result

    finally:
        await db.disconnect()


@router.post("/deals/bulk", response_model=BulkUpdateResponse)
async def bulk_update_deals(
    request: BulkUpdateRequest,
    clerk_id: str = Depends(get_current_user_id),
):
    """
    Update multiple deals in one request.
    """
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)

        service = get_crm_write_service()
        results = []
        successful = 0
        failed = 0

        for update in request.updates:
            result = await service.update_deal(user.id, update)
            results.append(result)
            if result.success:
                successful += 1
            else:
                failed += 1

        return BulkUpdateResponse(
            total=len(request.updates),
            successful=successful,
            failed=failed,
            results=results
        )

    finally:
        await db.disconnect()


@router.get("/connections/status")
async def get_crm_connection_status(
    clerk_id: str = Depends(get_current_user_id),
):
    """
    Check if user has active CRM connections with write permissions.
    """
    db = Prisma()
    await db.connect()

    try:
        user = await get_user_from_clerk_id(db, clerk_id)

        connections = await db.crmconnection.find_many(
            where={
                "userId": user.id,
                "isActive": True
            }
        )

        return {
            "hasConnection": len(connections) > 0,
            "connections": [
                {
                    "id": c.id,
                    "provider": c.provider,
                    "isActive": c.isActive,
                    "accountName": c.accountName,
                    "connectedAt": c.createdAt.isoformat() if c.createdAt else None,
                }
                for c in connections
            ]
        }

    finally:
        await db.disconnect()


@router.get("/analysis/{analysis_id}/flagged-deals", response_model=FlaggedDealsResponse)
async def get_flagged_deals(
    analysis_id: str,
    clerk_id: str = Depends(get_current_user_id),
):
    """
    Get all deals with issues for the deal review wizard.
    Reads from the in-memory analysis store.
    """
    # Check if analysis exists in memory store
    if analysis_id not in analysis_status_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )

    analysis_data = analysis_status_store[analysis_id]

    # Check if analysis is complete
    if analysis_data.get("status") != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Analysis is not complete. Status: {analysis_data.get('status')}"
        )

    # Get the result data
    result = analysis_data.get("result", {})
    deals = result.get("deals", [])
    violations = result.get("violations", [])

    # Group violations by deal name
    violations_by_deal = {}
    for v in violations:
        deal_name = v.get("deal_name", "Unknown")
        if deal_name not in violations_by_deal:
            violations_by_deal[deal_name] = []
        violations_by_deal[deal_name].append(v)

    # Get user's CRM connection to determine CRM type
    db = Prisma()
    await db.connect()
    try:
        user = await get_user_from_clerk_id(db, clerk_id)
        connection = await db.crmconnection.find_first(
            where={
                "userId": user.id,
                "isActive": True
            }
        )
        crm_type = connection.provider if connection else "salesforce"
    finally:
        await db.disconnect()

    # Build flagged deals list
    flagged_deals = []
    for deal in deals:
        deal_name = deal.get("deal_name") or deal.get("opportunity_name") or deal.get("name", "Unknown")
        deal_violations = violations_by_deal.get(deal_name, [])

        # Skip deals with no violations
        if not deal_violations:
            continue

        # Build issues list from violations
        issues = []
        for v in deal_violations:
            issues.append({
                "id": str(uuid.uuid4()),
                "type": v.get("rule_id", "unknown"),
                "rule_name": v.get("rule_name", "Unknown Rule"),
                "category": v.get("category", "OTHER"),
                "severity": v.get("severity", "warning").lower(),
                "message": v.get("message", ""),
                "field": v.get("field_name"),
                "current_value": v.get("current_value"),
                "suggested_value": v.get("expected_value"),
                "recommendation": v.get("remediation_action"),
                "remediation_owner": v.get("remediation_owner"),
            })

        # Get deal ID (try multiple fields)
        deal_id = (
            deal.get("opportunity_id") or
            deal.get("deal_id") or
            deal.get("id") or
            str(uuid.uuid4())
        )

        flagged_deals.append(DealWithIssues(
            id=deal_id,
            crm_id=deal_id,
            crm_type=crm_type,
            name=deal_name,
            account_name=deal.get("account_name") or deal.get("company"),
            stage=deal.get("stage") or deal.get("deal_stage"),
            amount=float(deal.get("amount", 0)) if deal.get("amount") else None,
            close_date=deal.get("close_date"),
            next_step=deal.get("next_step") or deal.get("next_steps"),
            owner_name=deal.get("owner_name") or deal.get("owner"),
            last_activity_date=deal.get("last_activity_date"),
            probability=int(deal.get("probability", 0)) if deal.get("probability") else None,
            description=deal.get("description"),
            issues=issues
        ))

    # Sort by number of critical issues (descending)
    flagged_deals.sort(
        key=lambda d: sum(1 for i in d.issues if i.get("severity") == "critical"),
        reverse=True
    )

    return FlaggedDealsResponse(
        analysis_id=analysis_id,
        total_flagged=len(flagged_deals),
        deals=flagged_deals
    )
