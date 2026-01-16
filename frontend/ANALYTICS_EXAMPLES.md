# Analytics Examples - Quick Reference

Common use cases for tracking analytics in RevTrust components.

## Basic Event Tracking

### Track a Button Click

```typescript
import { analytics } from "@/lib/analytics"

function MyComponent() {
  const handleUpgrade = () => {
    analytics.upgradeClicked("results-page", "pro")
    // ... rest of upgrade logic
  }

  return <Button onClick={handleUpgrade}>Upgrade to Pro</Button>
}
```

### Track a Form Submission

```typescript
import { trackEvent } from "@/lib/analytics"

function ContactForm() {
  const handleSubmit = async (data: FormData) => {
    trackEvent("contact_form_submitted", {
      formType: "sales_inquiry",
      dealCount: data.dealCount,
    })
    // ... submit logic
  }
}
```

## User Properties

### Update User Properties When Subscription Changes

```typescript
import { setUserProperties } from "@/lib/analytics"

function SubscriptionManager() {
  useEffect(() => {
    if (subscription) {
      setUserProperties({
        plan: subscription.plan, // "free" | "pro" | "enterprise"
        mrr: subscription.amount,
        subscriptionStatus: subscription.status,
        trialEndsAt: subscription.trialEndsAt,
      })
    }
  }, [subscription])
}
```

## Using the Hook

### Track Component Views

```typescript
import { useTrackComponentMount } from "@/hooks/usePostHog"

function DealReviewWizard({ dealId }: Props) {
  // Automatically tracks when this component is viewed
  useTrackComponentMount("deal_review_wizard", { dealId })

  return <div>Deal Review Content</div>
}
```

### Track Time Spent

```typescript
import { useTrackTimeSpent } from "@/hooks/usePostHog"

function AIInsightsSection() {
  // Tracks how long users spend viewing AI insights
  useTrackTimeSpent("ai_insights_section")

  return <div>AI Insights...</div>
}
```

### Feature Flags

```typescript
import { usePostHog } from "@/hooks/usePostHog"

function PricingPage() {
  const { isFeatureEnabled } = usePostHog()

  const showNewPricing = isFeatureEnabled("new-pricing-layout")

  if (showNewPricing) {
    return <NewPricingLayout />
  }

  return <OldPricingLayout />
}
```

## Advanced Tracking

### Track User Journey

```typescript
import { analytics } from "@/lib/analytics"

// When user uploads CSV
analytics.csvUploaded(fileSize, dealCount)

// When analysis starts
analytics.analysisStarted(analysisId)

// When analysis completes
analytics.analysisCompleted(analysisId, issueCount, healthScore)

// When user views AI insights
analytics.aiReviewStarted(analysisId)

// When AI analysis completes
analytics.aiReviewCompleted(analysisId, riskScore, dealCount)

// When user clicks upgrade
analytics.upgradeClicked("ai-insights-cta", "pro")

// When payment completes
analytics.paymentCompleted("pro", 59)
```

### Track Funnel Drop-offs

```typescript
// Track each step in a multi-step flow
trackEvent("onboarding_step_completed", { step: 1, stepName: "account_setup" })
trackEvent("onboarding_step_completed", { step: 2, stepName: "crm_connection" })
trackEvent("onboarding_step_completed", { step: 3, stepName: "first_scan" })
```

### Track Errors

```typescript
try {
  await uploadCSV(file)
} catch (error) {
  trackEvent("csv_upload_failed", {
    errorMessage: error.message,
    fileSize: file.size,
    fileName: file.name,
  })
}
```

## A/B Testing Example

```typescript
import { usePostHog } from "@/hooks/usePostHog"

function UpgradeButton() {
  const { getFeatureFlag } = usePostHog()

  const buttonVariant = getFeatureFlag("upgrade-button-variant") // "default" | "urgent"

  if (buttonVariant === "urgent") {
    return (
      <Button variant="destructive">
        ⚡ Upgrade Now - 50% Off
      </Button>
    )
  }

  return <Button>Upgrade to Pro</Button>
}
```

