"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

function ConnectedContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [provider, setProvider] = useState<string>("")
  const [returnPath, setReturnPath] = useState<string>("/crm")

  useEffect(() => {
    const providerName = searchParams.get("provider")
    setProvider(providerName || "CRM")

    // Check for stored return path
    const storedReturnTo = sessionStorage.getItem("oauth_return_to")
    if (storedReturnTo) {
      setReturnPath(storedReturnTo)
      // Clean up
      sessionStorage.removeItem("oauth_return_to")

      // If returning to schedule/new, set a flag so it knows to show success message
      if (storedReturnTo === "/schedule/new") {
        sessionStorage.setItem("just_connected_crm", "true")
      }
    }
  }, [searchParams])

  const getProviderName = () => {
    if (provider === "salesforce") return "Salesforce"
    if (provider === "hubspot") return "HubSpot"
    return "CRM"
  }

  const getButtonText = () => {
    if (returnPath === "/schedule/new") {
      return "Continue Creating Schedule"
    }
    return "Back to CRM Connections"
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Successfully Connected!</h1>
        <p className="text-slate-600 mb-6">
          Your {getProviderName()} account has been connected successfully.
        </p>
        <Button onClick={() => router.push(returnPath)}>
          {getButtonText()}
        </Button>
      </Card>
    </div>
  )
}

export default function CRMConnectedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConnectedContent />
    </Suspense>
  )
}
