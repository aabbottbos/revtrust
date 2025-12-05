"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

function ErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    const errorMessage = searchParams.get("message")
    setMessage(errorMessage || "An unknown error occurred")
  }, [searchParams])

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Connection Failed</h1>
        <p className="text-slate-600 mb-6">{message}</p>
        <Button onClick={() => router.push("/crm")}>
          Back to CRM Connections
        </Button>
      </Card>
    </div>
  )
}

export default function CRMErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
