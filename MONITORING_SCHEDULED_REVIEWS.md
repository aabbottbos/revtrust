# Monitoring Scheduled Reviews

## Quick Reference

### Check if Scheduled Review is Working

Slack: https://hooks.slack.com/services/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

**1. Via Frontend UI (Easiest)**
```
http://localhost:3000/schedule/[schedule-id]/history
```
You'll see all runs with status indicators:
- ✓ Completed (green) - Success!   
- ✗ Failed (red) - Error occurred
- ⏱ Running (blue) - Currently processing
- Queued (gray) - Waiting to start

**2. Via API**
```bash
# Check all schedules
curl http://localhost:8000/api/scheduled-reviews | python3 -m json.tool

# Check run history for a specific schedule
curl http://localhost:8000/api/scheduled-reviews/[schedule-id]/runs | python3 -m json.tool
```
curl http://localhost:8000/api/scheduled-reviews/fed65b6e-4b5b-4283-875b-9cfd9f218837/runs | python3 -m json.tool


**3. Via Backend Logs**
Look for these messages in your backend terminal:
```
📅 Executing scheduled review: [name]
✅ Review job queued: [job-id]
```

**4. Via Worker Logs**
Look for these in your worker terminal:
```
scheduled_reviews: app.jobs.scheduled_review_job.execute_scheduled_review(...)
✅ Job completed successfully
```

**5. Via Email**
If delivery is configured, check your inbox for the review email!

---

## Detailed Monitoring

### Services Status Check

**Backend API** (Main app)
```bash
# Should return 200
curl http://localhost:8000/api/scheduled-reviews
```

**Redis** (Job queue)
```bash
# Should return PONG
redis-cli ping

# Check queue length
redis-cli LLEN rq:queue:scheduled_reviews
# 0 = queue is empty (all jobs processed)
# >0 = jobs waiting
```

**Worker** (Background processor)
```bash
# Check if worker is running
ps aux | grep "app.worker" | grep -v grep

# Should show process with:
# poetry run python -m app.worker
```

### Trigger Manual Test

**Via UI:**
1. Go to http://localhost:3000/schedule
2. Find your schedule
3. Click "Run Now" button
4. Alert confirms "Review started!"
5. Check email in 2-3 minutes

**Via API:**
```bash
curl -X POST http://localhost:8000/api/scheduled-reviews/[schedule-id]/run-now
```

---

## Expected Flow & Timing

### Timeline
1. **T+0s**: Job queued
   - Status: "queued"
   - Backend logs: "📅 Executing scheduled review"

2. **T+1s**: Worker picks up job
   - Status: "running"
   - Worker logs: "scheduled_reviews: execute_scheduled_review..."

3. **T+10-30s**: Job processes
   - Fetches data from CRM
   - Runs AI analysis
   - Generates insights

4. **T+30-60s**: Delivery
   - Sends email (if configured)
   - Posts to Slack (if configured)

5. **T+60s**: Completion
   - Status: "completed"
   - Run history updated with metrics

### What Gets Recorded

Successful run shows:
```json
{
  "status": "completed",
  "deals_analyzed": 25,
  "health_score": 75,
  "issues_found": 8,
  "high_risk_deals": 3,
  "analysis_id": "abc-123"
}
```

Failed run shows:
```json
{
  "status": "failed",
  "error_message": "Error description",
  "retry_count": 1
}
```

---

## Troubleshooting

### Job Stuck in "Running"

**Symptom:** Status stays "running" forever

**Causes:**
1. Worker crashed/stopped
2. Worker encountering errors
3. CRM connection issue

**Fix:**
```bash
# 1. Check worker is running
ps aux | grep "app.worker"

# 2. Restart worker with fork safety workaround
cd backend
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
poetry run python -m app.worker

kill backend: lsof -ti:8000 | xargs kill -9

# 3. Check worker logs for errors
```

### Job Stuck in "Queued"

**Symptom:** Status stays "queued" forever

how to kill workers: lsof -ti:8000 | xargs kill -9 2>/dev/null; ps aux | grep -E "(rq worker|app.worker)" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null; echo "Killed all backend and worker processes"

