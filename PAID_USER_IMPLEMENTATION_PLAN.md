# Paid User Access Implementation Plan

## Executive Summary

This plan outlines the changes needed to ensure that once a user has paid via Stripe, they can access all AI capabilities and no longer see subscription prompts or upgrade CTAs throughout the application.

---

## Current State Analysis

### ✅ What's Already Working

1. **Stripe Integration (Backend)**
   - Checkout session creation: `backend/app/routes/stripe_routes.py`
   - Webhook handling: `backend/app/routes/webhooks.py`
   - Subscription service: `backend/app/services/subscription_service.py`
   - User model has subscription fields: `subscriptionTier`, `subscriptionStatus`, `stripeCustomerId`, `stripeSubscriptionId`

2. **Webhook Flow**
   - `customer.subscription.created` → Updates user to `pro` tier with `active` status
   - `customer.subscription.updated` → Updates subscription status
   - `customer.subscription.deleted` → Downgrades user to `free` tier
   - Includes retry logic and error logging

3. **AI Access Control (Backend)**
   - `backend/app/routes/ai_analysis.py` checks AI access via `subscription_service.check_ai_access()`
   - Returns 403 if user doesn't have access
   - `REQUIRE_PAYMENT` env var allows dev mode bypass

4. **Frontend Subscription Hook**
   - `frontend/hooks/useSubscription.ts` fetches subscription status from `/api/user/subscription`
   - Returns `hasAIAccess`, `isPaid`, `tier` flags
   - Used in `AIInsightsSection` and dashboard

5. **Backend User Subscription Endpoint**
   - `backend/app/routes/user.py` → `/api/user/subscription`
   - Returns feature flags based on tier: `hasAIAccess`, `hasScheduledReviews`, etc.

### ❌ What's Missing / Needs Work

1. **Inconsistent UI Gating**
   - Some components check `hasAIAccess`, others check `isPaid` or `subscriptionTier` directly
   - No centralized "paywall" component for consistency
   - Dashboard shows "Pro" badges even for paid users (should just show as unlocked features)

2. **AI Insights Section Shows Upgrade CTA**
   - `AIInsightsSection.tsx` shows blurred preview + upgrade button for non-paid users
   - This is correct behavior but needs testing to ensure it's removed for paid users

3. **Dashboard Upgrade Prompts**
   - Dashboard shows "Upgrade to Pro" buttons on Saved Scans and Scheduled Scans cards
   - Banner at bottom says "Unlock Pro Features"
   - These should be hidden for paid users

4. **Missing Real-Time Updates**
   - After payment success, user needs to refresh or wait for polling to see updated status
   - Success page polls after 2 seconds, but other pages don't automatically update

5. **No Subscription Cache Invalidation**
   - When webhook updates subscription, frontend doesn't know to refetch
   - User may see stale subscription data until they refresh

---

## Implementation Plan

### Phase 1: Backend Consistency (Highest Priority)

#### 1.1 Verify Webhook Updates User Correctly
**Files:** `backend/app/routes/webhooks.py`

**Action:** Test and verify
- When `customer.subscription.created` fires, user is updated to `tier: "pro"`, `status: "active"`
- Verify `stripeCustomerId` and `stripeSubscriptionId` are saved
- Test locally using Stripe CLI webhook forwarding

**Acceptance Criteria:**
- After successful payment, database shows user with `subscriptionTier = "pro"` and `subscriptionStatus = "active"`
- Subsequent calls to `/api/user/subscription` return `hasAIAccess: true`

#### 1.2 Ensure `/api/user/subscription` Returns Correct Flags
**Files:** `backend/app/routes/user.py`

**Current Logic:**
```python
ai_tiers = ["pro", "team", "enterprise"]
hasAIAccess = is_active and tier in ai_tiers
```

**Action:** Verify this logic is working
- User with `tier = "pro"` and `status = "active"` should get `hasAIAccess: true`
- Test with actual database query

