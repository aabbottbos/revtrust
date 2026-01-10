"""
Admin dashboard and metrics routes
"""

from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from prisma import Prisma
from app.auth import get_current_user_id

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/metrics")
async def get_admin_metrics(
    user_id: str = Depends(get_current_user_id)
):
    """
    Get comprehensive admin metrics
    TODO: Add proper admin authentication
    """

    prisma = Prisma()
    await prisma.connect()

    try:
        # Total users
        total_users = await prisma.user.count()

        # Pro users (active subscriptions)
        pro_users = await prisma.user.count(
            where={
                "subscriptionTier": "pro",
                "subscriptionStatus": "active"
            }
        )

        # Free users
        free_users = total_users - pro_users

        # Recent signups (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_signups = await prisma.user.count(
            where={
                "createdAt": {
                    "gte": thirty_days_ago
                }
            }
        )

        # Get last 10 signups
        latest_users = await prisma.user.find_many(
            take=10,
            order={"createdAt": "desc"}
        )

        # Total analyses
        total_analyses = await prisma.analysis.count()

        # Analyses this month
        first_day_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        analyses_this_month = await prisma.analysis.count(
            where={
                "createdAt": {
                    "gte": first_day_of_month
                }
            }
        )

        # Calculate MRR (Monthly Recurring Revenue)
        # Assuming $59/month for Pro tier
        mrr = pro_users * 59

        # Calculate conversion rate
        conversion_rate = (pro_users / total_users * 100) if total_users > 0 else 0

        # Calculate churn (users who were pro but cancelled)
        churned_users = await prisma.user.count(
            where={
                "subscriptionTier": "pro",
                "subscriptionStatus": "canceled"
            }
        )

        churn_rate = (churned_users / max(pro_users + churned_users, 1) * 100)

        return {
            "users": {
                "total": total_users,
                "pro": pro_users,
                "free": free_users,
                "recent_signups_30d": recent_signups,
                "latest": [
                    {
                        "email": u.email,
                        "createdAt": u.createdAt.isoformat(),
                        "tier": u.subscriptionTier,
                        "status": u.subscriptionStatus
                    }
                    for u in latest_users
                ]
            },
            "revenue": {
                "mrr": mrr,
                "arr": mrr * 12,
                "ltv_estimate": mrr * 12 * 2  # Rough 2-year LTV estimate
            },
            "metrics": {
                "conversion_rate": round(conversion_rate, 2),
                "churn_rate": round(churn_rate, 2),
                "total_analyses": total_analyses,
                "analyses_this_month": analyses_this_month
            },
            "updated_at": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"Error fetching admin metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        await prisma.disconnect()


@router.get("/health-check")
async def admin_health_check():
    """Quick health check for admin dashboard"""

    prisma = Prisma()
    await prisma.connect()

    try:
        # Test database connection
        user_count = await prisma.user.count()

        return {
            "status": "healthy",
            "database": "connected",
            "user_count": user_count,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

    finally:
        await prisma.disconnect()
