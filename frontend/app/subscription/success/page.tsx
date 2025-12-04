"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Sparkles } from "lucide-react"

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

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

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="flex-1 bg-revtrust-blue"
            onClick={() => router.push("/upload")}
          >
            Upload Pipeline
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
