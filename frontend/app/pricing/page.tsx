"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2 } from "lucide-react"
import Link from "next/link"
import { analytics } from "@/lib/analytics"

export default function PricingPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    if (!userId) {
      router.push("/sign-in?redirect=/pricing")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Track upgrade click
      analytics.upgradeClicked("pricing_page", "pro")

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stripe/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "Failed to create checkout session")
      }

      const data = await response.json()

      // Redirect to Stripe Checkout
      window.location.href = data.url

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-slate-600">
            Choose the plan that's right for you
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free */}
          <Card className="p-8">
            <Badge className="mb-4 bg-slate-200 text-slate-700">FREE</Badge>
            <h3 className="text-2xl font-bold mb-2">Pipeline Health Check</h3>
            <div className="text-4xl font-bold mb-6">
              $0<span className="text-lg text-slate-600">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                Unlimited CSV uploads
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                14 business rules
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                Export to CSV
              </li>
            </ul>
            <Link href="/sign-up">
              <Button className="w-full" variant="outline">
                Get Started
              </Button>
            </Link>
          </Card>

          {/* Pro */}
          <Card className="p-8 border-2 border-revtrust-blue relative">
            <div className="absolute -top-3 right-4">
              <Badge className="bg-revtrust-blue text-white">MOST POPULAR</Badge>
            </div>
            <Badge className="mb-4 bg-revtrust-blue text-white">PRO</Badge>
            <h3 className="text-2xl font-bold mb-2">AI Deal Coach</h3>
            <div className="text-4xl font-bold mb-6">
              $59<span className="text-lg text-slate-600">/mo</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Check className="w-5 h-5 text-revtrust-blue mr-2" />
                Everything in Free
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-revtrust-blue mr-2" />
                AI Risk Scoring
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-revtrust-blue mr-2" />
                Next Best Action
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-revtrust-blue mr-2" />
                AI Pipeline Review
              </li>
            </ul>
            <Button
              className="w-full bg-revtrust-blue"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Start Pro Trial"
              )}
            </Button>
            <p className="text-xs text-center mt-3 text-slate-600">
              30-day money-back guarantee
            </p>
          </Card>

          {/* Enterprise */}
          <Card className="p-8">
            <Badge className="mb-4 bg-slate-200 text-slate-700">ENTERPRISE</Badge>
            <h3 className="text-2xl font-bold mb-2">Team & Enterprise</h3>
            <div className="text-4xl font-bold mb-6">Custom</div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                Everything in Pro
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                Unlimited users
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                CRM Integration
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                Dedicated support
              </li>
            </ul>
            <Button className="w-full" variant="outline">
              Contact Sales
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
