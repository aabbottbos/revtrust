# Post-Session 23 Configuration Guide

## Required Configuration to Use Scheduled Reviews Feature

After Session 23, here's everything you need to configure to fully use the scheduled pipeline reviews system.

---

## 1. Environment Variables Setup

### Backend (.env file in `/backend`)

```bash
# Database (already configured)
DATABASE_URL="postgresql://..."

# Redis (for job queue)
REDIS_URL="redis://localhost:6379"
# Or if using Redis Cloud:
# REDIS_URL="redis://default:password@redis-12345.cloud.redislabs.com:12345"

# Email Delivery (Resend)
RESEND_API_KEY="re_..."  # Get from https://resend.com/api-keys
FROM_EMAIL="reviews@yourdomain.com"  # Must be verified domain in Resend

# Frontend URL
FRONTEND_URL="http://localhost:3000"  # Change to production URL when deployed

# Encryption (for storing CRM credentials)
ENCRYPTION_KEY="your-32-character-secret-key-here"  # Generate with: openssl rand -base64 32

# Salesforce OAuth
SALESFORCE_CLIENT_ID="your_salesforce_consumer_key"
SALESFORCE_CLIENT_SECRET="your_salesforce_consumer_secret"
SALESFORCE_REDIRECT_URI="http://localhost:3000/api/oauth/salesforce/callback"

# HubSpot OAuth
HUBSPOT_CLIENT_ID="your_hubspot_client_id"
HUBSPOT_CLIENT_SECRET="your_hubspot_client_secret"
HUBSPOT_REDIRECT_URI="http://localhost:3000/api/oauth/hubspot/callback"

# OpenAI (already configured)
OPENAI_API_KEY="sk-..."

# Clerk (already configured)
CLERK_SECRET_KEY="sk_..."
```

### Frontend (.env.local file in `/frontend`)

```bash
# API Connection (already configured)
NEXT_PUBLIC_API_URL="http://localhost:8000"

# Clerk Authentication (already configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
```

---

## 2. External Service Setup

### A. Redis Setup (Required for Job Queue)

**Option 1: Local Redis (Development)**
```bash
# Install Redis
brew install redis

# Start Redis
brew services start redis

# Verify it's running
redis-cli ping  # Should return "PONG"
```

**Option 2: Redis Cloud (Production)**
1. Sign up at https://redis.com/try-free/
2. Create a new database
3. Copy the connection URL
4. Add to `REDIS_URL` in backend .env

### B. Resend Setup (Required for Email Delivery)

**Steps:**
1. Sign up at https://resend.com
2. Verify your sending domain:
   - Go to Domains section
   - Add your domain (e.g., yourdomain.com)
   - Add DNS records they provide
   - Wait for verification (usually 5-10 minutes)
3. Generate API key:
   - Go to API Keys section
   - Create new API key
   - Copy to `RESEND_API_KEY` in backend .env
4. Set FROM_EMAIL to match verified domain:
   ```bash
   FROM_EMAIL="reviews@yourdomain.com"
   ```

**Free Tier:**
- 100 emails/day
- 3,000 emails/month
- Perfect for testing!

### C. Salesforce OAuth Setup (Required to connect Salesforce)

**Steps:**
1. Log into Salesforce as admin
2. Go to Setup → Apps → App Manager
3. Click "New Connected App"
4. Fill in:
   - **Connected App Name:** RevTrust Pipeline Reviews
   - **API Name:** RevTrust_Pipeline_Reviews
   - **Contact Email:** your@email.com
   - **Enable OAuth Settings:** ✓ Check
   - **Callback URL:** `http://localhost:3000/api/oauth/salesforce/callback`
     - For production: `https://yourdomain.com/api/oauth/salesforce/callback`
   - **Selected OAuth Scopes:**
     - Access and manage your data (api)
     - Perform requests on your behalf at any time (refresh_token, offline_access)
     - Access your basic information (id, profile, email, address, phone)
5. Save and wait 2-10 minutes for propagation
6. Click "Manage Consumer Details"
7. Copy Consumer Key → `SALESFORCE_CLIENT_ID`
8. Copy Consumer Secret → `SALESFORCE_CLIENT_SECRET`

**Important:** Add your Salesforce org to the app's permissions

### D. HubSpot OAuth Setup (Required to connect HubSpot)

**Steps:**
1. Log into HubSpot as admin
2. Go to Settings → Integrations → Private Apps
3. Click "Create a private app"
4. Fill in:
   - **App Name:** RevTrust Pipeline Reviews
   - **Description:** Automated pipeline review system
