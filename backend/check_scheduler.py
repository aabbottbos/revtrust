"""
Check the current state of the APScheduler
"""

import asyncio
from app.services.scheduler_service import get_scheduler_service
from datetime import datetime
import pytz

async def check_scheduler():
    print("🔍 Checking scheduler state...")

    scheduler_service = get_scheduler_service()
    scheduler = scheduler_service.scheduler

    print(f"\nScheduler running: {scheduler.running}")
    print(f"Scheduler timezone: {scheduler.timezone}")

    jobs = scheduler.get_jobs()
    print(f"\n📋 Found {len(jobs)} scheduled jobs:")

    for job in jobs:
        print(f"\n  Job ID: {job.id}")
        print(f"  Next run: {job.next_run_time}")
        print(f"  Trigger: {job.trigger}")

        # Check if job is past due
        if job.next_run_time:
            now = datetime.now(pytz.utc)
            print(f"  Current time (UTC): {now}")
            if job.next_run_time < now:
                print(f"  ⚠️  Job is PAST DUE by {now - job.next_run_time}")
            else:
                print(f"  ⏳ Job will run in {job.next_run_time - now}")

    return jobs

if __name__ == "__main__":
    jobs = asyncio.run(check_scheduler())
