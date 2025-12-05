# Session 21: Job Scheduling System - Progress Report

**Date:** December 4, 2025
**Status:** 55% Complete (Foundation Built)
**Remaining Work:** ~45 minutes of development

---

## ✅ COMPLETED (Parts 1-3)

### 1. Dependencies & Infrastructure ✅
- **Redis installed and running** via Homebrew
  - Service: `brew services start redis`
  - Connection tested: `PONG` response confirmed
  - URL configured: `redis://localhost:6379/0`

- **Python packages installed:**
  - `apscheduler==3.11.1` - Cron-based scheduling
  - `rq==2.6.1` - Background job queue
  - `redis==7.1.0` - Redis client
  - `pytz==2025.2` - Timezone support

### 2. Database Schema ✅
**Location:** `backend/prisma/schema.prisma`

Added two new models:

#### ScheduledReview Model
```prisma
- id, userId, name, description
- crmConnectionId (links to Salesforce/HubSpot)
- schedule (cron format: "0 6 * * 1")
- timezone (user-specific: "America/New_York")
- deliveryChannels, emailRecipients, slackWebhookUrl (for Session 22)
- isActive, lastRunAt, nextRunAt
- Indexes on: [userId, isActive], [nextRunAt, isActive]
```

#### ReviewRun Model
```prisma
- id, scheduledReviewId
- status ("queued" | "running" | "completed" | "failed")
- startedAt, completedAt
- dealsAnalyzed, healthScore, issuesFound, highRiskDeals
- errorMessage, retryCount
- analysisId (link to Analysis for web view)
- jobId (RQ job ID for monitoring)
- Indexes on: [scheduledReviewId, status], [status, startedAt]
```

**Migration Status:** Applied via `prisma db push` (shadow DB workaround)

### 3. RQ Worker Infrastructure ✅
**Location:** `backend/app/worker.py`

- Connects to Redis at `REDIS_URL`
- Defines two queues:
  - `scheduled_reviews` (priority queue)
  - `default` (fallback queue)
- Worker listens to both queues
- Ready to process jobs when started

### 4. Job Execution Service ✅
**Location:** `backend/app/services/review_job_service.py`

**ReviewJobService** - Orchestrates the entire review process:

```python
async def execute_review(scheduled_review_id, run_id):
    1. Update ReviewRun status to "running"
    2. Fetch scheduled review config from DB
    3. Fetch deals from CRM (Salesforce or HubSpot)
    4. Run business rules analysis
    5. Calculate health score & violations
    6. Store results in ReviewRun
    7. Update ScheduledReview.lastRunAt
    8. Return success/failure
```

**Features:**
- ✅ Fetches from Salesforce OR HubSpot
- ✅ Uses existing BusinessRulesEngine
- ✅ Comprehensive error handling & logging
- ✅ Updates database with results
- ✅ Emoji-rich console output for debugging

### 5. RQ Job Wrapper ✅
**Location:** `backend/app/jobs/scheduled_review_job.py`

```python
def execute_scheduled_review(scheduled_review_id, run_id):
    # This is what RQ workers execute
    # Wraps async ReviewJobService in event loop
```

- Bridges RQ (sync) with ReviewJobService (async)
- Creates new event loop for each job
- Handles exceptions and cleanup
- Returns structured result

---

## 🚧 IN PROGRESS / NOT STARTED

### 6. SchedulerService with APScheduler ❌
**Location:** `backend/app/services/scheduler_service.py` (NOT CREATED YET)

**What it needs to do:**
- Manage APScheduler instance
- Add/remove jobs based on cron schedules
- Convert user timezone to UTC for execution
- Trigger jobs at scheduled time
- Queue jobs in RQ for execution
- Sync schedules from database on startup

**Key Methods Needed:**
```python
class SchedulerService:
    def start() - Start scheduler
    def stop() - Shutdown gracefully
    def add_scheduled_review(id, schedule, timezone)
    def remove_scheduled_review(id)
    async def sync_all_schedules() - Load from DB on startup
    def _trigger_review(id) - Called by APScheduler
```