5. Go to "Scopes" tab and enable:
   - **CRM:**
     - `crm.objects.deals.read` (Read deals)
     - `crm.objects.contacts.read` (Read contacts)
     - `crm.objects.companies.read` (Read companies)
6. Click "Create app"
7. Copy **App ID** → `HUBSPOT_CLIENT_ID`
8. Copy **Client Secret** → `HUBSPOT_CLIENT_SECRET`

**Alternative: Public App (for multiple HubSpot accounts)**
1. Go to https://developers.hubspot.com/
2. Create new app
3. Configure OAuth redirect: `http://localhost:3000/api/oauth/hubspot/callback`
4. Request same scopes as above
5. Submit for HubSpot review (for production)

### E. Slack Webhook Setup (Optional for Slack Delivery)

**Steps:**
1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name it "RevTrust" and select your workspace
4. Click "Incoming Webhooks"
5. Toggle "Activate Incoming Webhooks" to ON
6. Click "Add New Webhook to Workspace"
7. Select the channel to post to
8. Copy the Webhook URL
9. When creating a scheduled review in the UI, paste this webhook URL

**Note:** Each user will need their own Slack webhook URL (per workspace/channel)

---

## 3. Database Migration

**Run Prisma migrations to create new tables:**

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name add_scheduled_reviews

# Or if migrations already exist
npx prisma migrate deploy
```

**New tables created:**
- `crm_connections` - Stores OAuth credentials (encrypted)
- `scheduled_reviews` - Stores schedule configurations
- `review_runs` - Stores execution history
- `output_templates` - Stores email/Slack templates

---

## 4. Generate Encryption Key

**Create a secure encryption key for storing CRM credentials:**

```bash
# Generate 32-character key
openssl rand -base64 32

# Or use Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Add to backend .env:**
```bash
ENCRYPTION_KEY="your-generated-key-here"
```

**⚠️ Important:** Keep this key secure and never commit it to git!

---

## 5. Start All Services

**Terminal 1: Redis**
```bash
# If installed via Homebrew
brew services start redis

# Or run directly
redis-server
```

**Terminal 2: Backend**
```bash
cd backend
poetry run uvicorn app.main:app --reload
```

**Terminal 3: Worker (for background jobs)**
```bash
cd backend
python -m app.worker

# Or use the helper script
./start_worker.sh
```

**Terminal 4: Frontend**
```bash
cd frontend
npm run dev
```

---

## 6. Verify Everything Works

### Check 1: Services Running
```bash
# Redis
redis-cli ping  # Should return "PONG"

# Backend
curl http://localhost:8000/api/scheduled-reviews  # Should return {"scheduled_reviews":[]}

# Frontend
# Open http://localhost:3000 in browser
```

### Check 2: Backend Logs
Look for these in the backend terminal:
```
⏰ Starting scheduler...
✅ Scheduler started
📅 Syncing X scheduled reviews...
✅ Scheduler sync complete
```

### Check 3: Worker Logs
Look for in the worker terminal:
```
Worker started
Listening on default queue
```

---

## 7. First-Time Setup Flow

### Step 1: Connect Your CRM
1. Navigate to http://localhost:3000/crm
2. Click "Connect Salesforce" or "Connect HubSpot"
3. Complete OAuth flow
4. Verify connection shows as "Connected"

### Step 2: Create First Schedule
1. Navigate to http://localhost:3000/schedule
2. Click "New Schedule"
3. Fill in:
   - Name: "Test Daily Review"
   - Select your CRM connection
   - Frequency: "Every Day"
   - Time: 9:00 AM
   - Timezone: (auto-detected)
   - Email: your@email.com
4. Click "Create Schedule"

### Step 3: Test Manual Run
1. From schedule list, click "Run Now"
2. Wait 2-3 minutes
3. Check your email inbox
4. Should receive beautiful HTML email with pipeline insights!

### Step 4: Verify Schedule Active
1. Check schedule shows "Active" badge
2. Verify "Next run" time is displayed
3. Wait for scheduled time (or change to soon for testing)
4. Verify automatic execution

---

## 8. Production Deployment

### Backend (Railway/Render/Heroku)

**Environment Variables to Set:**
- All from backend .env above
- Update URLs to production domains
- Update `FRONTEND_URL` to production URL

