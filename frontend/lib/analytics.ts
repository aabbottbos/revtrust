/**
 * Analytics tracking with PostHog
 * Tracks events, user properties, and sends to backend for storage
 */

import posthog from "posthog-js"

type EventName =
  | "csv_uploaded"
  | "analysis_completed"
  | "analysis_started"
  | "ai_review_started"
  | "ai_review_completed"
  | "upgrade_clicked"
  | "payment_completed"
  | "export_downloaded"
  | "feedback_submitted"
  | "page_viewed"
  | "analysis_saved"
  | "crm_connected"
  | "deal_reviewed"
  | "rule_modified"
  | "win_loss_viewed"
  | "feature_flag_enabled"

interface EventProperties {
  [key: string]: string | number | boolean | undefined | null
}

export function trackEvent(
  event: EventName,
  properties?: EventProperties
) {
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("📊 Event:", event, properties)
  }

  // Send to PostHog
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture(event, properties)
  }

  // Send to backend for logging (optional - for data warehouse)
  if (typeof window !== "undefined") {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        event,
        properties: properties || {},
        timestamp: new Date().toISOString(),
        page: window.location.pathname
      })
    }).catch(err => {
      // Silently fail - don't block user experience
      if (process.env.NODE_ENV === "development") {
        console.error("Analytics error:", err)
      }
    })
  }
}

// Set user properties (separate from identification)
export function setUserProperties(properties: Record<string, any>) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.setPersonProperties(properties)
  }
}

// Track feature flag usage
export function trackFeatureFlag(flagName: string, enabled: boolean) {
  trackEvent("feature_flag_enabled", { flagName, enabled })
}

// Convenience functions for common events
export const analytics = {
  csvUploaded: (fileSize: number, dealCount: number) =>
    trackEvent("csv_uploaded", { fileSize, dealCount }),

  analysisStarted: (analysisId: string) =>
    trackEvent("analysis_started", { analysisId }),

  analysisCompleted: (analysisId: string, issueCount: number, healthScore: number) =>
    trackEvent("analysis_completed", { analysisId, issueCount, healthScore }),

  aiReviewStarted: (analysisId: string) =>
    trackEvent("ai_review_started", { analysisId }),

  aiReviewCompleted: (analysisId: string, riskScore: number, dealCount: number) =>
    trackEvent("ai_review_completed", { analysisId, riskScore, dealCount }),

  upgradeClicked: (source: string, plan?: string) =>
    trackEvent("upgrade_clicked", { source, plan }),

  paymentCompleted: (plan: string, amount: number) =>
    trackEvent("payment_completed", { plan, amount }),

  exportDownloaded: (analysisId: string, format: string) =>
    trackEvent("export_downloaded", { analysisId, format }),

  feedbackSubmitted: (sentiment: string | null) =>
    trackEvent("feedback_submitted", { sentiment: sentiment || "neutral" }),

  pageViewed: (page: string) =>
    trackEvent("page_viewed", { page }),

  analysisSaved: (analysisId: string) =>
    trackEvent("analysis_saved", { analysisId }),

  crmConnected: (provider: string, dealCount: number) =>
    trackEvent("crm_connected", { provider, dealCount }),

  dealReviewed: (dealId: string, issueCount: number, action: string) =>
    trackEvent("deal_reviewed", { dealId, issueCount, action }),

  ruleModified: (ruleId: string, action: string) =>
    trackEvent("rule_modified", { ruleId, action }),

  winLossViewed: (analysisId: string) =>
    trackEvent("win_loss_viewed", { analysisId }),
}
