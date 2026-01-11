"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Sparkles, Gift, Copy, Check } from "lucide-react"

function SubscriptionSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userId } = useAuth()
  const sessionId = searchParams.get("session_id")
  const [copied, setCopied] = useState(false)

  const referralLink = `${window.location.origin}?ref=${userId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-lg p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold mb-4 text-slate-900">
          Welcome to RevTrust Pro!
        </h1>

        <p className="text-lg text-slate-600 mb-6">
          Your subscription is now active. You have full access to AI-powered
          pipeline insights.
        </p>

        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-revtrust-blue" />
            <span className="font-semibold text-revtrust-blue">
              AI Features Unlocked
            </span>
          </div>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>✓ AI Risk Scoring</li>
            <li>✓ Next Best Action Recommendations</li>
            <li>✓ Pipeline Review Preparation</li>
          </ul>
        </div>

        {/* Referral Program */}
        <Card className="p-6 mt-6 border-2 border-green-200 bg-green-50">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-green-900">Get 1 Month Free!</h3>
          </div>
          <p className="text-sm text-green-800 mb-4">
            Refer a friend who upgrades to Pro, and you both get 1 month free!
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-3 py-2 border border-green-300 rounded text-sm bg-white"
              onClick={(e) => e.currentTarget.select()}
            />
            <Button
              size="sm"
              onClick={handleCopyLink}
              className="bg-green-600 hover:bg-green-700"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            className="flex-1 bg-revtrust-blue"
            onClick={() => router.push("/dashboard")}
          >
            Go to Dashboard
          </Button>
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => router.push("/subscription")}
          >
            Manage Subscription
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-revtrust-blue mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  )
}
