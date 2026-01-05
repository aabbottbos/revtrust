/**
 * Hook for user subscription status
 * Provides feature access flags based on subscription tier
 */

import { useState, useEffect, useCallback } from "react"
import { useAuthenticatedFetch } from "./useAuthenticatedFetch"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface SubscriptionStatus {
  tier: "free" | "pro" | "team" | "enterprise"
  status: "active" | "cancelled" | "expired"
  hasAIAccess: boolean
  hasCRMWrite: boolean
  hasTeamFeatures: boolean
  hasScheduledReviews: boolean
  hasActiveSubscription: boolean
  stripeCustomerId?: string
}

const DEFAULT_STATUS: SubscriptionStatus = {
  tier: "free",
  status: "active",
  hasAIAccess: false,
  hasCRMWrite: false,
  hasTeamFeatures: false,
  hasScheduledReviews: false,
  hasActiveSubscription: false,
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionStatus>(DEFAULT_STATUS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const authenticatedFetch = useAuthenticatedFetch()

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await authenticatedFetch(`${API_URL}/api/user/subscription`)

      if (!response.ok) {
        throw new Error("Failed to fetch subscription status")
      }

      const data = await response.json()
      setSubscription(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch subscription")
      // Keep default (free) status on error
      setSubscription(DEFAULT_STATUS)
    } finally {
      setLoading(false)
    }
  }, [authenticatedFetch])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
    // Convenience accessors
    isPaid: subscription.hasActiveSubscription,
    hasAIAccess: subscription.hasAIAccess,
    tier: subscription.tier,
  }
}