**Acceptance Criteria:**
- Pro user gets `hasAIAccess: true`
- Free user gets `hasAIAccess: false`

---

### Phase 2: Frontend Subscription State Management

#### 2.1 Update `useSubscription` Hook for Better Caching
**Files:** `frontend/hooks/useSubscription.ts`

**Changes:**
1. Add ability to manually invalidate cache (for post-payment refresh)
2. Consider adding a polling mechanism or WebSocket for real-time updates (optional)

**Implementation:**
```typescript
// Add a refetch function that components can call
export function useSubscription() {
  // ... existing code ...

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,  // Already exists
    isPaid: subscription.hasActiveSubscription,
    hasAIAccess: subscription.hasAIAccess,
    tier: subscription.tier,
  }
}
```

**Acceptance Criteria:**
- `refetch()` can be called to manually update subscription status
- Used in subscription success page and after returning from Stripe

#### 2.2 Update Subscription Success Page to Trigger Refetch
**Files:** `frontend/app/subscription/success/page.tsx`

**Changes:**
Currently polls backend after 2 seconds. Instead:
1. Call subscription refetch immediately
2. Show loading state until subscription is confirmed as "pro"
3. Handle edge case where webhook hasn't processed yet (keep polling with timeout)

**Acceptance Criteria:**
- User sees "Activating..." state
- Once subscription is confirmed, shows "Active" state
- If webhook takes >30 seconds, shows helpful message to refresh

---

### Phase 3: Remove Upgrade CTAs for Paid Users

#### 3.1 Dashboard Component Updates
**Files:** `frontend/app/(platform)/dashboard/page.tsx`

**Current Issues:**
- Lines 247-296: Saved Scans card shows "Pro" badge and "Upgrade to Pro" for non-paid
- Lines 300-349: Scheduled Scans card shows "Pro" badge and "Upgrade to Pro" for non-paid
- Lines 461-486: Bottom banner says "Unlock Pro Features" for non-paid

**Changes:**
- For paid users (`isPaidUser = true`):
  - Remove Lock icon badges
  - Show features as unlocked/available
  - Remove "Upgrade to Pro" buttons
  - Remove bottom upgrade banner
- Keep all upgrade CTAs for free users

**Acceptance Criteria:**
- Paid user dashboard shows NO upgrade prompts
- Paid user can click "View Saved Scans" and "Manage Schedules" directly
- Bottom banner is completely hidden for paid users

**Pseudo-code:**
```tsx
// Saved Scans Card
<Card className={`relative overflow-hidden`}>
  {/* Remove Lock badge for paid users */}
  {!isPaidUser && (
    <div className="absolute top-4 right-4">
      <Badge>Pro</Badge>
    </div>
  )}
  <CardContent>
    {isPaidUser ? (
      // Show unlocked features
      <Button onClick={() => router.push("/scan")}>
        View Saved Scans
      </Button>
    ) : (
      // Show upgrade CTA
      <Button onClick={() => router.push("/pricing")}>
        Upgrade to Pro
      </Button>
    )}
  </CardContent>
</Card>

// Bottom Banner - completely hide for paid users
{!isPaidUser && (
  <Card>Unlock Pro Features...</Card>
)}
```

#### 3.2 AI Insights Section
**Files:** `frontend/components/results/AIInsightsSection.tsx`

**Current Implementation:**
- Shows blurred preview + upgrade CTA if `!hasAIAccess`
- Auto-triggers AI analysis for paid users
- Polls for results

**Changes:**
- Verify behavior is correct (should already work)
- Test that paid users see AI insights automatically
- Ensure loading state works properly

**Acceptance Criteria:**
- Free users see blurred preview with "Upgrade to Pro" button
- Paid users see AI insights automatically load
- No "Upgrade" messaging visible to paid users

#### 3.3 Results Page AI Tab
**Files:** `frontend/app/(platform)/results/[id]/page.tsx`

