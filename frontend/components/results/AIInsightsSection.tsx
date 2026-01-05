"use client"

/**
 * AI Insights Section
 * - For paid users: Shows AI-powered insights with loading state
 * - For non-paid users: Shows blurred/frosted preview with upgrade CTA
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sparkles,
  Lock,
  TrendingUp,
  Target,
  AlertCircle,
  ArrowRight,
  Zap,
} from "lucide-react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"

interface AIInsightsSectionProps {
  analysisId: string
  hasAIAccess: boolean
  onViewAIResults?: () => void
}

interface AIAnalysis {
  status: string
  pipeline_summary?: {
    overall_health: string
    health_score: number
    key_insight: string
    top_3_risks: Array<{
      deal_name: string
      deal_value: number
      risk_score: number
      why_at_risk: string
      defense_talking_point: string
    }>
    recommended_focus: string
    forecast_impact: string
  }
  metrics?: {
    total_deals_analyzed: number
    average_risk_score: number
    high_risk_count: number
    medium_risk_count: number
    low_risk_count: number
    critical_actions_needed: number
  }
}

// Blurred placeholder content for non-paid users
function AIPreviewBlurred() {
  const router = useRouter()

  return (
    <div className="relative">
      {/* Blurred background content */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <div className="blur-sm opacity-50 p-6">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {/* Fake metrics cards */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="h-8 w-16 bg-purple-200 rounded mb-2" />
              <div className="h-4 w-24 bg-purple-100 rounded" />
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="h-8 w-16 bg-red-200 rounded mb-2" />
              <div className="h-4 w-24 bg-red-100 rounded" />
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="h-8 w-16 bg-green-200 rounded mb-2" />
              <div className="h-4 w-24 bg-green-100 rounded" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-20 bg-slate-100 rounded-lg" />
            <div className="h-20 bg-slate-100 rounded-lg" />
            <div className="h-20 bg-slate-100 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Frosted glass overlay with CTA */}
      <div className="relative backdrop-blur-md bg-white/70 rounded-lg border-2 border-dashed border-slate-300 p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Unlock AI-Powered Insights
        </h3>
        <p className="text-slate-600 max-w-md mb-6">
          Get predictive deal risk scoring, next best actions, and intelligent
          recommendations powered by RevSmart AI.
        </p>

        {/* Feature highlights */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span>Risk Scoring</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Target className="w-4 h-4 text-green-500" />
            <span>Next Best Action</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Zap className="w-4 h-4 text-orange-500" />
            <span>Pipeline Review Prep</span>
          </div>
        </div>

        <Button
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          onClick={() => router.push("/pricing")}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Upgrade to Pro
        </Button>
        <p className="text-xs text-slate-500 mt-2">
          Starting at $59/month with 30-day money-back guarantee
        </p>
      </div>
    </div>
  )
}

// Loading skeleton for AI insights
function AIInsightsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center animate-pulse">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <Skeleton className="h-6 w-48" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>

      <Skeleton className="h-32 rounded-lg" />

      <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        Running AI analysis... This may take up to 30 seconds.
      </div>
    </div>
  )
}

