"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@clerk/nextjs"

/**
 * Client component that checks if user needs onboarding
 * Redirects to /onboarding if:
 * - User is authenticated
 * - User hasn't completed onboarding
 * - Not already on the onboarding page
 */
export function OnboardingCheck() {
  const router = useRouter()
  const pathname = usePathname()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Only check if auth is loaded and user is signed in
    if (!isLoaded || !isSignedIn) {
      return
    }

    // Don't redirect if already on onboarding page, dashboard, or settings (to avoid redirect loops)
    if (pathname === "/onboarding" || pathname === "/dashboard" || pathname === "/settings") {
      setChecked(true)
      return
    }

    // Check if onboarding was just completed (session storage flag)
    if (typeof window !== 'undefined' && sessionStorage.getItem('onboarding_just_completed') === 'true') {
      setChecked(true)
      return
    }

    // Add a small delay to avoid race conditions with onboarding completion
    const timeoutId = setTimeout(async () => {
      try {
        const token = await getToken()
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

        const response = await fetch(`${apiUrl}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const profile = await response.json()

          // Redirect to onboarding if not completed
          if (!profile.onboardingCompleted) {
            router.push("/onboarding")
          }
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error)
      } finally {
        setChecked(true)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [isLoaded, isSignedIn, pathname, getToken, router])

  // Don't render anything
  return null
}
