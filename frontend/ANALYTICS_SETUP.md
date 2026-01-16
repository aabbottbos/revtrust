# PostHog Analytics Setup Guide

PostHog has been fully integrated into RevTrust! This guide will help you complete the setup and start tracking user behavior.

## 🚀 Quick Setup (5 minutes)

### 1. Create PostHog Account

1. Go to [PostHog Cloud](https://app.posthog.com/signup)
2. Sign up for a free account (1M events/month free)
3. Create a new project called "RevTrust"

### 2. Get Your API Key

1. In PostHog, go to **Settings** → **Project** → **Project API Key**
2. Copy your Project API Key (starts with `phc_`)

### 3. Add Environment Variables

Add to your `frontend/.env.local` file:

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### 4. Restart Your Dev Server

```bash
cd frontend
npm run dev
```

That's it! Analytics are now tracking. 🎉

---

## 📊 What's Being Tracked

### Automatic Tracking

✅ **Page Views** - Every page navigation
✅ **User Identification** - Automatic with Clerk login
✅ **Session Recordings** - Watch user sessions (privacy-safe, inputs masked)
✅ **Autocapture** - Clicks on buttons and links

### Custom Events Already Implemented

- `csv_uploaded` - When users upload CSV files
- `analysis_completed` - When pipeline analysis finishes
- `analysis_started` - When analysis begins
- `ai_review_started` - When AI insights are triggered
- `ai_review_completed` - When AI analysis finishes
- `upgrade_clicked` - When users click upgrade buttons
- `payment_completed` - When subscription payment succeeds
- `export_downloaded` - When users export reports
- `feedback_submitted` - When users submit feedback
- `crm_connected` - When CRM integration connects
- `deal_reviewed` - When users review deals in wizard
- `rule_modified` - When business rules are edited
- `win_loss_viewed` - When win/loss patterns are viewed

### User Properties Tracked

- Email address
- Full name
- Account creation date
- User ID (Clerk)

---

## 🎯 Key Metrics to Monitor

### Activation Funnel (Most Important)

Track this in PostHog → Insights → Funnels:

1. Sign up completed
2. First CSV uploaded OR CRM connected
3. First analysis completed
4. Upgrade clicked
5. Payment completed

**Target:** Improve each step's conversion rate

### User Retention

Track in PostHog → Insights → Retention:

- **Day 1 retention** - Do users come back the next day?
- **Week 1 retention** - Do they use it again within 7 days?
- **Monthly retention** - Active users month-over-month

**Target:** 40%+ D1, 20%+ W1, 10%+ Monthly

### Feature Adoption

Track which features drive upgrades:

- % of users who view AI insights
- % of users who use deal review wizard
- % of users who connect CRM vs upload CSV
- % of users who export reports

**Insight:** Features used before upgrade = valuable features

---

## 🔧 PostHog Dashboard Setup

### Recommended Dashboards

#### 1. **Activation Dashboard**

Create in PostHog → Dashboards → New Dashboard

Tiles to add:
- Sign-ups (trend)
- Activation funnel (CSV → Analysis → Results)
- Time to first value (custom event)
- Drop-off points (funnel analysis)

#### 2. **Product Usage Dashboard**

Tiles to add:
- Daily/Weekly Active Users
- Feature usage breakdown (pie chart)
- Session duration (average)
- AI insights usage vs plan type

#### 3. **Revenue Dashboard**

Tiles to add:
- Upgrade clicks by source
- Conversion rate (visitor → paid)
- Payment completed events
- Average time to upgrade

---

## 🎬 Session Recordings

### Enable Session Replay (Already Configured!)

Session recordings are **privacy-safe**:
- ✅ All input fields are masked
- ✅ Only your domain is recorded
- ✅ Personal data is redacted

### How to Use

1. Go to PostHog → Session Recordings
2. Filter by:
   - Users who upgraded (to see what they did)
   - Users who churned (to see where they got stuck)
   - Error pages (to find bugs)

### Pro Tip

Watch 5 session recordings per week. You'll discover:
- Confusing UI elements
- Features users can't find
- Workflow bottlenecks
- Unexpected use cases

---

## 🚩 Feature Flags (Bonus)

PostHog includes feature flags for A/B testing!

### Example: Test Two Pricing Page Versions

```typescript
import posthog from 'posthog-js'

// In your component
const showNewPricing = posthog.getFeatureFlag('new-pricing-page')

if (showNewPricing) {
  return <NewPricingPage />
} else {
  return <OldPricingPage />
}
```

---

## 📈 Growth Insights

### Questions PostHog Will Answer

1. **Where do users drop off?**
   → Funnel analysis shows exact steps

2. **Which features drive upgrades?**
   → Correlation analysis between events and conversions

3. **Why do users churn?**
   → Session recordings + user paths

4. **What's our activation rate?**
   → % of sign-ups who complete first analysis

5. **Which marketing channels work?**
   → UTM tracking in page views

---

## 🔒 Privacy & Compliance

### GDPR-Friendly Settings (Already Enabled)

- ✅ `person_profiles: "identified_only"` - Only track logged-in users
- ✅ `maskAllInputs: true` - Hide all form inputs
- ✅ No third-party cookies
- ✅ Can self-host if needed

### Cookie Banner

PostHog doesn't require a cookie banner for:
- Logged-in users only
- No cross-site tracking
- EU cloud option available

---

## 🆘 Troubleshooting

### Events Not Showing Up?

1. Check browser console for errors
2. Verify `NEXT_PUBLIC_POSTHOG_KEY` is set
3. Check PostHog debug mode (enabled in development)
4. Wait 1-2 minutes for events to appear in PostHog

### Debug Mode

In development, PostHog automatically logs to console:

```
📊 Event: analysis_completed { analysisId: "abc123", issueCount: 5 }
```

### Test Your Setup

```typescript
// In browser console
posthog.capture('test_event', { test: true })
```

Check PostHog → Live Events (should appear within seconds)

---

## 🎓 Learning Resources

- [PostHog Documentation](https://posthog.com/docs)
- [Next.js Integration Guide](https://posthog.com/docs/libraries/next-js)
- [Session Replay Guide](https://posthog.com/docs/session-replay)
- [Funnel Analysis Guide](https://posthog.com/docs/user-guides/funnels)

---

## 📞 Support

PostHog Issues: support@posthog.com
RevTrust Analytics Questions: Check the code in `frontend/lib/analytics.ts`

---

## 🎯 Next Steps

1. ✅ Set up your PostHog account
2. ✅ Add environment variables
3. ✅ Test by navigating your app
4. Create your first funnel (Sign up → First analysis)
5. Set up weekly dashboard review
6. Watch 5 session recordings
7. Set up Slack alerts for key events

**Pro tip:** Set a calendar reminder to review PostHog every Monday for 15 minutes. This habit will 10x your product insights.