// Actual AI insights content for paid users
function AIInsightsContent({
  aiAnalysis,
  onViewDetails,
}: {
  aiAnalysis: AIAnalysis
  onViewDetails?: () => void
}) {
  const summary = aiAnalysis.pipeline_summary
  const metrics = aiAnalysis.metrics

  if (!summary || !metrics) {
    return (
      <div className="text-center py-8 text-slate-500">
        AI analysis data is incomplete. Please try running the analysis again.
      </div>
    )
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "text-green-600 bg-green-50"
      case "good":
        return "text-blue-600 bg-blue-50"
      case "concerning":
        return "text-orange-600 bg-orange-50"
      case "critical":
        return "text-red-600 bg-red-50"
      default:
        return "text-slate-600 bg-slate-50"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">AI Pipeline Insights</h3>
            <p className="text-sm text-slate-500">
              {metrics.total_deals_analyzed} deals analyzed
            </p>
          </div>
        </div>
        <Badge className={getHealthColor(summary.overall_health)}>
          {summary.overall_health.toUpperCase()}
        </Badge>
      </div>

      {/* Key metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Risk Score</span>
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {metrics.average_risk_score}/100
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-900">High Risk</span>
          </div>
          <div className="text-2xl font-bold text-red-700">
            {metrics.high_risk_count} deals
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Actions Needed</span>
          </div>
          <div className="text-2xl font-bold text-green-700">
            {metrics.critical_actions_needed}
          </div>
        </div>
      </div>

      {/* Key insight */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="text-sm font-medium text-slate-500 mb-1">Key Insight</div>
        <p className="text-slate-700">{summary.key_insight}</p>
      </div>

      {/* Top risks preview */}
      {summary.top_3_risks.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-500">Top Deals at Risk</div>
          <div className="space-y-2">
            {summary.top_3_risks.slice(0, 2).map((risk, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
              >
                <div>
                  <div className="font-medium text-slate-900">{risk.deal_name}</div>
                  <div className="text-sm text-slate-500">
                    ${(risk.deal_value || 0).toLocaleString()}
                  </div>
                </div>
                <Badge variant="outline" className="bg-red-100 text-red-700 border-0">
                  {risk.risk_score}/100 risk
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View full results button */}
      {onViewDetails && (
        <Button className="w-full" variant="outline" onClick={onViewDetails}>
          View Full AI Analysis
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  )
}

export function AIInsightsSection({
  analysisId,
  hasAIAccess,
  onViewAIResults,
}: AIInsightsSectionProps) {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const authenticatedFetch = useAuthenticatedFetch()
  const router = useRouter()

  // Auto-fetch AI results for paid users
  useEffect(() => {
    if (!hasAIAccess) return

    const fetchAIResults = async () => {
      setLoading(true)
      setError(null)

      try {
        // First check if results exist
        const checkResponse = await authenticatedFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ai/analysis/${analysisId}`
        )

        if (checkResponse.ok) {
          const data = await checkResponse.json()
          setAiAnalysis(data)
          setLoading(false)
          return
        }

        // If not, trigger AI analysis
        const triggerResponse = await authenticatedFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/ai/analyze/${analysisId}`,
          { method: "POST" }
        )

        if (!triggerResponse.ok) {
          throw new Error("Failed to start AI analysis")
        }

        // Poll for results
        const pollInterval = setInterval(async () => {
          try {
            const resultResponse = await authenticatedFetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/ai/analysis/${analysisId}`
            )

            if (resultResponse.ok) {
              const data = await resultResponse.json()
              if (data.status === "completed" || data.pipeline_summary) {
                setAiAnalysis(data)
                setLoading(false)
                clearInterval(pollInterval)
              }
            }
          } catch (err) {
            // Continue polling
          }
        }, 3000)

        // Stop polling after 60 seconds
        setTimeout(() => {
          clearInterval(pollInterval)
          if (loading) {
            setLoading(false)
            setError("AI analysis is taking longer than expected. Please refresh to check results.")
          }
        }, 60000)

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load AI insights")
        setLoading(false)
      }
    }

    fetchAIResults()
  }, [analysisId, hasAIAccess, authenticatedFetch])

  // For non-paid users, show blurred preview
  if (!hasAIAccess) {
    return (
      <Card className="p-6">
        <AIPreviewBlurred />
      </Card>
    )
  }

  // For paid users
  return (
    <Card className="p-6">
      {loading ? (
        <AIInsightsSkeleton />
      ) : error ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => {
              setError(null)
              setLoading(true)
              // Retry logic would go here
            }}
          >
            Retry
          </Button>
        </div>
      ) : aiAnalysis ? (
        <AIInsightsContent
          aiAnalysis={aiAnalysis}
          onViewDetails={() => router.push(`/results/${analysisId}/ai`)}
        />
      ) : (
        <AIInsightsSkeleton />
      )}
    </Card>
  )
}
