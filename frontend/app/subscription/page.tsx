"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, Calendar } from "lucide-react"

export default function SubscriptionPage() {
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchSubscription()
    }
  }, [userId])

  const fetchSubscription = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stripe/subscription-status`
      )

      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      }
    } catch (err) {
      console.error("Error fetching subscription:", err)
    } finally {
      setLoading(false)
    }
  }

  const openPortal = async () => {
    try {
      setPortalLoading(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stripe/create-portal-session`,
        {
          method: "POST"
        }
      )

      if (response.ok) {
        const data = await response.json()
        window.location.href = data.url
      }
    } catch (err) {
      console.error("Error opening portal:", err)
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-revtrust-blue" />
      </div>
    )
  }

  const isPro = subscription?.tier === "pro" && subscription?.status === "active"

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Subscription</h1>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Current Plan</h2>
              <p className="text-slate-600">
                {subscription?.tier === "pro" ? "RevTrust Pro" : "Free Plan"}
              </p>
            </div>
            <Badge
              className={isPro ? "bg-revtrust-blue text-white" : "bg-slate-200 text-slate-700"}
            >
              {subscription?.tier?.toUpperCase() || "FREE"}
            </Badge>
          </div>

          {isPro && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Status</span>
                </div>
                <div className="font-semibold text-slate-900">
                  {subscription.status === "active" ? "Active" : subscription.status}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Billing</span>
                </div>
                <div className="font-semibold text-slate-900">
                  $59/month
                </div>
              </div>
            </div>
          )}

          {isPro ? (
            <Button
              onClick={openPortal}
              disabled={portalLoading}
              className="w-full"
            >
              {portalLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Manage Subscription"
              )}
            </Button>
          ) : (
            <Button
              onClick={() => window.location.href = "/pricing"}
              className="w-full bg-revtrust-blue"
            >
              Upgrade to Pro
            </Button>
          )}
        </Card>

        {isPro && (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-bold mb-2">Pro Features Included</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>✓ AI Risk Scoring for all deals</li>
              <li>✓ Next Best Action recommendations</li>
              <li>✓ Pipeline review preparation</li>
              <li>✓ Unlimited AI analyses</li>
              <li>✓ Priority support</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}