**Current Implementation:**
- Uses `useSubscription` hook to get `hasAIAccess`
- Passes to `<AIInsightsSection hasAIAccess={hasAIAccess} />`

**Changes:**
- Verify that this is working correctly
- Ensure no upgrade CTAs leak through

**Acceptance Criteria:**
- Paid user sees AI insights tab with full content
- Free user sees upgrade prompt

---

### Phase 4: Edge Cases & Polish

#### 4.1 Handle Subscription Cancellation
**Files:** `backend/app/routes/webhooks.py`

**Current Implementation:**
- `customer.subscription.deleted` → sets tier to "free" and status to "cancelled"

**Changes Needed:**
- Verify this works and user loses AI access immediately
- Frontend should update to show upgrade CTAs again

**Acceptance Criteria:**
- Cancelled user's subscription endpoint returns `hasAIAccess: false`
- Dashboard reverts to showing upgrade prompts

#### 4.2 Handle Subscription Update (e.g., card expired, payment failed)
**Files:** `backend/app/routes/webhooks.py`

**Current Implementation:**
- `customer.subscription.updated` → updates status
- `invoice.payment_failed` → logs but doesn't change user status

**Potential Issue:**
- Stripe may set subscription to `past_due` or `unpaid`
- Our webhook maps to "active" or "cancelled"

**Changes Needed:**
```python
# Update webhook handler
our_status = "active" if status == "active" else "cancelled"
```

Should be:
```python
# Map Stripe statuses more accurately
if status in ["active", "trialing"]:
    our_status = "active"
else:
    our_status = "cancelled"  # includes past_due, unpaid, canceled, etc.
```

**Acceptance Criteria:**
- User with failed payment loses AI access
- Status shown as "Payment Failed" or similar in subscription page

#### 4.3 Loading States & Error Handling
**Files:** All frontend components using `useSubscription`

**Changes:**
- Show loading skeleton while subscription is loading
- Handle error state gracefully (default to free tier to be safe)
- Don't break UI if subscription endpoint fails

**Acceptance Criteria:**
- No flickering between paid/free states
- Graceful degradation if backend is unavailable

#### 4.4 Pricing Page Updates (Optional)
**Files:** `frontend/app/pricing/page.tsx`

**Changes:**
- For paid users visiting pricing page:
  - Show "Current Plan" badge on Pro tier
  - Change button to "Manage Subscription" instead of "Subscribe"
  - Link to `/subscription` page

**Acceptance Criteria:**
- Paid user doesn't see duplicate "Subscribe" button
- Clear indication of current plan

---

## Testing Plan

### Manual Testing Checklist

#### Test 1: New User → Paid User Flow
1. Create new user account
2. Navigate to `/dashboard` → Verify upgrade CTAs are visible
3. Click pricing, complete checkout with test card `4242 4242 4242 4242`
4. Redirected to success page → Verify subscription activates
5. Navigate to `/dashboard` → Verify NO upgrade CTAs
6. Navigate to `/results/{id}` → Verify AI insights load automatically
7. Check database: `subscriptionTier = "pro"`, `subscriptionStatus = "active"`

#### Test 2: Webhook Processing
1. Use Stripe CLI to trigger webhooks:
   - `stripe trigger customer.subscription.created`
   - Verify user updated in database
   - Verify frontend shows paid status after refetch

#### Test 3: Subscription Cancellation
1. For existing paid user, use Stripe Dashboard to cancel subscription
2. Webhook fires: `customer.subscription.deleted`
3. Database updated to `tier = "free"`, `status = "cancelled"`
4. Frontend refetch → Verify upgrade CTAs reappear
5. AI endpoints return 403

#### Test 4: Edge Cases
1. **Payment fails during checkout**
   - User remains on free tier
   - Dashboard shows upgrade CTAs
2. **Webhook delayed**
   - Success page shows loading state
   - Polls until subscription confirmed
3. **User refreshes during payment**
   - No double charge
   - Subscription status eventually reflects payment

---

## Rollout Plan

