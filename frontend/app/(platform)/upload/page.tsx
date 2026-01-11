"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Redirect /upload to /scan for backward compatibility
export default function UploadPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/scan")
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-500">Redirecting to scan page...</p>
    </div>
  )
}
