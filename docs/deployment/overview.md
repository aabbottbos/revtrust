# RevTrust Production Deployment Guide 🚀

This guide walks you through deploying RevTrust to production using Railway (backend) and Vercel (frontend).

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account
- ✅ Vercel account (free tier) - https://vercel.com
- ✅ Railway account (free tier) - https://railway.app
- ✅ Clerk production keys - https://dashboard.clerk.com

## Deployment Overview

1. **Backend** → Railway (with PostgreSQL)
2. **Frontend** → Vercel
3. **Database** → Railway PostgreSQL
4. **Auth** → Clerk (production mode)

---

## Part 1: Setup GitHub Repository

### Step 1: Commit All Changes

```bash
cd revtrust
git status
git add .
git commit -m "feat: prepare for production deployment"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Name: `revtrust`
3. Description: "Sales pipeline hygiene analysis tool"
4. Public or Private: Your choice
5. Don't initialize with README (we have one)
6. Click "Create repository"

### Step 3: Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/revtrust.git

# Push to main branch
git push -u origin main
```

---

## Part 2: Get Clerk Production Keys

### Step 1: Access Clerk Dashboard

1. Go to https://dashboard.clerk.com
2. Select your application or create new one
3. Navigate to **API Keys**

### Step 2: Copy Production Keys

You need TWO keys:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_live_`)
- `CLERK_SECRET_KEY` (starts with `sk_live_`)

**Important:** Keep these keys safe! You'll need them for both backend and frontend.

---

## Part 3: Deploy Backend to Railway

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub
3. Authorize Railway to access your repositories

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose `revtrust` repository
4. Railway will detect the monorepo structure

### Step 3: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Wait ~30 seconds for provisioning
4. Database will auto-generate connection string

### Step 4: Configure Backend Service

1. Click **"+ New"** → **"GitHub Repo"** → Select `revtrust`
2. Railway creates a service
3. Click on the service to configure:

**Service Settings:**
- **Name:** `revtrust-backend`
- **Root Directory:** `backend`
- **Start Command:** (auto-detected from Procfile)

### Step 5: Add Environment Variables

Click on backend service → **"Variables"** tab → Add these:

```bash
# Database (Railway provides this automatically)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Clerk Production Key
CLERK_SECRET_KEY=sk_live_your_production_key_here

# CORS (will update after frontend deployment)
ALLOWED_ORIGINS=http://localhost:3000

# Environment
ENVIRONMENT=production
PYTHONUNBUFFERED=1
```

**Note:** The `${{Postgres.DATABASE_URL}}` syntax references your PostgreSQL database automatically.

### Step 6: Generate Public Domain

1. In backend service, go to **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. You'll get: `https://revtrust-backend-production-xxxx.up.railway.app`
5. **SAVE THIS URL** - you need it for frontend!

### Step 7: Deploy Backend

1. Railway automatically deploys on push
2. Watch **"Deployments"** tab for progress
3. Look for "✅ Build successful"
4. Then "✅ Deployment live"

### Step 8: Test Backend Health

```bash
# Replace with your Railway URL
curl https://your-backend.up.railway.app/api/health

# Expected response:
{"status":"healthy","timestamp":"2024-12-02T..."}
```

### Step 9: Run Database Migrations

Migrations should run automatically via the Procfile. If needed, manually run:

1. In Railway backend service, click **"Connect"** (terminal icon)
2. Run:
```bash
poetry run prisma migrate deploy
poetry run prisma generate
```

Or use Railway CLI:
```bash
railway run poetry run prisma migrate deploy
```

**✅ Backend Deployment Complete!**

---

## Part 4: Deploy Frontend to Vercel

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel

### Step 2: Import Project

1. Click **"Add New"** → **"Project"**
2. Import `revtrust` repository
3. Vercel auto-detects Next.js

### Step 3: Configure Project