**Causes:**
1. Worker not running
2. Worker not listening to correct queue

**Fix:**
```bash
# Start the worker
cd backend
./start_worker.sh

# Verify it's listening
# Should see: "*** Listening on scheduled_reviews, default..."
```

### No Email Received

**Symptom:** Job completes but no email arrives

**Checks:**
1. **Email configured?**
   ```bash
   # Check env vars are set
   echo $RESEND_API_KEY
   echo $FROM_EMAIL
   ```

2. **Domain verified in Resend?**
   - Log into resend.com
   - Check "Domains" section
   - Status should be "Verified"

3. **Check Resend logs:**
   - Go to resend.com dashboard
   - Click "Logs"
   - See delivery status

4. **Check spam folder**

### Worker Crashes (macOS Python 3.14)

**Symptom:** Worker crashes with "objc[xxx]: +[NSNumber initialize]" error

**Cause:** Python 3.14 fork() incompatibility on macOS

**Fix:**
```bash
# Set environment variable before starting worker
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
cd backend
poetry run python -m app.worker

# Or use the startup script (already includes fix)
./start_worker.sh
```

**Note:** This issue doesn't occur on Linux (production)

### CRM Connection Expired

**Symptom:** Job fails with "OAuth token expired" or "Unauthorized"

**Fix:**
1. Go to /crm page
2. Click "Test" on the connection
3. If failed, delete and reconnect
4. OAuth tokens need periodic refresh

---

## Production Monitoring

### Health Checks

**Scheduled Review System Status:**
```bash
# 1. Check scheduler is running
curl http://localhost:8000/api/scheduled-reviews | grep next_run_at

# 2. Check recent runs
curl http://localhost:8000/api/scheduled-reviews/[id]/runs | head -20

# 3. Check for failures
# Count failed runs in last 24 hours
```

### Metrics to Track

1. **Success Rate**
   - % of runs that complete successfully
   - Target: >95%

2. **Execution Time**
   - Time from queued → completed
   - Target: <60 seconds

3. **Delivery Rate**
   - % of emails/Slack messages delivered
   - Check Resend dashboard

4. **Error Types**
   - Group by error_message
   - Identify patterns

### Logs to Monitor

**Backend (main app):**
- Look for: "📅 Executing scheduled review"
- Look for: "✅ Review job queued"
- Look for errors in /api/scheduled-reviews endpoints

**Worker:**
- Look for: Job execution starts
- Look for: Job completion messages
- Look for: Exception tracebacks

**Redis:**
- Monitor queue depth
- Alert if queue >100 items (backlog)

---

## Common Patterns

### First Time Setup
```bash
# 1. Start services
redis-server &
cd backend && poetry run uvicorn app.main:app --reload &
cd backend && ./start_worker.sh &
cd frontend && npm run dev &

# 2. Create schedule via UI
# http://localhost:3000/schedule/new

# 3. Test manually
# Click "Run Now"

# 4. Check email inbox
# Should arrive in 1-2 minutes
```

### Daily Operation
```bash
# Morning check
curl http://localhost:8000/api/scheduled-reviews | \
  python3 -m json.tool | \
  grep -A 2 "next_run_at"

# Shows when next reviews will run
```

### Before Deployment
```bash
# 1. Test locally first
curl -X POST http://localhost:8000/api/scheduled-reviews/[id]/run-now

# 2. Verify email received
# 3. Check run history shows "completed"
# 4. Confirm metrics populated

# Then deploy!
```

---

## Environment Variables Checklist

Required for scheduled reviews to work:

**Backend:**
- [x] `REDIS_URL` - For job queue
- [x] `RESEND_API_KEY` - For email delivery
- [x] `FROM_EMAIL` - Verified sender address
- [x] `SALESFORCE_CLIENT_ID` - If using Salesforce
- [x] `SALESFORCE_CLIENT_SECRET`
- [x] `HUBSPOT_CLIENT_ID` - If using HubSpot
- [x] `HUBSPOT_CLIENT_SECRET`
- [x] `ENCRYPTION_KEY` - For storing credentials
- [x] `OPENAI_API_KEY` - For AI analysis