**Processes to Run:**
1. **Web process:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`
2. **Worker process:** `python -m app.worker` (separate dyno/service)

**Add-ons/Services Needed:**
- PostgreSQL database
- Redis (for job queue)

### Frontend (Vercel/Netlify)

**Environment Variables to Set:**
- `NEXT_PUBLIC_API_URL` → your backend URL
- All Clerk variables

**Build Settings:**
- Build command: `npm run build`
- Output directory: `.next`

### Update OAuth Redirect URLs

**Salesforce:**
- Add production callback: `https://yourdomain.com/api/oauth/salesforce/callback`

**HubSpot:**
- Add production callback: `https://yourdomain.com/api/oauth/hubspot/callback`

---

## 9. Optional: Pre-populate Templates

The system includes default email/Slack templates, but you can customize:

**Create custom template via API:**
```bash
curl -X POST http://localhost:8000/api/output-templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Email Template",
    "channel": "email",
    "subject_template": "Your Pipeline Review - {{ analysis.created_at }}",
    "body_template": "<!DOCTYPE html>...",
    "is_default": true
  }'
```

Or use the UI (future enhancement) to create templates visually.

---

## 10. Troubleshooting

### Issue: Scheduler not starting
**Check:**
```bash
# Backend logs should show:
✅ Scheduler started

# If not, verify:
- Redis is running: redis-cli ping
- Backend can connect to Redis
- REDIS_URL is correct in .env
```

### Issue: Emails not sending
**Check:**
1. `RESEND_API_KEY` is valid
2. `FROM_EMAIL` domain is verified in Resend
3. Recipient emails are valid
4. Check Resend dashboard for delivery logs

### Issue: OAuth connection fails
**Check:**
1. Client ID and Secret are correct
2. Redirect URI matches exactly (including http vs https)
3. Salesforce app is approved and deployed
4. OAuth scopes are sufficient
5. Check browser console for errors

### Issue: Worker not processing jobs
**Check:**
```bash
# Verify worker is running
ps aux | grep "app.worker"

# Check Redis queue
redis-cli LLEN rq:queue:default

# Verify worker logs show "Listening on default queue"
```

### Issue: Schedule not executing
**Check:**
1. Schedule is Active (not Paused)
2. `next_run_at` time has passed
3. Scheduler logs show job execution
4. Worker is running and processing
5. Check `review_runs` table for execution records

---

## Summary Checklist

Before you can fully use the scheduled reviews feature:

### Required Setup
- [ ] Install and start Redis
- [ ] Create Resend account and verify domain
- [ ] Get Resend API key
- [ ] Set up Salesforce Connected App (if using Salesforce)
- [ ] Set up HubSpot Private App (if using HubSpot)
- [ ] Generate encryption key
- [ ] Update all environment variables
- [ ] Run database migrations
- [ ] Start backend server
- [ ] Start worker process
- [ ] Start frontend server

### Verification
- [ ] Redis responding to ping
- [ ] Backend scheduler started (check logs)
- [ ] Worker listening for jobs
- [ ] Can access frontend at localhost:3000
- [ ] Can navigate to /crm page
- [ ] Can complete OAuth flow
- [ ] Can create schedule
- [ ] Can manually trigger review
- [ ] Receive email with results

### Production (when ready)
- [ ] Deploy backend with worker process
- [ ] Deploy frontend
- [ ] Update OAuth redirect URLs
- [ ] Update environment variables for production
- [ ] Test end-to-end in production
- [ ] Monitor first scheduled executions

---

## Quick Start Commands

```bash
# Start everything locally
redis-server &
cd backend && poetry run uvicorn app.main:app --reload &
cd backend && python -m app.worker &
cd frontend && npm run dev &
```

---

## Need Help?

If you run into issues:

1. Check the logs (backend, worker, frontend)
2. Verify all services are running
3. Check environment variables are set
4. Review the troubleshooting section above
5. Check the session documentation:
   - SESSION_21_PROGRESS.md (scheduling)
   - SESSION_22_PROGRESS.md (delivery)
   - SESSION_23_PROGRESS.md (UI)

---

## Estimated Setup Time

- **Development:** 30-60 minutes
  - Redis install: 5 min
  - Resend setup: 10 min
  - Salesforce OAuth: 15 min
  - HubSpot OAuth: 10 min
  - Environment variables: 10 min
  - Testing: 10 min

- **Production:** 1-2 hours
  - Backend deployment: 30 min
  - Frontend deployment: 15 min
  - Service configuration: 30 min
  - Testing: 15 min

---

**You're almost there!** Once these configurations are complete, you'll have a fully functional automated pipeline review system! 🚀
