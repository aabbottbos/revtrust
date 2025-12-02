# Production Deployment Checklist

Use this checklist to ensure a smooth production deployment.

## Pre-Deployment

### Code Preparation
- [ ] All features tested locally
- [ ] No console errors in browser
- [ ] No warnings in terminal
- [ ] Code formatted and linted
- [ ] All dependencies up to date
- [ ] `.env` files not committed
- [ ] All test files working
- [ ] Documentation updated

### Credentials & Access
- [ ] GitHub account ready
- [ ] Railway account created
- [ ] Vercel account created
- [ ] Clerk production keys obtained
- [ ] Domain purchased (if using custom domain)
- [ ] Credit card added (if needed for hosting)

### Environment Files
- [ ] Backend `.env.production.example` reviewed
- [ ] Frontend `.env.production.example` reviewed
- [ ] All required keys identified
- [ ] No sensitive data in repo

---

## Backend Deployment (Railway)

### Database Setup
- [ ] Railway project created
- [ ] PostgreSQL database provisioned
- [ ] Database connection string obtained
- [ ] Connection tested

### Backend Service
- [ ] Backend service created from GitHub repo
- [ ] Root directory set to `backend`
- [ ] Environment variables added:
  - [ ] `DATABASE_URL` (from Postgres service)
  - [ ] `CLERK_SECRET_KEY` (production key)
  - [ ] `ALLOWED_ORIGINS` (will update after frontend)
  - [ ] `ENVIRONMENT=production`
  - [ ] `PYTHONUNBUFFERED=1`
- [ ] Public domain generated
- [ ] Domain URL saved for frontend config

### Backend Testing
- [ ] Deployment successful
- [ ] Build logs checked for errors
- [ ] Health endpoint responding: `/api/health`
- [ ] Database migrations ran successfully
- [ ] No errors in Railway logs

---

## Frontend Deployment (Vercel)

### Project Setup
- [ ] Vercel project created
- [ ] GitHub repo connected
- [ ] Root directory set to `frontend`
- [ ] Framework detected as Next.js