**Framework Preset:** Next.js (auto-detected)
**Root Directory:** `frontend`
**Build Command:** `npm run build` (default)
**Output Directory:** `.next` (default)
**Install Command:** `npm install` (default)

### Step 4: Add Environment Variables

Click **"Environment Variables"** and add:

```bash
# API URL (from Railway backend - your generated domain)
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app

# Clerk Production Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key_here
CLERK_SECRET_KEY=sk_live_your_production_key_here

# Environment
NODE_ENV=production
```

**Important:** Make sure to use your actual Railway backend URL!

### Step 5: Deploy Frontend

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Get your URL: `https://revtrust-xxx.vercel.app`
4. **SAVE THIS URL** - you need it for CORS!

### Step 6: Update Backend CORS

Go back to Railway:
1. Click backend service → **"Variables"**
2. Update `ALLOWED_ORIGINS`:
```bash
ALLOWED_ORIGINS=https://revtrust-xxx.vercel.app,https://revtrust.vercel.app
```
3. Service will auto-redeploy

### Step 7: Configure Clerk Domains

1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to **"Domains"**
4. Add your Vercel domain: `revtrust-xxx.vercel.app`

5. Go to **"Paths"** → Update redirects:
   - **Sign-in URL:** `https://your-app.vercel.app/sign-in`
   - **Sign-up URL:** `https://your-app.vercel.app/sign-up`
   - **After sign-in:** `https://your-app.vercel.app/upload`
   - **After sign-up:** `https://your-app.vercel.app/upload`

**✅ Frontend Deployment Complete!**

---

## Part 5: Production Testing

### Complete Test Checklist

**Authentication:**
- [ ] Visit production URL
- [ ] Sign up with new account
- [ ] Verify email works
- [ ] Sign in successfully
- [ ] Sign out
- [ ] Sign back in

**Core Features:**
- [ ] Upload CSV file
- [ ] See processing animation
- [ ] View results page
- [ ] Health chart displays
- [ ] Deals table shows data
- [ ] Click deal → modal opens
- [ ] All violation data correct

**Export Features:**
- [ ] Download CSV report
- [ ] Copy summary to clipboard
- [ ] Share link works (if implemented)

**History:**
- [ ] Navigate to history
- [ ] See uploaded analysis
- [ ] Click analysis → view results

**Error Handling:**
- [ ] Upload invalid file → see error
- [ ] Navigate to non-existent analysis → 404
- [ ] Check offline behavior

**Performance:**
- [ ] Page load < 3 seconds
- [ ] Analysis completes reasonably fast
- [ ] No console errors
- [ ] Mobile responsive

---

## Part 6: Monitoring & Maintenance

### Railway Monitoring

**View Logs:**
1. Railway dashboard → Backend service
2. Click **"Deployments"** → **"Logs"**
3. Monitor for errors

**Database Backups:**
1. Railway auto-backs up PostgreSQL
2. Go to Database service → **"Settings"** → **"Backups"**
3. Verify enabled

### Vercel Monitoring

**Enable Analytics:**
1. Vercel project → **"Analytics"**
2. Click **"Enable"**
3. Monitor traffic and performance

**View Logs:**
1. Project → **"Deployments"**
2. Click latest deployment
3. View **"Functions"** logs

### Uptime Monitoring (Optional)

Use free services:
- **UptimeRobot** - https://uptimerobot.com
- **Better Stack** - https://betterstack.com
- **Pingdom** - https://pingdom.com

Configure:
- **URL:** `https://your-backend.up.railway.app/api/health`
- **Interval:** 5 minutes
- **Alert:** Email when down

---

## Part 7: Custom Domain (Optional)

### Step 1: Add Domain to Vercel

1. Vercel project → **"Settings"** → **"Domains"**
2. Click **"Add"**
3. Enter: `revtrust.com` (or your domain)

### Step 2: Configure DNS

At your domain registrar (Namecheap, GoDaddy, etc.):