**Frontend:**
- [x] `NEXT_PUBLIC_API_URL` - Backend URL
- [x] Clerk vars (for auth)

---

## Quick Diagnostics Script

Save as `check_scheduled_reviews.sh`:

```bash
#!/bin/bash

echo "🔍 Checking Scheduled Reviews System..."
echo ""

echo "1. Redis Status:"
redis-cli ping || echo "❌ Redis not running!"

echo ""
echo "2. Backend API:"
curl -s http://localhost:8000/api/scheduled-reviews | head -1

echo ""
echo "3. Worker Status:"
ps aux | grep "app.worker" | grep -v grep || echo "❌ Worker not running!"

echo ""
echo "4. Queue Depth:"
echo "Scheduled reviews queue: $(redis-cli LLEN rq:queue:scheduled_reviews)"
echo "Default queue: $(redis-cli LLEN rq:queue:default)"

echo ""
echo "5. Recent Runs:"
curl -s "http://localhost:8000/api/scheduled-reviews/[schedule-id]/runs" | \
  python3 -m json.tool | \
  grep -A 3 "status"

echo ""
echo "✅ Diagnostic complete!"
```

---

## Success Indicators

You know it's working when:

✅ Worker logs show: "*** Listening on scheduled_reviews, default..."
✅ Manual "Run Now" completes in <60 seconds
✅ Run history shows "completed" status
✅ Email arrives in inbox
✅ Metrics populated (deals_analyzed, health_score, etc.)
✅ analysis_id links to full report
✅ Next scheduled run shows future timestamp
✅ Backend logs show: "✅ Review job queued"

---

## Contact Points

**If email not working:** Check Resend dashboard (resend.com)
**If CRM data missing:** Test CRM connection in /crm
**If worker crashing:** Check worker logs for Python errors
**If Redis issues:** Restart Redis service
**If scheduler not running:** Check backend logs for scheduler initialization

---

**Last Updated:** Session 23
**Status:** Production Ready ✅


Git stuff

Push to main
 git push origin main

 push to remote
 ⏺ Here are the complete instructions to commit and push your authentication changes:

  1. Review what's changed

  git status

  2. Review the actual changes (optional but recommended)

  git diff

  3. Add all changes to staging

  git add .

  Or if you prefer to add specific files:
  git add backend/app/auth.py
  git add backend/app/routes/
  git add backend/app/services/
  git add backend/app/worker.py
  git add backend/app/utils/rule_operators.py
  git add backend/poetry.lock backend/pyproject.toml
  git add frontend/
  git add AUTH_IMPLEMENTATION.md

  4. Create the commit

  git commit -m "feat: implement Clerk authentication for multi-user support

  - Add JWT verification using Clerk JWKS endpoint in backend
  - Add pyjwt and cryptography dependencies
  - Create authentication middleware for frontend route protection
  - Add useAuthenticatedFetch hook for client components
  - Add authenticatedFetch helper for server components
  - Update all platform pages to use authenticated API calls
  - Implement user isolation for scheduled reviews, CRM connections, and history
  - Add comprehensive authentication documentation

  This enables RevTrust to scale to 10,000+ users with proper data isolation.

  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude <noreply@anthropic.com>"

  5. Push to remote

  git push origin main

  If this is your first push or the branch doesn't exist on remote yet:
  git push -u origin main

  ---
  All in one command (if you're confident):
  git add . && git commit -m "feat: implement Clerk authentication for multi-user support

  - Add JWT verification using Clerk JWKS endpoint in backend
  - Add pyjwt and cryptography dependencies
  - Create authentication middleware for frontend route protection
  - Add useAuthenticatedFetch hook for client components
  - Add authenticatedFetch helper for server components
  - Update all platform pages to use authenticated API calls
  - Implement user isolation for scheduled reviews, CRM connections, and history
  - Add comprehensive authentication documentation

  This enables RevTrust to scale to 10,000+ users with proper data isolation.

  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude <noreply@anthropic.com>" && git push origin main

  Would you like me to execute these commands for you instead?