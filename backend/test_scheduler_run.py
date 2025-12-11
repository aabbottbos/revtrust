"""
Test if the scheduler can actually fire a job
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.jobstores.memory import MemoryJobStore
import pytz
import time
from datetime import datetime
import logging

# Enable APScheduler logging
logging.basicConfig(level=logging.DEBUG)
logging.getLogger('apscheduler').setLevel(logging.DEBUG)

def test_job():
    print(f"🎯 TEST JOB FIRED at {datetime.now()}")

# Create scheduler
jobstores = {'default': MemoryJobStore()}
scheduler = BackgroundScheduler(jobstores=jobstores, timezone=pytz.utc)

print("🚀 Starting scheduler...")
scheduler.start()

# Add a job that runs every minute
trigger = CronTrigger(
    minute='*',  # Every minute
    timezone=pytz.timezone('America/New_York')
)

scheduler.add_job(
    func=test_job,
    trigger=trigger,
    id='test-job',
    replace_existing=True,
    misfire_grace_time=3600
)

print(f"✅ Job added")
jobs = scheduler.get_jobs()
for job in jobs:
    print(f"   Job ID: {job.id}")
    print(f"   Next run: {job.next_run_time}")

print(f"\n⏳ Waiting for 2 minutes to see if job fires...")
print(f"   Current time: {datetime.now()}")

time.sleep(120)

print(f"\n✅ Test complete")
scheduler.shutdown()