### 7. API Routes for Schedule Management ❌
**Location:** `backend/app/routes/scheduled_reviews.py` (NOT CREATED YET)

**Endpoints Needed:**
```
POST   /api/scheduled-reviews          - Create new schedule
GET    /api/scheduled-reviews          - List user's schedules
GET    /api/scheduled-reviews/{id}     - Get specific schedule
PATCH  /api/scheduled-reviews/{id}     - Update schedule
DELETE /api/scheduled-reviews/{id}     - Delete schedule
POST   /api/scheduled-reviews/{id}/run-now  - Manual trigger
GET    /api/scheduled-reviews/{id}/runs     - Run history
```

**Business Logic:**
- Verify user owns CRM connection
- Check user has Team tier or higher
- Add to scheduler when created
- Update scheduler when modified
- Remove from scheduler when deleted/deactivated

### 8. Main.py Startup Integration ❌
**Location:** `backend/app/main.py` (NEEDS UPDATE)

**Required Changes:**
```python
from contextlib import asynccontextmanager
from app.services.scheduler_service import get_scheduler_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    scheduler = get_scheduler_service()
    scheduler.start()
    await scheduler.sync_all_schedules()
    yield
    # Shutdown
    scheduler.stop()

app = FastAPI(lifespan=lifespan)
```

### 9. Worker Start Script ❌
**Location:** `backend/start_worker.sh` (NOT CREATED YET)

```bash
#!/bin/bash
cd "$(dirname "$0")"
poetry run python -m app.worker
```

### 10. Testing & Validation ❌
**Not Started**

**Test Plan:**
1. Start worker: `./start_worker.sh`
2. Create scheduled review via API
3. Verify job added to APScheduler
4. Trigger manual run: `POST /api/scheduled-reviews/{id}/run-now`
5. Watch worker logs for job execution
6. Verify ReviewRun created with results
7. Check run history endpoint
8. Test cron schedules with different timezones

---

## 📂 FILE STRUCTURE (Current State)

```
backend/
├── app/
│   ├── jobs/
│   │   ├── __init__.py ✅
│   │   └── scheduled_review_job.py ✅
│   ├── services/
│   │   ├── review_job_service.py ✅
│   │   ├── salesforce_service.py ✅
│   │   ├── hubspot_service.py ✅
│   │   ├── encryption_service.py ✅
│   │   ├── ai_service.py ✅
│   │   └── scheduler_service.py ❌ NOT CREATED
│   ├── routes/
│   │   └── scheduled_reviews.py ❌ NOT CREATED
│   ├── worker.py ✅
│   └── main.py ⚠️ NEEDS UPDATE
├── prisma/
│   └── schema.prisma ✅ UPDATED
├── .env ✅ UPDATED (REDIS_URL added)
└── start_worker.sh ❌ NOT CREATED
```

---

## 🎯 NEXT SESSION CHECKLIST

To complete Session 21, you need to:

1. **Create SchedulerService** (~15 min)
   - Copy implementation from Session 21 prompt
   - Test cron parsing works
   - Test timezone conversion

2. **Create scheduled_reviews.py routes** (~20 min)
   - Copy 7 endpoints from Session 21 prompt
   - Register router in main.py
   - Test CRUD operations

3. **Update main.py** (~2 min)
   - Add lifespan context manager
   - Start scheduler on startup
   - Sync schedules from database

4. **Create start_worker.sh** (~1 min)
   - Simple bash script
   - Make executable

5. **End-to-End Testing** (~15 min)
   - Start backend
   - Start worker in separate terminal
   - Create schedule via API
   - Trigger manual run
   - Verify results in database
   - Check worker logs

**Total Estimated Time:** ~53 minutes

---

## 🔑 KEY DECISIONS MADE

