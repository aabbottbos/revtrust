"""
Routes for managing scheduled reviews
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from prisma import Prisma
from app.auth import get_current_user_id, get_current_user_email
from app.services.scheduler_service import get_scheduler_service

router = APIRouter(prefix="/api/scheduled-reviews", tags=["Scheduled Reviews"])


async def get_or_create_user(prisma: Prisma, clerk_id: str, email: Optional[str] = None):
    """Get user by Clerk ID or create if doesn't exist"""
    user = await prisma.user.find_unique(where={"clerkId": clerk_id})

    if not user:
        # Auto-create user on first access
        # Use provided email or generate a placeholder
        user_email = email or f"{clerk_id}@clerk.user"
        user = await prisma.user.create(data={
            "clerkId": clerk_id,
            "email": user_email
        })

    return user


class CreateScheduledReviewRequest(BaseModel):
    name: str
    description: Optional[str] = None
    crm_connection_id: str
    schedule: str  # Cron expression
    timezone: str = "America/New_York"
    delivery_channels: List[str] = []
    email_recipients: List[str] = []
    slack_webhook_url: Optional[str] = None


class UpdateScheduledReviewRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    schedule: Optional[str] = None
    timezone: Optional[str] = None
    delivery_channels: Optional[List[str]] = None
    email_recipients: Optional[List[str]] = None
    slack_webhook_url: Optional[str] = None
    is_active: Optional[bool] = None


@router.post("")
async def create_scheduled_review(
    request: CreateScheduledReviewRequest,
    user_id: str = Depends(get_current_user_id),
    email: Optional[str] = Depends(get_current_user_email)
):
    """Create a new scheduled review"""

    prisma = Prisma()
    await prisma.connect()

    try:
        # Get or create user
        user = await get_or_create_user(prisma, user_id, email)

        # Verify CRM connection belongs to user
        connection = await prisma.crmconnection.find_first(
            where={
                "id": request.crm_connection_id,
                "userId": user.id
            }
        )

        if not connection:
            raise HTTPException(404, "CRM connection not found")

        # Create scheduled review
        import json
        scheduled_review = await prisma.scheduledreview.create(
            data={
                "user": {"connect": {"id": user.id}},
                "name": request.name,
                "description": request.description,
                "crmConnection": {"connect": {"id": request.crm_connection_id}},
                "schedule": request.schedule,
                "timezone": request.timezone,
                "deliveryChannels": json.dumps(request.delivery_channels),
                "emailRecipients": request.email_recipients,
                "slackWebhookUrl": request.slack_webhook_url
            }
        )

        # Add to scheduler
        scheduler = get_scheduler_service()
        next_run = scheduler.add_scheduled_review(
            scheduled_review.id,
            request.schedule,
            request.timezone
        )

        # Update nextRunAt
        await prisma.scheduledreview.update(
            where={"id": scheduled_review.id},
            data={"nextRunAt": next_run}
        )

        return {
            "id": scheduled_review.id,
            "name": scheduled_review.name,
            "schedule": scheduled_review.schedule,
            "timezone": scheduled_review.timezone,
            "next_run_at": next_run.isoformat() if next_run else None,
            "is_active": scheduled_review.isActive
        }

    finally:
        await prisma.disconnect()


@router.get("")
async def list_scheduled_reviews(
    user_id: str = Depends(get_current_user_id),
    email: Optional[str] = Depends(get_current_user_email)
):
    """List user's scheduled reviews"""

    prisma = Prisma()
    await prisma.connect()

    try:
        # Get or create user
        user = await get_or_create_user(prisma, user_id, email)

        reviews = await prisma.scheduledreview.find_many(
            where={"userId": user.id},
            include={"crmConnection": True},
            order={"createdAt": "desc"}
        )

        return {
            "scheduled_reviews": [
                {
                    "id": r.id,
                    "name": r.name,
                    "description": r.description,
                    "crm_provider": r.crmConnection.provider,
                    "crm_account": r.crmConnection.accountName,
                    "schedule": r.schedule,
                    "timezone": r.timezone,
                    "delivery_channels": r.deliveryChannels,
                    "is_active": r.isActive,
                    "last_run_at": r.lastRunAt.isoformat() + "-05:00" if r.lastRunAt else None,
                    "next_run_at": r.nextRunAt.isoformat() + "-05:00" if r.nextRunAt else None,
                    "created_at": r.createdAt.isoformat() + "-05:00"
                }
                for r in reviews
            ]
        }
    finally:
        await prisma.disconnect()