### Environment Variables
- [ ] Environment variables added:
  - [ ] `NEXT_PUBLIC_API_URL` (Railway backend URL)
  - [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (production)
  - [ ] `CLERK_SECRET_KEY` (production)
  - [ ] `NODE_ENV=production`

### Deployment
- [ ] First deployment successful
- [ ] Build completed without errors
- [ ] Vercel URL obtained and saved
- [ ] Site loads correctly

---

## Integration & Configuration

### Backend Updates
- [ ] Railway backend CORS updated with Vercel URL
- [ ] Backend service redeployed
- [ ] CORS working (no errors in browser console)

### Clerk Configuration
- [ ] Vercel domain added to Clerk
- [ ] Sign-in redirect URL updated
- [ ] Sign-up redirect URL updated
- [ ] After sign-in redirect set to `/upload`
- [ ] After sign-up redirect set to `/upload`
- [ ] Production mode enabled

### Cross-Service Testing
- [ ] Frontend can reach backend API
- [ ] Authentication flow works end-to-end
- [ ] No CORS errors
- [ ] Database writes successful

---

## Production Testing

### Authentication
- [ ] Sign up with new account works
- [ ] Email verification works (if enabled)
- [ ] Sign in works
- [ ] Sign out works
- [ ] Session persists on refresh
- [ ] Protected routes redirect properly

### Core Functionality
- [ ] Upload CSV file successfully
- [ ] Processing animation shows
- [ ] Redirect to results works
- [ ] Health chart displays correctly
- [ ] Score calculation accurate
- [ ] Deals table shows all data
- [ ] Filtering works
- [ ] Sorting works
- [ ] Pagination works (if applicable)

### Deal Details
- [ ] Click deal opens modal
- [ ] All deal data displays
- [ ] Violations list correct
- [ ] Close modal works
- [ ] Navigate between deals

### Export Features
- [ ] Download CSV works
- [ ] CSV contains correct data
- [ ] Copy summary to clipboard works
- [ ] Share link works (if implemented)

### History
- [ ] History page loads
- [ ] Previous analyses display
- [ ] Click analysis loads results
- [ ] Delete analysis works (if implemented)
- [ ] Pagination works (if implemented)

### Error Handling
- [ ] Upload invalid file → shows error
- [ ] Navigate to non-existent analysis → 404
- [ ] API errors show user-friendly messages
- [ ] Offline mode shows banner/message
- [ ] Form validation works

### Performance
- [ ] Initial page load < 3 seconds
- [ ] Analysis completes in reasonable time
- [ ] No memory leaks
- [ ] Images optimized
- [ ] No blocking resources

### Cross-Browser
- [ ] Chrome works
- [ ] Firefox works
- [ ] Safari works
- [ ] Edge works

### Mobile Responsive
- [ ] Mobile layout looks good
- [ ] Touch interactions work
- [ ] File upload works on mobile
- [ ] Tables scroll/responsive
- [ ] Modals work on small screens

---

## Monitoring & Observability

### Railway Monitoring
- [ ] Railway logs accessible
- [ ] No error spikes
- [ ] Response times acceptable
- [ ] Database connections healthy

### Vercel Monitoring
- [ ] Vercel Analytics enabled
- [ ] Function logs accessible
- [ ] Build logs clean
- [ ] Edge locations configured

### External Monitoring
- [ ] Uptime monitor configured (UptimeRobot, etc.)
- [ ] Alert email set up
- [ ] Status page created (optional)
- [ ] Error tracking set up (Sentry, optional)

### Database
- [ ] Automatic backups enabled
- [ ] Backup frequency set
- [ ] Restore tested (optional but recommended)
- [ ] Connection pooling configured

---

## Security

### Credentials
- [ ] All production keys rotated from dev keys
- [ ] No API keys in frontend code
- [ ] Environment variables not exposed
- [ ] `.env` files in `.gitignore`

### HTTPS & Domains
- [ ] All connections over HTTPS
- [ ] SSL certificates valid
- [ ] No mixed content warnings
- [ ] CORS restricted to your domains only

### API Security
- [ ] Rate limiting enabled (optional for POC)
- [ ] Input validation working
- [ ] SQL injection protected (Prisma handles this)
- [ ] XSS protection enabled

### Authentication
- [ ] Session timeout configured
- [ ] Strong password requirements (Clerk default)
- [ ] MFA available (Clerk handles)
- [ ] Secure cookie settings

---

## Documentation

### Internal Docs
- [ ] README.md updated with production URLs
- [ ] DEPLOYMENT.md accurate
- [ ] CHANGELOG.md updated
- [ ] Environment variables documented

### External Docs (Optional)
- [ ] User guide created
- [ ] FAQ written
- [ ] Video tutorial recorded
- [ ] Support email set up

---

## Custom Domain (Optional)

### Domain Setup
- [ ] Domain purchased
- [ ] Domain added to Vercel
- [ ] DNS records configured
- [ ] SSL certificate provisioned
- [ ] Domain resolves correctly

### Service Updates
- [ ] Clerk domain updated
- [ ] Backend CORS updated
- [ ] All redirects updated
- [ ] Old URL redirects to new domain

---

## Post-Deployment

### Immediate (First Hour)
- [ ] Smoke test all features
- [ ] Monitor logs for errors
- [ ] Check error rates
- [ ] Verify analytics tracking

### First 24 Hours
- [ ] No critical errors reported
- [ ] Performance metrics good
- [ ] User feedback collected
- [ ] Minor issues documented

### First Week
- [ ] User analytics reviewed
- [ ] Performance optimizations identified
- [ ] Bug fixes prioritized
- [ ] Feature requests collected

---

## Rollback Plan

### If Critical Issue Found
1. [ ] Identify the issue
2. [ ] Determine if rollback needed
3. [ ] Railway: Redeploy previous version
4. [ ] Vercel: Promote previous deployment
5. [ ] Database: Restore backup (if needed)
6. [ ] Notify users (if public)
7. [ ] Fix issue in development
8. [ ] Test fix thoroughly
9. [ ] Redeploy with fix

### Rollback Testing
- [ ] Know how to rollback backend
- [ ] Know how to rollback frontend
- [ ] Database backup/restore tested
- [ ] Rollback takes < 5 minutes

---

## Launch Announcement

### Marketing (Optional)
- [ ] Landing page copy finalized
- [ ] Screenshots taken
- [ ] Demo video recorded
- [ ] Social media posts drafted

### Community
- [ ] Product Hunt submission (if ready)
- [ ] HackerNews Show HN (if ready)
- [ ] Reddit posts in relevant subs
- [ ] LinkedIn announcement

### Beta Users
- [ ] Beta tester list ready
- [ ] Invitation emails sent
- [ ] Feedback form created
- [ ] Support channel set up

---

## Success Criteria

- [ ] ✅ Backend healthy and responding
- [ ] ✅ Frontend loads without errors
- [ ] ✅ Authentication flow works
- [ ] ✅ Core feature (upload → results) works
- [ ] ✅ Export functionality works
- [ ] ✅ No critical bugs
- [ ] ✅ Performance acceptable
- [ ] ✅ Monitoring active
- [ ] ✅ Documentation complete
- [ ] ✅ Beta users can access

---

## Notes

**Deployment Date:** _______________

**Deployed By:** _______________

**Backend URL:** _______________

**Frontend URL:** _______________

**Issues Found:**
-
-
-

**Follow-up Items:**
-
-
-

---

**🎉 Congratulations on your deployment! 🚀**

Remember:
- Monitor closely for first 24 hours
- Respond quickly to user feedback
- Iterate based on real usage
- Celebrate small wins!

Good luck with RevTrust! 💪