### Step 1: Backend Fixes (Low Risk)
1. Verify webhook handlers work correctly
2. Test `/api/user/subscription` endpoint
3. Deploy to staging, test with Stripe test mode

### Step 2: Frontend State Management (Medium Risk)
1. Update `useSubscription` hook with refetch
2. Update success page to use refetch
3. Test locally with webhook forwarding

### Step 3: Remove Upgrade CTAs (High Visibility)
1. Update Dashboard component
2. Update AI Insights Section (verify only)
3. Test thoroughly with both free and paid users
4. Deploy to staging

### Step 4: Edge Cases & Polish (Low Risk)
1. Handle subscription status edge cases
2. Improve loading/error states
3. Add logging for debugging

### Step 5: Production Deploy
1. Deploy backend changes first (backwards compatible)
2. Deploy frontend changes second
3. Monitor Stripe webhooks for errors
4. Monitor user support tickets for issues

---

## Acceptance Criteria Summary

### For Paid Users (Pro Tier, Active Status)
- ✅ Can access all AI features without restriction
- ✅ Dashboard shows NO upgrade prompts or "Pro" lock badges
- ✅ AI Insights load automatically on results page
- ✅ Saved Scans and Scheduled Scans features are fully accessible
- ✅ Bottom upgrade banner is hidden
- ✅ Subscription page shows "Manage Subscription" instead of "Upgrade"

### For Free Users
- ✅ Dashboard shows upgrade CTAs for Pro features
- ✅ AI Insights section shows blurred preview + upgrade button
- ✅ Cannot access `/api/ai/*` endpoints (403 error)
- ✅ Bottom upgrade banner visible

### System Behavior
- ✅ Webhook updates subscription in <5 seconds
- ✅ Frontend subscription state updates within 5 seconds of webhook
- ✅ Cancelled subscriptions immediately lose access
- ✅ Failed payments trigger downgrade to free tier

---

## Files to Modify

### Backend (Verification Only)
- `backend/app/routes/webhooks.py` - Verify subscription status mapping
- `backend/app/routes/user.py` - Verify feature flags logic
- `backend/app/services/subscription_service.py` - Already correct

### Frontend (Primary Changes)
- ✅ `frontend/hooks/useSubscription.ts` - Add refetch capability
- ✅ `frontend/app/subscription/success/page.tsx` - Use refetch on success
- 🔧 `frontend/app/(platform)/dashboard/page.tsx` - Remove upgrade CTAs for paid users
- ✅ `frontend/components/results/AIInsightsSection.tsx` - Verify behavior (likely correct)
- ✅ `frontend/app/(platform)/results/[id]/page.tsx` - Verify behavior (likely correct)
- 🔧 `frontend/app/pricing/page.tsx` - Show current plan for paid users (optional)

### Documentation
- ✅ `docs/guides/stripe.md` - Already comprehensive

---

## Environment Variables Required

### Backend `.env`
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
REQUIRE_PAYMENT=true  # Set to false for dev mode bypass
```

### Frontend `.env.local`
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Risk Assessment

### Low Risk
- Backend webhook handling (already implemented with retries)
- Subscription endpoint (already working)

### Medium Risk
- Frontend subscription state management (refetch logic)
- Success page polling (edge case handling)

### High Risk (High Visibility)
- Dashboard UI changes (must not break free user experience)
- AI Insights gating (must work for both free and paid)

---

## Success Metrics

1. **Conversion Rate**: % of users who complete payment
2. **Webhook Success Rate**: >99% of webhooks process successfully
3. **Time to Activation**: <10 seconds from payment to AI access
4. **Support Tickets**: <1% of paid users report access issues
5. **User Feedback**: Paid users report seamless experience

---

## Next Steps

1. **Review this plan** with stakeholder
2. **Prioritize changes** based on risk/impact
3. **Create tickets** for each phase
4. **Set up staging environment** with Stripe test mode
5. **Begin implementation** starting with Phase 1

