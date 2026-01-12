"""
Routes for direct CRM scanning (without scheduling)
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Optional
from prisma import Prisma
from datetime import datetime
import uuid
import logging

from app.auth import get_current_user_id, get_current_user_email
from app.services.salesforce_service import get_salesforce_service
from app.services.hubspot_service import get_hubspot_service
from app.utils.business_rules_engine import ContextualBusinessRulesEngine
from app.routes.analyze import analysis_status_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scan", tags=["Scan"])


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


@router.post("/crm/{connection_id}")
async def scan_crm(
    connection_id: str,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    email: Optional[str] = Depends(get_current_user_email)
):
    """
    Start a scan from a connected CRM.
    Returns an analysis_id that can be used to poll for status.
    """
    prisma = Prisma()
    await prisma.connect()

    try:
        # Get user
        user = await get_or_create_user(prisma, user_id, email)

        # Verify connection belongs to user
        connection = await prisma.crmconnection.find_first(
            where={
                "id": connection_id,
                "userId": user.id,
                "isActive": True
            }
        )

        if not connection:
            raise HTTPException(404, "CRM connection not found or inactive")

        # Generate analysis ID
        analysis_id = str(uuid.uuid4())

        # Initialize status in memory store
        analysis_status_store[analysis_id] = {
            "status": "pending",
            "progress": 0,
            "current_step": "Connecting to CRM...",
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "user_id": user_id,
            "filename": f"{connection.provider.capitalize()} - {connection.accountName or 'CRM Scan'}",
            "source": "crm",
            "crm_connection_id": connection_id
        }

        # Start background processing
        background_tasks.add_task(
            process_crm_scan_background,
            analysis_id=analysis_id,
            connection_id=connection_id,
            user_id=user_id,
            user_db_id=user.id
        )

        return {
            "analysis_id": analysis_id,
            "status": "pending",
            "message": f"Started scan from {connection.provider}"
        }

    finally:
        await prisma.disconnect()


async def process_crm_scan_background(
    analysis_id: str,
    connection_id: str,
    user_id: str,
    user_db_id: str
):
    """Background task to process a CRM scan"""

    prisma = Prisma()
    await prisma.connect()

    try:
        logger.info(f"🔄 Starting CRM scan: {analysis_id}")

        # Update status
        analysis_status_store[analysis_id]["status"] = "processing"
        analysis_status_store[analysis_id]["progress"] = 10
        analysis_status_store[analysis_id]["current_step"] = "Fetching deals from CRM..."
        analysis_status_store[analysis_id]["updated_at"] = datetime.utcnow().isoformat() + "Z"

        # Get connection
        connection = await prisma.crmconnection.find_unique(
            where={"id": connection_id}
        )

        if not connection:
            raise Exception("CRM connection not found")

        # Fetch deals from CRM
        deals = await fetch_deals_from_crm(connection)

        if not deals or len(deals) == 0:
            # No deals found
            analysis_status_store[analysis_id].update({
                "status": "completed",
                "progress": 100,
                "current_step": "Complete",
                "updated_at": datetime.utcnow().isoformat() + "Z",
                "completed_at": datetime.utcnow().isoformat() + "Z",
                "health_score": 0,
                "health_status": "unknown",
                "total_deals": 0,
                "deals_with_issues": 0,
                "total_critical": 0,
                "total_warnings": 0,
                "error": "No deals found in CRM"
            })
            return

        logger.info(f"✓ Fetched {len(deals)} deals from CRM")

        # Update status
        analysis_status_store[analysis_id]["progress"] = 40
        analysis_status_store[analysis_id]["current_step"] = "Analyzing pipeline data..."
        analysis_status_store[analysis_id]["updated_at"] = datetime.utcnow().isoformat() + "Z"

        # Run business rules analysis
        org_id = None
        membership = await prisma.orgmembership.find_first(
            where={"userId": user_db_id, "isActive": True}
        )
        if membership:
            org_id = membership.orgId

        rules_engine = ContextualBusinessRulesEngine()
        await rules_engine.load_context(prisma, user_id=user_db_id, org_id=org_id)

        analysis_result = rules_engine.analyze_deals(deals)

        # Update status
        analysis_status_store[analysis_id]["progress"] = 80
        analysis_status_store[analysis_id]["current_step"] = "Generating report..."
        analysis_status_store[analysis_id]["updated_at"] = datetime.utcnow().isoformat() + "Z"

        # Calculate stats
        health_score = analysis_result["health_score"]
        violations = analysis_result["violations"]

        total_deals = len(deals)
        deals_with_issues = len(set(v.get("deal_id") for v in violations if v.get("deal_id")))
        total_critical = len([v for v in violations if v.get("severity") == "CRITICAL"])
        total_warnings = len([v for v in violations if v.get("severity") == "WARNING"])

        # Determine health status
        if health_score >= 75:
            health_status = "excellent"
        elif health_score >= 50:
            health_status = "good"
        elif health_score >= 25:
            health_status = "fair"
        else:
            health_status = "poor"

        # Group violations by deal
        violations_by_deal = {}
        for violation in violations:
            deal_id = violation.get("deal_id", "")
            if deal_id not in violations_by_deal:
                violations_by_deal[deal_id] = []
            violations_by_deal[deal_id].append(violation)

        # Build deals summary
        deals_summary = []
        for deal in deals:
            deal_id = deal.get("id", "")
            deal_violations = violations_by_deal.get(deal_id, [])
            deals_summary.append({
                "deal_id": deal_id,
                "deal_name": deal.get("name", "Unknown"),
                "amount": deal.get("amount"),
                "stage": deal.get("stage"),
                "close_date": deal.get("close_date"),
                "severity": "CRITICAL" if any(v.get("severity") == "CRITICAL" for v in deal_violations) else
                           "WARNING" if any(v.get("severity") == "WARNING" for v in deal_violations) else
                           "INFO" if deal_violations else "NONE",
                "total_issues": len(deal_violations),
                "critical_count": len([v for v in deal_violations if v.get("severity") == "CRITICAL"]),
                "warning_count": len([v for v in deal_violations if v.get("severity") == "WARNING"]),
                "info_count": len([v for v in deal_violations if v.get("severity") == "INFO"])
            })

        # Update connection last sync
        await prisma.crmconnection.update(
            where={"id": connection_id},
            data={"lastSyncAt": datetime.utcnow()}
        )

        # Complete status update
        analysis_status_store[analysis_id].update({
            "status": "completed",
            "progress": 100,
            "current_step": "Complete",
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "completed_at": datetime.utcnow().isoformat() + "Z",
            "health_score": health_score,
            "health_status": health_status,
            "total_deals": total_deals,
            "deals_with_issues": deals_with_issues,
            "total_critical": total_critical,
            "total_warnings": total_warnings,
            "issues_summary": analysis_result.get("issues_summary", []),
            "deals_summary": deals_summary,
            "violations": violations,
            "violations_by_deal": violations_by_deal
        })

        logger.info(f"✅ CRM scan complete: {analysis_id}")
        logger.info(f"   Health Score: {health_score}")
        logger.info(f"   Deals: {total_deals}, Issues: {len(violations)}")

    except Exception as e:
        logger.error(f"❌ CRM scan failed: {e}", exc_info=True)
        analysis_status_store[analysis_id].update({
            "status": "failed",
            "progress": 0,
            "current_step": "Failed",
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "error": str(e)
        })

    finally:
        await prisma.disconnect()


async def fetch_deals_from_crm(connection) -> list:
    """Fetch deals from a CRM connection"""

    if connection.provider == "salesforce":
        sf_service = get_salesforce_service()
        deals = await sf_service.fetch_opportunities(connection_id=connection.id)

    elif connection.provider == "hubspot":
        hs_service = get_hubspot_service()
        deals = await hs_service.fetch_deals(connection_id=connection.id)

    else:
        raise Exception(f"Unsupported CRM provider: {connection.provider}")

    return deals
