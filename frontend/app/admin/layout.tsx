"use client"

import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AlertTriangle, Shield, Loader2 } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAdminAccess() {
      if (!isLoaded) return

      if (!isSignedIn) {
        router.push("/sign-in?redirect_url=/admin")
        return
      }

      try {
        const token = await getToken()
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/verify`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (response.status === 401) {
          router.push("/sign-in?redirect_url=/admin")
          return
        }

        const data = await response.json()
        setIsAdmin(data.isAdmin)

        if (!data.isAdmin) {
          setError(data.reason || "access_denied")
        }
      } catch (err) {
        console.error("Failed to verify admin access:", err)
        setError("verification_failed")
      }
    }

    checkAdminAccess()
  }, [isLoaded, isSignedIn, getToken, router])

  // Loading state
  if (!isLoaded || isAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-red-500/30 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            You don't have permission to access the admin area.
            {error === "user_not_found" && " Your account was not found."}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Admin access granted - show admin header and content
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Admin header bar */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              <span className="text-amber-500 font-medium text-sm">Admin Mode</span>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Exit Admin
            </button>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
