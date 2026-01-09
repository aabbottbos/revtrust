# 🚀 Quick Deploy Guide - RevTrust

Get RevTrust live in production in under 30 minutes!

## Prerequisites Checklist

- [ ] GitHub account
- [ ] Railway account (https://railway.app)
- [ ] Vercel account (https://vercel.com)
- [ ] Clerk production keys (https://dashboard.clerk.com)

---

## Step 1: Push to GitHub (5 min)

```bash
# In revtrust directory
cd /path/to/revtrust

# Check status
git status

# Add all files
git add .

# Commit
git commit -m "feat: ready for production deployment"

# Create GitHub repo at https://github.com/new
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/revtrust.git
git push -u origin main
```

**✅ Code on GitHub**

---

## Step 2: Deploy Backend - Railway (10 min)

### 2.1 Create Database
1. Go to https://railway.app
2. New Project → Add PostgreSQL
3. Wait for provisioning (~30 sec)

### 2.2 Deploy Backend
1. In same project: + New → GitHub Repo → `revtrust`
2. Configure service:
   - Root Directory: `backend`
   - (Everything else auto-detected)

### 2.3 Add Environment Variables
Click service → Variables tab:

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
CLERK_SECRET_KEY=sk_live_YOUR_KEY
ALLOWED_ORIGINS=http://localhost:3000
ENVIRONMENT=production
PYTHONUNBUFFERED=1
```

### 2.4 Generate Domain
1. Service → Settings → Networking
2. Generate Domain
3. **COPY THIS URL** → You need it for frontend!

Example: `https://revtrust-backend-production-abc123.up.railway.app`

### 2.5 Test
```bash
curl https://YOUR-BACKEND-URL/api/health
# Should return: {"status":"healthy"}
```

**✅ Backend Live**

---

## Step 3: Deploy Frontend - Vercel (10 min)

### 3.1 Import Project
1. Go to https://vercel.com
2. Add New → Project → Import `revtrust` repo
3. Configure:
   - Framework: Next.js (auto-detected)
   - Root Directory: `frontend`

### 3.2 Add Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-BACKEND-URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY
CLERK_SECRET_KEY=sk_live_YOUR_KEY
NODE_ENV=production
```

### 3.3 Deploy
1. Click Deploy
2. Wait 2-3 minutes
3. **COPY VERCEL URL**

Example: `https://revtrust-abc123.vercel.app`

**✅ Frontend Live**

---

## Step 4: Connect Everything (5 min)

### 4.1 Update Backend CORS
1. Railway → Backend service → Variables
2. Update `ALLOWED_ORIGINS`:
```bash
ALLOWED_ORIGINS=https://YOUR-VERCEL-URL.vercel.app
```
3. Auto-redeploys

### 4.2 Configure Clerk
1. https://dashboard.clerk.com
2. Your app → Domains → Add: `YOUR-VERCEL-URL.vercel.app`
3. Paths → Update:
   - Sign-in: `https://YOUR-VERCEL-URL/sign-in`
   - Sign-up: `https://YOUR-VERCEL-URL/sign-up`
   - After sign-in: `https://YOUR-VERCEL-URL/upload`
   - After sign-up: `https://YOUR-VERCEL-URL/upload`

**✅ Everything Connected**

---

## Step 5: Test Production (5 min)

Visit your Vercel URL and test:

- [ ] Sign up with new account
- [ ] Upload CSV file
- [ ] View results
- [ ] Health chart shows
- [ ] Deals table shows
- [ ] Export works
- [ ] History works

**✅ RevTrust is LIVE! 🎉**

---

## Your Production URLs

**Frontend:** `https://YOUR-APP.vercel.app`
**Backend API:** `https://YOUR-BACKEND.up.railway.app`
**Health Check:** `https://YOUR-BACKEND.up.railway.app/api/health`

---

## Troubleshooting

### Backend not responding?
- Check Railway logs: Project → Backend → Deployments → Logs
- Verify DATABASE_URL is set
- Ensure Prisma migrations ran

### Frontend can't reach backend?
- Check NEXT_PUBLIC_API_URL is correct (must include https://)
- Verify CORS allows your frontend domain
- Check Network tab in browser DevTools

### Auth not working?
- Verify Clerk domain is added
- Check redirect URLs match exactly
- Ensure using production keys (pk_live_, sk_live_)

### Build fails?
- **Backend:** Check poetry.lock is committed
- **Frontend:** Check all dependencies in package.json
- View detailed logs in Railway/Vercel dashboards

---

## What's Next?

1. **Invite Beta Testers** - Share your URL!
2. **Monitor** - Watch Railway + Vercel logs
3. **Collect Feedback** - Set up feedback form
4. **Iterate** - Push updates (auto-deploys)
5. **Add Domain** - Buy custom domain (optional)

---

## Quick Commands Reference

**View logs:**
```bash
# Railway
railway logs

# Vercel
vercel logs
```

**Redeploy:**
```bash
# Just push to GitHub
git push origin main
# Both auto-deploy!
```

**Add custom domain:**
- Vercel: Project → Settings → Domains → Add
- Update Clerk redirects with new domain
- Update Railway CORS with new domain

---

## Cost: $0/month

✅ Railway: Free tier ($5 credit)
✅ Vercel: Free tier (Hobby)
✅ Clerk: Free tier (10K users)
✅ Total: $0 for POC/MVP stage

---

## Need Help?

See full guide: `DEPLOYMENT.md`

**Support Resources:**
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Clerk: https://clerk.com/docs

---

**You did it! RevTrust is live! 🚀**

Now go get those users and start building your business!