### Architecture: APScheduler + RQ
- **Why APScheduler?** Simple, Python-native, perfect for <1000 schedules
- **Why RQ?** Simpler than Celery, easy monitoring, Redis-based
- **Migration Path:** Easy to switch to Celery Beat if needed

### Cron Format
- Standard 5-field cron: `minute hour day month day_of_week`
- Examples:
  - `0 6 * * *` = Every day at 6 AM
  - `0 6 * * 1` = Every Monday at 6 AM
  - `0 6 * * 1,3,5` = Mon, Wed, Fri at 6 AM

### Timezone Handling
- User specifies timezone (e.g., "America/New_York")
- APScheduler converts to UTC for execution
- Stored in ScheduledReview.timezone

### Database Schema
- Used `prisma db push` instead of `migrate dev` (shadow DB issue)
- Added indexes for performance:
  - `[userId, isActive]` - List user's active schedules
  - `[nextRunAt, isActive]` - Find upcoming jobs
  - `[scheduledReviewId, status]` - Filter runs by status

---

## 🐛 KNOWN ISSUES

1. **Prisma Shadow Database**
   - Error: "permission denied to create database"
   - Workaround: Use `prisma db push` instead of `migrate dev`
   - Impact: No migration history, but schema is synced

2. **No AI Analysis Yet**
   - ReviewJobService only runs business rules
   - AI analysis integration planned but simplified for MVP
   - Can add later without breaking changes

3. **No Email/Slack Delivery**
   - Fields exist in database (deliveryChannels, emailRecipients, slackWebhookUrl)
   - Actual delivery is Session 22
   - Results are stored in database for now

---

## 📊 SESSION STATS

- **Time Spent:** ~2 hours
- **Files Created:** 6
- **Files Modified:** 2
- **Lines of Code:** ~450
- **Database Tables Added:** 2
- **Dependencies Installed:** 5
- **Tests Written:** 0 (manual testing planned)

---

## 🚀 QUICK START (When Resumed)

```bash
# 1. Ensure Redis is running
redis-cli ping  # Should return PONG

# 2. Check dependencies installed
cd backend
poetry show | grep -E "apscheduler|rq|redis|pytz"

# 3. Verify database schema
poetry run prisma db push

# 4. When ready to test:
# Terminal 1: Start backend
poetry run uvicorn app.main:app --reload

# Terminal 2: Start worker
./start_worker.sh  # (create this first)

# 5. Test with curl
curl -X POST http://localhost:8000/api/scheduled-reviews \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Review",
    "crm_connection_id": "YOUR_CRM_ID",
    "schedule": "0 6 * * *",
    "timezone": "America/New_York"
  }'
```

---

## 📖 REFERENCE: Session 21 Prompt Sections

**Completed:**
- ✅ Part 1: Install Dependencies
- ✅ Part 2: Database Schema
- ✅ Part 3: Job Queue Setup (RQ)

**Remaining:**
- ❌ Part 4: Scheduler Setup (APScheduler)
- ❌ Part 5: API Routes
- ❌ Part 6: Startup Integration
- ❌ Part 7: Worker Script
- ❌ Part 8: Testing
- ❌ Part 9: Monitoring (Optional - RQ Dashboard)

---

## 💡 TIPS FOR COMPLETION

1. **Start with SchedulerService** - It's the glue between APScheduler and RQ
2. **Test scheduler in isolation** - Add one job, verify it triggers
3. **Then add routes** - CRUD operations are straightforward
4. **Test each endpoint** - Use Postman or curl
5. **Run end-to-end test** - Create → Trigger → Verify results
6. **Add RQ Dashboard** (optional) - Great for debugging jobs

---

## 📞 SUPPORT RESOURCES

- **APScheduler Docs:** https://apscheduler.readthedocs.io/
- **RQ Docs:** https://python-rq.org/
- **Cron Expression Tester:** https://crontab.guru/
- **Timezone Database:** https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

---

**End of Progress Report**

*Resume Session 21 by creating the SchedulerService first, then routes, then testing.*
