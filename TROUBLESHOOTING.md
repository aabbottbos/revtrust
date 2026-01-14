# Troubleshooting Dashboard Error

## Error
```
Failed to fetch dashboard stats
```

## Diagnostic Steps

### 1. Check Backend Server
```bash
# Check if backend is running
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy"}
```

### 2. Check Authentication
The dashboard endpoint requires authentication. Make sure:
- You are logged in with Clerk
- The Clerk session is valid
- The backend has the correct `CLERK_SECRET_KEY`

### 3. Check Browser Console

Open browser DevTools (F12) and look for:

**Console Errors:**
- Any CORS errors?
- Any authentication errors?
- Full error message?

**Network Tab:**
- Find the request to `/api/dashboard/stats`
- What is the status code? (401 = auth issue, 500 = server error, 0 = network/CORS)
- Click on the request and check:
  - Request Headers (is Authorization header present?)
  - Response (what does the server return?)

### 4. Check Backend Logs

In your backend terminal, you should see logs like:
```
INFO:     127.0.0.1:xxxxx - "GET /api/dashboard/stats HTTP/1.1" 200 OK
```

If you don't see any logs when loading the dashboard, the request isn't reaching the server (likely CORS or network issue).

### 5. Common Issues

#### Issue: Status Code 0 or CORS Error
**Cause:** CORS misconfiguration or backend not running
**Fix:**
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check ALLOWED_ORIGINS in backend `.env`: should include `http://localhost:3000`
3. Restart backend server

#### Issue: Status Code 401
**Cause:** Authentication failed
**Fix:**
1. Log out and log back in
2. Check that `CLERK_SECRET_KEY` is set in backend `.env`
3. Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in frontend `.env.local`

#### Issue: Status Code 500
**Cause:** Server error in dashboard stats endpoint
**Fix:**
1. Check backend logs for full error traceback
2. Likely a database connection issue or missing data

### 6. Manual Test

You can test the endpoint manually using curl with a valid Clerk token:

```bash
# 1. Get your Clerk token from browser
# - Open DevTools → Application → Cookies
# - Find __session cookie
# - Copy the value

# 2. Test endpoint
curl -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  http://localhost:8000/api/dashboard/stats
```

### 7. Quick Fix - Restart Everything

```bash
# Terminal 1: Backend
cd backend
poetry run uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Stripe webhooks (if testing payments)
stripe listen --forward-to localhost:8000/api/webhooks/stripe
```

Then:
1. Clear browser cache
2. Log out
3. Log back in
4. Navigate to `/dashboard`

### 8. Check Environment Variables

**Frontend `.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

**Backend `.env`:**
```bash
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
ALLOWED_ORIGINS=http://localhost:3000
```

## Next Steps

Please provide:
1. **Browser Console Output** - Full error message
2. **Network Tab** - Status code and response for `/api/dashboard/stats`
3. **Backend Logs** - Any errors when the request is made

This will help me identify the exact issue.
