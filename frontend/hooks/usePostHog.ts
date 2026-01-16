/**
 * React hook for accessing PostHog in components
 * Provides type-safe analytics tracking
 */

import { useEffect } from "react"
import posthog from "posthog-js"

export function usePostHog() {
  // Check if PostHog is loaded
  const isLoaded = typeof window !== "undefined" && posthog.__loaded

  return {
    posthog: isLoaded ? posthog : null,
    isLoaded,

    // Convenience methods
    capture: (event: string, properties?: Record<string, any>) => {
      if (isLoaded) {
        posthog.capture(event, properties)
      }
    },

    identify: (userId: string, properties?: Record<string, any>) => {
      if (isLoaded) {
        posthog.identify(userId, properties)
      }
    },

    setPersonProperties: (properties: Record<string, any>) => {
      if (isLoaded) {
        posthog.setPersonProperties(properties)
      }
    },

    getFeatureFlag: (flag: string): boolean | string | undefined => {
      if (isLoaded) {
        return posthog.getFeatureFlag(flag)
      }
      return undefined
    },

    isFeatureEnabled: (flag: string): boolean => {
      if (isLoaded) {
        return posthog.isFeatureEnabled(flag)
      }
      return false
    },
  }
}

/**
 * Hook to track component mount
 * Useful for tracking which components users interact with
 */
export function useTrackComponentMount(componentName: string, properties?: Record<string, any>) {
  const { capture, isLoaded } = usePostHog()

  useEffect(() => {
    if (isLoaded) {
      capture(`${componentName}_viewed`, properties)
    }
  }, [isLoaded, componentName])
}

/**
 * Hook to track time spent on component
 * Tracks how long a user views a specific component
 */
export function useTrackTimeSpent(componentName: string) {
  const { capture, isLoaded } = usePostHog()

  useEffect(() => {
    if (!isLoaded) return

    const startTime = Date.now()

    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000) // seconds
      capture(`${componentName}_time_spent`, { seconds: timeSpent })
    }
  }, [isLoaded, componentName, capture])
}
