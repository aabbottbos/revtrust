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

  useEffect(() => {
    const providerName = searchParams.get("provider")
    setProvider(providerName || "CRM")
  }, [searchParams])

  const getProviderName = () => {
    if (provider === "salesforce") return "Salesforce"
    if (provider === "hubspot") return "HubSpot"
    return "CRM"
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
        <Button onClick={() => router.push("/crm")}>
          Back to CRM Connections
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
