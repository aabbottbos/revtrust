"use client"

import { Suspense, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import posthog from "posthog-js"

function PostHogTracking() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()

  useEffect(() => {
    // Initialize PostHog
    if (typeof window !== "undefined") {
      const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
      const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"

      if (!apiKey) {
        console.warn("PostHog API key not found. Analytics will not be tracked.")
        return
      }

      posthog.init(apiKey, {
        api_host: host,
        person_profiles: "identified_only", // Only create profiles for identified users
        capture_pageview: false, // We'll handle pageviews manually
        capture_pageleave: true,
        autocapture: {
          dom_event_allowlist: ["click"], // Only autocapture clicks
          url_allowlist: [window.location.origin], // Only track your domain
          element_allowlist: ["button", "a"], // Only capture button and link clicks
        },
        session_recording: {
          maskAllInputs: true, // Mask all input fields for privacy
          maskTextSelector: '[data-ph-mask]', // Allow custom masking
        },
        loaded: (posthog) => {
          if (process.env.NODE_ENV === "development") {
            posthog.debug() // Enable debug mode in development
          }
        },
      })
    }
  }, [])

  // Track page views
  useEffect(() => {
    if (pathname && posthog.__loaded) {
      let url = window.origin + pathname
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture("$pageview", {
        $current_url: url,
      })
    }
  }, [pathname, searchParams])

  // Identify user when they log in
  useEffect(() => {
    if (isLoaded && user && posthog.__loaded) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        // Add subscription/plan info if available
        // plan: user.publicMetadata?.plan,
        // isAdmin: user.publicMetadata?.isAdmin,
      })
    } else if (isLoaded && !user && posthog.__loaded) {
      // Reset on logout
      posthog.reset()
    }
  }, [isLoaded, user])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PostHogTracking />
      </Suspense>
      {children}
    </>
  )
}
