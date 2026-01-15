"use client"

/**
 * Win/Loss Patterns Section
 * - For paid users: Shows win/loss pattern insights
 * - For non-paid users: Shows blurred/frosted preview with upgrade CTA
 */

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Target,
  Lock,
  TrendingUp,
  TrendingDown,
  Award,
  ArrowRight,
  DollarSign,
  Clock,
} from "lucide-react"

interface WinLossPatternsSectionProps {
  analysisId: string
  hasAIAccess: boolean
}

// Blurred placeholder content for non-paid users
function PatternsPreviewBlurred() {
  const router = useRouter()

  return (
    <div className="relative">
      {/* Blurred background content */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <div className="blur-sm opacity-50 p-6">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Fake win/loss cards */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="h-6 w-32 bg-green-200 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-green-100 rounded" />
                <div className="h-4 w-5/6 bg-green-100 rounded" />
                <div className="h-4 w-4/5 bg-green-100 rounded" />
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="h-6 w-32 bg-red-200 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-red-100 rounded" />
                <div className="h-4 w-5/6 bg-red-100 rounded" />
                <div className="h-4 w-4/5 bg-red-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Frosted glass overlay with CTA */}
      <div className="relative backdrop-blur-md bg-white/70 rounded-lg border-2 border-dashed border-slate-300 p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Unlock Win/Loss Pattern Detection
        </h3>
        <p className="text-slate-600 max-w-md mb-6">
          Discover what separates your wins from losses. Get AI-powered insights
          into engagement patterns, sales cycle optimization, and key success factors.
        </p>

        {/* Feature highlights */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Award className="w-4 h-4 text-green-500" />
            <span>Win Patterns</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span>Loss Factors</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Target className="w-4 h-4 text-blue-500" />
            <span>Actionable Insights</span>
          </div>
        </div>

        <Button
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
          onClick={() => router.push("/pricing")}
        >
          <Target className="w-4 h-4 mr-2" />
          Upgrade to Pro
        </Button>
        <p className="text-xs text-slate-500 mt-2">
          Starting at $59/month with 30-day money-back guarantee
        </p>
      </div>
    </div>
  )
}

// Preview content for paid users
function PatternsPreviewContent({ analysisId }: { analysisId: string }) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Win/Loss Patterns</h3>
            <p className="text-sm text-slate-500">
              Understand what drives your wins and losses
            </p>
          </div>
        </div>
      </div>

      {/* Preview metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-green-700">
            Track your success
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Sales Cycle</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            Optimize timing
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Deal Size</span>
          </div>
          <div className="text-2xl font-bold text-purple-700">
            Maximize value
          </div>
        </div>
      </div>

      {/* Feature preview */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="text-sm font-medium text-slate-500 mb-3">
          What You'll Discover
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span>Patterns in winning deals</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Optimal sales cycle length</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span>Common loss factors</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Target className="w-4 h-4 text-purple-600" />
              <span>Actionable recommendations</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        className="w-full"
        variant="outline"
        onClick={() => router.push(`/results/${analysisId}/patterns`)}
      >
        Analyze Win/Loss Patterns
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )
}

export function WinLossPatternsSection({
  analysisId,
  hasAIAccess,
}: WinLossPatternsSectionProps) {
  // For non-paid users, show blurred preview
  if (!hasAIAccess) {
    return (
      <Card className="p-6">
        <PatternsPreviewBlurred />
      </Card>
    )
  }

  // For paid users, show preview with CTA to full analysis
  return (
    <Card className="p-6">
      <PatternsPreviewContent analysisId={analysisId} />
    </Card>
  )
}