@router.get("/{review_id}")
async def get_scheduled_review(
    review_id: str,
    user_id: str = Depends(get_current_user_id),
    email: Optional[str] = Depends(get_current_user_email)
):
    """Get a specific scheduled review"""

    prisma = Prisma()
    await prisma.connect()

    try:
        # Get or create user
        user = await get_or_create_user(prisma, user_id, email)

        review = await prisma.scheduledreview.find_first(
            where={
                "id": review_id,
                "userId": user.id
            },
            include={"crmConnection": True}
        )

        if not review:
            raise HTTPException(404, "Scheduled review not found")

        return {
            "id": review.id,
            "name": review.name,
            "description": review.description,
            "crm_connection_id": review.crmConnectionId,
            "crm_provider": review.crmConnection.provider,
            "schedule": review.schedule,
            "timezone": review.timezone,
            "delivery_channels": review.deliveryChannels,
            "email_recipients": review.emailRecipients,
            "slack_webhook_url": review.slackWebhookUrl,
            "is_active": review.isActive,
            "last_run_at": review.lastRunAt.isoformat() if review.lastRunAt else None,
            "next_run_at": review.nextRunAt.isoformat() if review.nextRunAt else None,
            "created_at": review.createdAt.isoformat()
        }
    finally:
        await prisma.disconnect()


@router.patch("/{review_id}")
async def update_scheduled_review(
    review_id: str,
    request: UpdateScheduledReviewRequest,
    user_id: str = Depends(get_current_user_id),
    email: Optional[str] = Depends(get_current_user_email)
):
    """Update a scheduled review"""

    prisma = Prisma()
    await prisma.connect()

    try:
        # Get or create user
        user = await get_or_create_user(prisma, user_id, email)

        # Verify ownership
        review = await prisma.scheduledreview.find_first(
            where={
                "id": review_id,
                "userId": user.id
            }
        )

        if not review:
            raise HTTPException(404, "Scheduled review not found")

        # Build update data
        import json
        update_data = {}
        if request.name is not None:
            update_data["name"] = request.name
        if request.description is not None:
            update_data["description"] = request.description
        if request.schedule is not None:
            update_data["schedule"] = request.schedule
        if request.timezone is not None:
            update_data["timezone"] = request.timezone
        if request.delivery_channels is not None:
            update_data["deliveryChannels"] = json.dumps(request.delivery_channels)
        if request.email_recipients is not None:
            update_data["emailRecipients"] = request.email_recipients
        if request.slack_webhook_url is not None:
            update_data["slackWebhookUrl"] = request.slack_webhook_url
        if request.is_active is not None:
            update_data["isActive"] = request.is_active

        # Update in database
        updated_review = await prisma.scheduledreview.update(
            where={"id": review_id},
            data=update_data
        )

        # Update scheduler if schedule/timezone changed
        scheduler = get_scheduler_service()

        if request.schedule or request.timezone or request.is_active is not None:
            if updated_review.isActive:
                next_run = scheduler.add_scheduled_review(
                    updated_review.id,
                    updated_review.schedule,
                    updated_review.timezone
                )

                await prisma.scheduledreview.update(
                    where={"id": review_id},
                    data={"nextRunAt": next_run}
                )
            else:
                scheduler.remove_scheduled_review(review_id)

                await prisma.scheduledreview.update(
                    where={"id": review_id},
                    data={"nextRunAt": None}
                )

        return {"status": "updated"}

    finally:
        await prisma.disconnect()


