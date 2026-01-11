"""
Dashboard routes for user dashboard statistics and data
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
from prisma import Prisma
from datetime import datetime, timedelta
import logging

from app.auth import get_current_user_id
from app.routes.analyze import analysis_status_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, Any]:
    """
    Get dashboard statistics for the current user.
    Returns overview stats, subscription info, and recent scans.
    """
    prisma = Prisma()
    await prisma.connect()

    try:
        # Get user info
        user = await prisma.user.find_unique(
            where={"clerkId": user_id}
        )

        if not user:
            # Return defaults for new users
            return {
                "lastScanDate": None,
                "lastScanScore": None,
                "lastScanHealthStatus": None,
                "scansThisMonth": 0,
                "criticalIssuesThisMonth": 0,
                "connectedCRMs": 0,
                "savedScansCount": 0,
                "scheduledScansCount": 0,
                "subscriptionTier": "free",
                "subscriptionStatus": "active",
                "recentScans": []
            }

        # Get connected CRMs count
        crm_count = await prisma.crmconnection.count(
            where={
                "userId": user.id,
                "isActive": True
            }
        )

        # Get scheduled reviews count
        scheduled_count = await prisma.scheduledreview.count(
            where={
                "userId": user.id,
                "isActive": True
            }
        )

        # Get analyses from this month
        first_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Get database analyses for this month
        db_analyses = await prisma.analysis.find_many(
            where={
                "userId": user.id,
                "uploadDate": {"gte": first_of_month}
            },
            order={"uploadDate": "desc"}
        )

        # Also check in-memory store for recent analyses
        memory_analyses = []
        for analysis_id, data in analysis_status_store.items():
            if data.get("user_id") == user_id and data.get("status") == "completed":
                completed_at = data.get("completed_at")
                if completed_at:
                    try:
                        # Parse the ISO timestamp
                        if isinstance(completed_at, str):
                            completed_dt = datetime.fromisoformat(completed_at.replace("Z", "+00:00"))
                        else:
                            completed_dt = completed_at

                        # Add to memory analyses
                        memory_analyses.append({
                            "analysis_id": analysis_id,
                            "filename": data.get("filename", "Unknown"),
                            "health_score": data.get("health_score", 0),
                            "health_status": data.get("health_status", "unknown"),
                            "analyzed_at": completed_at,
                            "total_critical": data.get("total_critical", 0),
                            "source": "memory"
                        })
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Error parsing date for analysis {analysis_id}: {e}")

        # Combine and sort analyses
        all_analyses = []

        # Add database analyses
        for a in db_analyses:
            health_score = a.healthScore or 0
            all_analyses.append({
                "analysis_id": a.id,
                "filename": a.fileName,
                "health_score": health_score,
                "health_status": get_health_status(health_score),
                "analyzed_at": a.uploadDate.isoformat() if a.uploadDate else None,
                "total_critical": a.totalCritical or 0,
                "source": "database"
            })

        # Add memory analyses
        all_analyses.extend(memory_analyses)

        # Sort by date (newest first)
        all_analyses.sort(key=lambda x: x.get("analyzed_at") or "", reverse=True)

        # Calculate stats
        scans_this_month = len([a for a in all_analyses if is_this_month(a.get("analyzed_at"))])
        critical_issues_this_month = sum(a.get("total_critical", 0) for a in all_analyses if is_this_month(a.get("analyzed_at")))

        # Get latest scan info
        last_scan = all_analyses[0] if all_analyses else None

        # Get recent scans for display (up to 5)
        recent_scans = all_analyses[:5]

        # SavedScan count (will be 0 until we add the model)
        saved_scans_count = 0
        try:
            saved_scans_count = await prisma.savedscan.count(
                where={"userId": user.id}
            )
        except Exception:
            # Model doesn't exist yet
            pass

        return {
            "lastScanDate": last_scan.get("analyzed_at") if last_scan else None,
            "lastScanScore": last_scan.get("health_score") if last_scan else None,
            "lastScanHealthStatus": last_scan.get("health_status") if last_scan else None,
            "scansThisMonth": scans_this_month,
            "criticalIssuesThisMonth": critical_issues_this_month,
            "connectedCRMs": crm_count,
            "savedScansCount": saved_scans_count,
            "scheduledScansCount": scheduled_count,
            "subscriptionTier": user.subscriptionTier or "free",
            "subscriptionStatus": user.subscriptionStatus or "active",
            "recentScans": [
                {
                    "analysis_id": a.get("analysis_id"),
                    "filename": a.get("filename"),
                    "health_score": a.get("health_score"),
                    "analyzed_at": a.get("analyzed_at")
                }
                for a in recent_scans
            ]
        }

    finally:
        await prisma.disconnect()


def get_health_status(score: float) -> str:
    """Convert health score to status string"""
    if score >= 75:
        return "excellent"
    elif score >= 50:
        return "good"
    elif score >= 25:
        return "fair"
    return "poor"


def is_this_month(date_str: Optional[str]) -> bool:
    """Check if a date string is from the current month"""
    if not date_str:
        return False
    try:
        if isinstance(date_str, str):
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        else:
            dt = date_str

        now = datetime.now()
        return dt.year == now.year and dt.month == now.month
    except (ValueError, TypeError):
        return False
