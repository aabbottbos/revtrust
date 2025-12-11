"""
APScheduler service for managing scheduled reviews
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.jobstores.memory import MemoryJobStore
from datetime import datetime
import pytz
from prisma import Prisma
from rq import Queue
from redis import Redis
import os
import asyncio


class SchedulerService:
    """Manage scheduled review jobs with APScheduler"""

    def __init__(self):
        # Setup scheduler
        jobstores = {
            'default': MemoryJobStore()
        }

        self.scheduler = BackgroundScheduler(
            jobstores=jobstores,
            timezone=pytz.utc
        )

        # Setup RQ queue
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        redis_conn = Redis.from_url(redis_url)
        self.queue = Queue('scheduled_reviews', connection=redis_conn)

        self.is_running = False

    def start(self):
        """Start the scheduler"""
        if not self.is_running:
            self.scheduler.start()
            self.is_running = True
            print("✅ Scheduler started")

    def stop(self):
        """Stop the scheduler"""
        if self.is_running:
            self.scheduler.shutdown()
            self.is_running = False
            print("⏸️ Scheduler stopped")

    def add_scheduled_review(
        self,
        scheduled_review_id: str,
        schedule: str,
        timezone: str
    ):
        """
        Add a scheduled review to the scheduler

        Args:
            scheduled_review_id: ID of the ScheduledReview
            schedule: Cron expression (e.g., "0 6 * * 1")
            timezone: User's timezone (e.g., "America/New_York")
        """

        # Parse cron expression
        # Format: "minute hour day month day_of_week"
        # Example: "0 6 * * 1" = Monday at 6:00 AM

        parts = schedule.split()
        if len(parts) != 5:
            raise ValueError("Invalid cron expression")

        minute, hour, day, month, day_of_week = parts

        # Create trigger in user's timezone
        user_tz = pytz.timezone(timezone)
        trigger = CronTrigger(
            minute=minute,
            hour=hour,
            day=day,
            month=month,
            day_of_week=day_of_week,
            timezone=user_tz
        )

        # Add job
        self.scheduler.add_job(
            func=self._trigger_review,
            trigger=trigger,
            id=scheduled_review_id,
            args=[scheduled_review_id],
            replace_existing=True,
            misfire_grace_time=3600  # Allow running up to 1 hour late if computer was asleep
        )

        print(f"✅ Scheduled review {scheduled_review_id} added")
        print(f"   Schedule: {schedule}")
        print(f"   Timezone: {timezone}")

        # Calculate next run time
        next_run = self.scheduler.get_job(scheduled_review_id).next_run_time
        return next_run

    def remove_scheduled_review(self, scheduled_review_id: str):
        """Remove a scheduled review from the scheduler"""
        try:
            self.scheduler.remove_job(scheduled_review_id)
            print(f"🗑️ Removed scheduled review {scheduled_review_id}")
        except Exception as e:
            print(f"⚠️ Could not remove job {scheduled_review_id}: {e}")

    def _trigger_review(self, scheduled_review_id: str):
        """
        Triggered by APScheduler at the scheduled time
        Creates a ReviewRun and queues the job in RQ
        """

        print(f"⏰ Scheduled review triggered: {scheduled_review_id}")

        # Create ReviewRun record
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            run = loop.run_until_complete(
                self._create_review_run(scheduled_review_id)
            )

            # Queue the job in RQ
            from app.jobs.scheduled_review_job import execute_scheduled_review

            job = self.queue.enqueue(
                execute_scheduled_review,
                scheduled_review_id,
                run.id,
                job_timeout='30m',  # 30 minute timeout
                retry=3  # Retry up to 3 times on failure
            )

            # Update run with job ID
            loop.run_until_complete(
                self._update_run_job_id(run.id, job.id)
            )

            print(f"✅ Job queued: {job.id}")

        finally:
            loop.close()

    async def _create_review_run(self, scheduled_review_id: str):
        """Create a ReviewRun record"""
        prisma = Prisma()
        await prisma.connect()

        try:
            run = await prisma.reviewrun.create(
                data={
                    "scheduledReviewId": scheduled_review_id,
                    "status": "queued"
                }
            )
            return run
        finally:
            await prisma.disconnect()

    async def _update_run_job_id(self, run_id: str, job_id: str):
        """Update ReviewRun with RQ job ID"""
        prisma = Prisma()
        await prisma.connect()

        try:
            await prisma.reviewrun.update(
                where={"id": run_id},
                data={"jobId": job_id}
            )
        finally:
            await prisma.disconnect()

    async def sync_all_schedules(self):
        """
        Sync all active scheduled reviews from database to scheduler
        Call this on startup
        """
        prisma = Prisma()
        await prisma.connect()

        try:
            scheduled_reviews = await prisma.scheduledreview.find_many(
                where={"isActive": True}
            )

            print(f"📅 Syncing {len(scheduled_reviews)} scheduled reviews...")

            for review in scheduled_reviews:
                try:
                    next_run = self.add_scheduled_review(
                        review.id,
                        review.schedule,
                        review.timezone
                    )

                    # Update nextRunAt in database
                    await prisma.scheduledreview.update(
                        where={"id": review.id},
                        data={"nextRunAt": next_run}
                    )

                except Exception as e:
                    print(f"⚠️ Failed to sync {review.id}: {e}")

            print("✅ Scheduler sync complete")

        finally:
            await prisma.disconnect()


# Global scheduler instance
_scheduler_service = None

def get_scheduler_service() -> SchedulerService:
    """Get scheduler service singleton"""
    global _scheduler_service
    if _scheduler_service is None:
        _scheduler_service = SchedulerService()
    return _scheduler_service