@router.delete("/{review_id}")
async def delete_scheduled_review(
    review_id: str,
    user_id: str = Depends(get_current_user_id),
    email: Optional[str] = Depends(get_current_user_email)
):
    """Delete a scheduled review"""

    prisma = Prisma()
    await prisma.connect()

    try:
        # Get or create user
        user = await get_or_create_user(prisma, user_id, email)

        # Verify ownership
        review = await prisma.scheduledreview.find_first(
            where={
                "id": review_id,
                "userId": user.id
            }
        )

        if not review:
            raise HTTPException(404, "Scheduled review not found")

        # Remove from scheduler
        scheduler = get_scheduler_service()
        scheduler.remove_scheduled_review(review_id)

        # Delete from database
        await prisma.scheduledreview.delete(
            where={"id": review_id}
        )

        return {"status": "deleted"}

    finally:
        await prisma.disconnect()


@router.post("/{review_id}/run-now")
async def run_review_now(
    review_id: str,
    user_id: str = Depends(get_current_user_id),
    email: Optional[str] = Depends(get_current_user_email)
):
    """Manually trigger a scheduled review to run immediately"""

    prisma = Prisma()
    await prisma.connect()

    try:
        # Get or create user
        user = await get_or_create_user(prisma, user_id, email)

        # Verify ownership
        review = await prisma.scheduledreview.find_first(
            where={
                "id": review_id,
                "userId": user.id
            }
        )

        if not review:
            raise HTTPException(404, "Scheduled review not found")

        # Create run record
        run = await prisma.reviewrun.create(
            data={
                "scheduledReviewId": review_id,
                "status": "queued"
            }
        )

        # Queue the job
        from app.jobs.scheduled_review_job import execute_scheduled_review
        from rq import Queue
        from redis import Redis
        import os

        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        redis_conn = Redis.from_url(redis_url)
        queue = Queue('scheduled_reviews', connection=redis_conn)

        job = queue.enqueue(
            execute_scheduled_review,
            review_id,
            run.id,
            job_timeout='30m'
        )

        # Update run with job ID
        await prisma.reviewrun.update(
            where={"id": run.id},
            data={"jobId": job.id}
        )

        return {
            "status": "queued",
            "run_id": run.id,
            "job_id": job.id
        }

    finally:
        await prisma.disconnect()


@router.get("/{review_id}/runs")
async def get_review_runs(
    review_id: str,
    user_id: str = Depends(get_current_user_id),
    email: Optional[str] = Depends(get_current_user_email),
    limit: int = 20
):
    """Get run history for a scheduled review"""

    prisma = Prisma()
    await prisma.connect()

    try:
        # Get or create user
        user = await get_or_create_user(prisma, user_id, email)

        # Verify ownership
        review = await prisma.scheduledreview.find_first(
            where={
                "id": review_id,
                "userId": user.id
            }
        )

        if not review:
            raise HTTPException(404, "Scheduled review not found")

        # Get runs
        runs = await prisma.reviewrun.find_many(
            where={"scheduledReviewId": review_id},
            order={"startedAt": "desc"},
            take=limit
        )

        return {
            "runs": [
                {
                    "id": r.id,
                    "status": r.status,
                    "started_at": r.startedAt.isoformat(),
                    "completed_at": r.completedAt.isoformat() if r.completedAt else None,
                    "deals_analyzed": r.dealsAnalyzed,
                    "health_score": r.healthScore,
                    "issues_found": r.issuesFound,
                    "high_risk_deals": r.highRiskDeals,
                    "error_message": r.errorMessage,
                    "retry_count": r.retryCount,
                    "analysis_id": r.analysisId
                }
                for r in runs
            ]
        }

    finally:
        await prisma.disconnect()