## PostHog Dashboard Setup

### Create Activation Funnel

In PostHog → Insights → New Funnel:

1. **Sign Up** - Filter by `$pageview` where `pathname` = `/sign-up`
2. **First Upload** - Filter by `csv_uploaded` OR `crm_connected`
3. **Analysis Complete** - Filter by `analysis_completed`
4. **Upgrade Click** - Filter by `upgrade_clicked`
5. **Payment Complete** - Filter by `payment_completed`

### Create Retention Cohort

In PostHog → Insights → Retention:

- **Target event:** `analysis_completed`
- **Returning event:** `analysis_completed`
- **Time period:** Daily / Weekly
- **Cohort:** Group by `Sign up date`

### Track Feature Usage

In PostHog → Insights → Trends:

- **Events:** `ai_insights_viewed`, `deal_reviewed`, `export_downloaded`
- **Breakdown by:** `plan` (free vs pro)
- **Visualization:** Bar chart

## Common Patterns

### Track Modal Opens

```typescript
function UpgradeModal() {
  useEffect(() => {
    trackEvent("upgrade_modal_viewed", {
      source: "ai-insights-paywall",
      timestamp: Date.now(),
    })
  }, [])
}
```

### Track Successful Actions

```typescript
const handleSave = async () => {
  try {
    await saveChanges()
    trackEvent("deal_updated", { dealId, fieldsChanged: changedFields })
    toast.success("Saved!")
  } catch (error) {
    trackEvent("deal_update_failed", { dealId, error: error.message })
  }
}
```

### Track Search Queries

```typescript
const handleSearch = (query: string) => {
  trackEvent("search_performed", {
    query,
    resultCount: results.length,
    hasResults: results.length > 0,
  })
}
```

## Real-World Example: Full Component

```typescript
import { analytics } from "@/lib/analytics"
import { useTrackComponentMount } from "@/hooks/usePostHog"

export function DealDetailPage({ dealId }: Props) {
  // Track page view
  useTrackComponentMount("deal_detail_page", { dealId })

  const handleExport = () => {
    analytics.exportDownloaded(analysisId, "csv")
    // ... export logic
  }

  const handleAIInsights = () => {
    analytics.aiReviewStarted(analysisId)
    // ... AI logic
  }

  const handleUpgrade = () => {
    analytics.upgradeClicked("deal-detail-ai-cta", "pro")
    router.push("/pricing")
  }

  return (
    <div>
      <Button onClick={handleExport}>Export</Button>
      <Button onClick={handleAIInsights}>AI Insights</Button>
      <Button onClick={handleUpgrade}>Upgrade</Button>
    </div>
  )
}
```

## Tips

1. **Be specific:** Instead of `button_clicked`, use `upgrade_button_clicked_from_pricing_page`
2. **Add context:** Include relevant IDs, counts, and metadata
3. **Track failures:** Errors are just as important as successes
4. **Consistent naming:** Use snake_case for events, camelCase for properties
5. **Don't over-track:** Focus on events that drive business decisions

## Testing Your Events

### In Development

```bash
# All events log to console
npm run dev

# Click around your app
# Check console for: 📊 Event: event_name { properties }
```

### In PostHog

1. Go to PostHog → Live Events
2. Trigger an event in your app
3. Event should appear within 5 seconds
4. Click event to see all properties

## Debugging

### Event not showing up?

```typescript
// In browser console
import posthog from "posthog-js"

// Check if loaded
console.log(posthog.__loaded) // should be true

// Manual test
posthog.capture("test_event", { test: true })
```

### Check environment variables

```bash
# In terminal
echo $NEXT_PUBLIC_POSTHOG_KEY
echo $NEXT_PUBLIC_POSTHOG_HOST
```
