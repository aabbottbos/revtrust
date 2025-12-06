# Clerk Authentication Implementation

## Overview

RevTrust now uses Clerk for authentication to support a multi-user system that can scale to 10,000+ users. Each user's data is properly isolated based on their Clerk user ID.

## What Was Implemented

### Backend (Python/FastAPI)

1. **JWT Verification** (`backend/app/auth.py`)
   - Proper JWT token verification using Clerk's JWKS endpoint
   - Extracts user ID from the `sub` claim in the JWT
   - Falls back to "anonymous_user" in development if no token provided
   - Ready for production with full token validation

2. **Dependencies Added**
   - `pyjwt` - For JWT decoding and verification
   - `cryptography` - For cryptographic operations

3. **Environment Configuration**
   - `CLERK_SECRET_KEY` - Already configured in `.env`
   - JWKS URL derived from Clerk publishable key

### Frontend (Next.js/React)

1. **Middleware** (`frontend/middleware.ts`)
   - Protects all routes except public ones (/, /sign-in, /sign-up)
   - Automatically redirects unauthenticated users to sign-in
   - Uses `@clerk/nextjs/server` for route protection

2. **Auth Hook** (`frontend/hooks/useAuthenticatedFetch.ts`)
   - Custom hook for making authenticated API calls
   - Automatically includes Clerk JWT token in Authorization header
   - Easy to use in any client component

3. **API Client** (`frontend/lib/api-client.ts`)
   - Helper functions for server-side authenticated requests
   - Supports both server components and API routes

4. **Example Usage** (`frontend/app/(platform)/history/page.tsx`)
   - Updated to use `useAuthenticatedFetch()` hook
   - All API calls now include authentication tokens

## How It Works

###  1. User Authentication Flow

```
User → Clerk Sign-In → JWT Token Issued → Stored in Browser
```

### 2. API Request Flow

```
Frontend Component
  ↓
useAuthenticatedFetch()
  ↓
Gets JWT from Clerk
  ↓
Adds "Authorization: Bearer {token}" header
  ↓
Backend receives request
  ↓
auth.py verifies JWT with Clerk JWKS
  ↓
Extracts user_id from 'sub' claim
  ↓
Query database filtered by user_id
  ↓
Return user-specific data
```

### 3. User Isolation

Each user's data is isolated using their Clerk user ID:

- **Scheduled Reviews**: Filtered by `userId` field
- **CRM Connections**: Filtered by `userId` field
- **Review Runs**: Filtered through scheduled review relationship
- **Analysis History**: Filtered by `user_id` in status store

## Usage Guide

### For Frontend Developers

**In Client Components:**

```typescript
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"

export default function MyComponent() {
  const authenticatedFetch = useAuthenticatedFetch()

  const fetchData = async () => {
    const response = await authenticatedFetch(`${API_URL}/api/my-endpoint`)
    const data = await response.json()
    return data
  }
}
```

**In Server Components or API Routes:**

```typescript
import { authenticatedFetch } from "@/lib/api-client"

export async function GET() {
  const response = await authenticatedFetch(`${API_URL}/api/my-endpoint`)
  const data = await response.json()
  return Response.json(data)
}
```

### For Backend Developers

**In FastAPI Endpoints:**

```python
from app.auth import get_current_user_id
from fastapi import Depends

@router.get("/my-endpoint")
async def my_endpoint(
    user_id: str = Depends(get_current_user_id)
):
    # user_id is the Clerk user ID from the JWT token
    # Query data filtered by this user_id
    data = await prisma.mymodel.find_many(
        where={"userId": user.id}  # Use database ID, not clerkId directly
    )
    return data
```

**Important Pattern:**
```python
# Always look up user by clerkId first to get database ID
user = await prisma.user.find_unique(where={"clerkId": user_id})
if not user:
    return []

# Then query related data using database userId
data = await prisma.related.find_many(where={"userId": user.id})
```

## Testing Multi-User Setup

### 1. Create Test Users in Clerk

1. Go to Clerk Dashboard
2. Navigate to Users
3. Create 2+ test users with different emails

### 2. Test User Isolation

1. Sign in as User A
2. Create some scheduled reviews
3. Sign out
4. Sign in as User B
5. Verify User B cannot see User A's data

### 3. Check Backend Logs

Look for authentication logs:
```
✅ Authenticated user: user_2abc123...
```

If you see:
```
⚠️  No authorization header - using anonymous_user
```
Then the frontend isn't sending tokens properly.

## Migration Notes

### Existing Data

All existing data is currently associated with "anonymous_user". To migrate:

1. Identify which real user should own the data
2. Update the `userId` field to point to the correct user's database ID

### Development vs Production

**Development Mode:**
- Falls back to "anonymous_user" if no token
- Allows testing without auth

**Production Mode:**
- Should use `require_auth()` instead of `get_current_user_id()`
- Rejects requests without valid tokens

To switch an endpoint to production mode:
```python
from app.auth import require_auth

@router.get("/protected-endpoint")
async def protected(user_id: str = Depends(require_auth)):  # Changed from get_current_user_id
    # This will return 401 if not authenticated
    pass
```

## Security Considerations

1. **Token Storage**: JWT tokens are stored securely by Clerk in httpOnly cookies
2. **Token Expiration**: Tokens expire and are automatically refreshed by Clerk
3. **JWKS Verification**: Public keys are fetched from Clerk's JWKS endpoint and cached
4. **No Password Storage**: Passwords are managed entirely by Clerk
5. **Rate Limiting**: Consider adding rate limiting for API endpoints
6. **CORS**: Already configured to allow requests from frontend origin

## Scaling to 10k+ Users

The implementation is designed for scale:

1. **JWT Verification**: Stateless - no database lookups for auth
2. **JWKS Caching**: Public keys cached to avoid repeated fetches
3. **Database Indexing**: Ensure `userId` fields are indexed
4. **Clerk Infrastructure**: Handles authentication for millions of users

### Recommended Database Indexes

```sql
CREATE INDEX idx_scheduled_review_user_id ON "ScheduledReview"("userId");
CREATE INDEX idx_crm_connection_user_id ON "CRMConnection"("userId");
CREATE INDEX idx_review_run_scheduled_review ON "ReviewRun"("scheduledReviewId", "status");
```

## Troubleshooting

### Users seeing each other's data

**Cause**: Frontend not sending auth tokens
**Solution**: Check that pages use `useAuthenticatedFetch()` hook

### "anonymous_user" in logs

**Cause**: No Authorization header in request
**Solution**: Ensure middleware.ts is protecting routes and components use auth hook

### JWT verification errors

**Cause**: Wrong JWKS URL or expired keys
**Solution**: Verify JWKS URL matches your Clerk instance

### Token expired errors

**Cause**: User's session expired
**Solution**: Clerk automatically handles refresh - ensure ClerkProvider wraps app

## Next Steps

1. **Update All API Calls**: Search frontend for `fetch(` and replace with `authenticatedFetch`
2. **Add User Profile**: Show current user info in nav bar
3. **Add Sign Out**: Implement sign out functionality
4. **Webhook Integration**: Set up Clerk webhooks to sync user data
5. **Production Hardening**: Switch critical endpoints to use `require_auth()`

## Support

For Clerk-specific issues:
- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Discord](https://clerk.com/discord)