**Option A: Vercel Nameservers (Recommended)**
1. Copy nameservers from Vercel
2. Update at registrar
3. Wait 24-48 hours for propagation

**Option B: CNAME Records**
1. Add CNAME: `www` → `cname.vercel-dns.com`
2. Add A record: `@` → `76.76.21.21`
3. Wait for DNS propagation (~1 hour)

### Step 3: SSL Certificate

- Vercel auto-provisions SSL (Let's Encrypt)
- Wait 5-10 minutes after DNS propagation
- Test: `https://revtrust.com`

### Step 4: Update All URLs

Update these with your custom domain:
- ✅ Clerk redirect URLs
- ✅ Backend CORS settings
- ✅ Any hardcoded URLs in code

---

## Troubleshooting

### Backend Issues

**Build Fails:**
```bash
# Check Railway logs
# Common issues:
# 1. Poetry installation failed
# 2. Prisma generation failed
# 3. Missing dependencies

# Solution: Check pyproject.toml and Procfile
```

**Database Connection Errors:**
```bash
# Verify DATABASE_URL is set
# Check Postgres service is running
# Ensure ${{Postgres.DATABASE_URL}} reference is correct
```

**CORS Errors:**
```bash
# Check browser console for actual origin
# Verify ALLOWED_ORIGINS includes frontend URL
# Ensure no trailing slashes
```

### Frontend Issues

**Build Fails:**
```bash
# Check Vercel build logs
# Common issues:
# 1. Missing environment variables
# 2. TypeScript errors
# 3. Module not found

# Test locally:
cd frontend
npm run build
```

**API Calls Fail:**
```bash
# Check Network tab in DevTools
# Verify NEXT_PUBLIC_API_URL is correct
# Ensure backend is running
# Check CORS configuration
```

**Environment Variables Not Working:**
```bash
# Variables must start with NEXT_PUBLIC_ for client-side
# Redeploy after adding variables
# Clear browser cache
```

### Authentication Issues

**Redirect Loops:**
```bash
# Check Clerk domain configuration
# Verify redirect URLs match exactly
# Ensure production keys (not dev keys)
```

**Session Expires:**
```bash
# Check Clerk session settings
# Verify cookie configuration
# Test in incognito mode
```

---

## Cost Estimation

### Free Tier Limits

**Railway (Free Tier):**
- $5 credit/month
- ~500 hours/month
- PostgreSQL included
- Public networking

**Vercel (Hobby):**
- Unlimited deployments
- 100 GB bandwidth/month
- 100 build executions/day
- Free SSL

**Clerk (Free Tier):**
- 10,000 MAU (Monthly Active Users)
- All auth features
- Email + password

**Estimated Monthly Cost:** $0 (within free tiers)

**When to Upgrade:**
- Railway: >500 compute hours or need private networking
- Vercel: >100 GB bandwidth or need team features
- Clerk: >10,000 users

---

## Security Checklist

Before going fully public:

- [ ] All `.env` files in `.gitignore`
- [ ] Production keys rotated from dev keys
- [ ] CORS restricted to your domains only
- [ ] Rate limiting enabled (optional for POC)
- [ ] HTTPS everywhere
- [ ] Error messages don't leak sensitive data
- [ ] Database backups enabled
- [ ] Monitoring/alerts configured

---

## Deployment Checklist

**Pre-Deployment:**
- [ ] All code committed to GitHub
- [ ] Environment templates created
- [ ] Clerk production keys obtained
- [ ] Railway account created
- [ ] Vercel account created

**Backend Deployment:**
- [ ] PostgreSQL database created
- [ ] Backend service configured
- [ ] Environment variables set
- [ ] Public domain generated
- [ ] Health endpoint tested
- [ ] Database migrations run

**Frontend Deployment:**
- [ ] Project imported to Vercel
- [ ] Environment variables set
- [ ] Backend API URL configured
- [ ] Deployment successful
- [ ] Public URL obtained

**Post-Deployment:**
- [ ] Backend CORS updated
- [ ] Clerk domains configured
- [ ] Clerk redirects updated
- [ ] Full production testing complete
- [ ] Monitoring enabled
- [ ] Documentation updated

---

## Success! 🎉

RevTrust is now live in production!

**Your URLs:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.up.railway.app`
- API Health: `https://your-backend.up.railway.app/api/health`

**Next Steps:**
1. Invite beta testers
2. Collect feedback
3. Monitor usage and errors
4. Plan MVP features
5. Iterate based on data

**Need Help?**
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Clerk Docs: https://clerk.com/docs

---

## Updating Production

### Deploy Backend Updates

```bash
# Commit changes
git add .
git commit -m "feat: your changes"
git push origin main

# Railway auto-deploys from main branch
# Watch deployment in Railway dashboard
```

### Deploy Frontend Updates

```bash
# Commit changes
git add .
git commit -m "feat: your changes"
git push origin main

# Vercel auto-deploys from main branch
# Watch deployment in Vercel dashboard
```

### Database Migrations

```bash
# Create migration locally
cd backend
poetry run prisma migrate dev --name your_migration_name

# Commit migration files
git add prisma/migrations
git commit -m "chore: add database migration"
git push

# Railway runs migrations automatically on deploy
# Or run manually:
railway run poetry run prisma migrate deploy
```

---

## Rolling Back

### Rollback Frontend (Vercel)

1. Go to Vercel project
2. Click **"Deployments"**
3. Find previous working deployment
4. Click **"..."** → **"Promote to Production"**

### Rollback Backend (Railway)

1. Go to Railway project
2. Click backend service
3. Click **"Deployments"**
4. Find previous deployment
5. Click **"..."** → **"Redeploy"**

### Rollback Database Migration

```bash
# Connect to Railway
railway run bash

# Reset last migration (DANGEROUS!)
poetry run prisma migrate resolve --rolled-back your_migration_name

# Or restore from backup
```

---

## Production Optimization

### Backend

**1. Add Connection Pooling:**
Already enabled by Prisma. Adjust if needed:
```
DATABASE_URL="postgresql://...?connection_limit=10"
```

**2. Add Response Caching:**
```python
from fastapi.responses import Response

@app.get("/api/rules")
async def get_rules():
    return Response(
        content=rules_json,
        headers={"Cache-Control": "public, max-age=3600"}
    )
```

**3. Rate Limiting (Future):**
```python
from slowapi import Limiter
# Implement rate limiting per user/IP
```

### Frontend

**1. Enable Speed Insights:**
```bash
npm install @vercel/speed-insights
```

Add to `app/layout.tsx`:
```typescript
import { SpeedInsights } from "@vercel/speed-insights/next"
<SpeedInsights />
```

**2. Add Web Analytics:**
```bash
npm install @vercel/analytics
```

**3. Optimize Images:**
Use Next.js `<Image>` component everywhere.

---

## FAQ

**Q: How much does this cost?**
A: $0 with free tiers for small-scale POC. Upgrades needed for >10K users or heavy traffic.

**Q: Can I use a different backend host?**
A: Yes! You can deploy to Heroku, Render, AWS, or any platform supporting Python.

**Q: Can I use a different frontend host?**
A: Yes! Next.js can deploy to Netlify, AWS Amplify, or self-hosted.

**Q: How do I add more environment variables?**
A: Add to Railway/Vercel dashboards, then redeploy (automatic).

**Q: Is my data secure?**
A: Yes - Railway provides encrypted connections, Clerk handles auth security, and HTTPS everywhere.

**Q: How do I scale this?**
A: Railway and Vercel auto-scale. Upgrade plans for more resources.

**Q: Can I change the domain later?**
A: Yes! Add custom domain anytime in Vercel settings.

---

**Congratulations! RevTrust is live! 🚀**

Share your success and start getting users!
