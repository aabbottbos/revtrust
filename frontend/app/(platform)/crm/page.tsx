"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Redirect /crm to /settings?tab=crm
export default function CRMConnectionsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/settings?tab=crm")
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-500">Redirecting to settings...</p>
    </div>
  )
}
