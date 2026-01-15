"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertCircle,
  CheckCircle,
  Zap,
  ArrowRight,
  Sparkles,
  Activity,
  Clock,
  DollarSign,
  Users,
  Award,
  XCircle
} from "lucide-react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { trackEvent } from "@/lib/analytics"

interface WinPattern {
  pattern_type: string
  description: string
  frequency: number
  example: string
  impact_score: number
}

interface LossPattern {
  pattern_type: string
  description: string
  frequency: number
  example: string
  impact_score: number
}

interface WinLossMetrics {
  total_closed_deals: number
  won_deals: number
  lost_deals: number
  win_rate: number
  avg_sales_cycle_won: number
  avg_sales_cycle_lost: number
  avg_deal_size_won: number
  avg_deal_size_lost: number
  median_time_to_close_won: number
  median_time_to_close_lost: number
}

interface WinLossInsight {
  title: string
  description: string
  confidence: number
  actionable_recommendation: string
}

interface PatternAnalysis {
  analysis_id: string
  metrics: WinLossMetrics
  win_patterns: WinPattern[]
  loss_patterns: LossPattern[]
  insights: WinLossInsight[]
  top_win_factors: string[]
  top_loss_factors: string[]
  generated_at: string
  status: string
}

export default function WinLossPatternsPage() {
  const params = useParams()
  const router = useRouter()
  const authenticatedFetch = useAuthenticatedFetch()
  const analysisId = params.id as string

  const [patternAnalysis, setPatternAnalysis] = useState<PatternAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPatternAnalysis()
  }, [analysisId])

  const fetchPatternAnalysis = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/patterns/analysis/${analysisId}`
      )

      if (!response.ok) {
        if (response.status === 404) {
          // Pattern analysis not found - needs to be run
          setError(null)
          setPatternAnalysis(null)
        } else if (response.status === 403) {
          throw new Error("Win/Loss patterns require Pro subscription")
        } else {
          throw new Error("Failed to load pattern analysis")
        }
      } else {
        const data = await response.json()
        setPatternAnalysis(data)
        setError(null)

        // Track pattern analysis view
        trackEvent("page_viewed", {
          page: "win_loss_patterns",
          analysisId,
          winRate: data.metrics?.win_rate || 0,
          totalClosed: data.metrics?.total_closed_deals || 0
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pattern analysis")
    } finally {
      setLoading(false)
    }
  }

  const runPatternAnalysis = async () => {
    try {
      setAnalyzing(true)
      setError(null)

      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/patterns/analyze/${analysisId}`,
        { method: "POST" }
      )

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Win/Loss patterns require Pro subscription")
        }
        throw new Error("Failed to run pattern analysis")
      }

      const data = await response.json()
      setPatternAnalysis(data)

      // Track analysis run
      trackEvent("page_viewed", {
        page: "pattern_analysis_completed",
        analysisId,
        winRate: data.metrics?.win_rate || 0
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run pattern analysis")
    } finally {
      setAnalyzing(false)
    }
  }

  const getPatternIcon = (type: string) => {
    switch (type) {
      case "engagement":
        return Activity
      case "timeline":
        return Clock
      case "stakeholder":
        return Users
      case "process":
        return Target
      default:
        return Sparkles
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="space-y-4">
          <div className="h-8 bg-slate-200 rounded animate-pulse w-64" />
          <div className="h-64 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  if (!patternAnalysis) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center space-y-4 py-12">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-50 rounded-full">
              <Target className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Win/Loss Pattern Detection</h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Analyze your closed deals to discover what separates wins from losses.
            Get AI-powered insights into engagement patterns, sales cycle lengths,
            and key success factors.
          </p>
          <Button
            onClick={runPatternAnalysis}
            disabled={analyzing}
            size="lg"
            className="mt-4"
          >
            {analyzing ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Patterns...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Win/Loss Patterns
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  const { metrics, win_patterns, loss_patterns, insights, top_win_factors, top_loss_factors } = patternAnalysis

  // Check if there's insufficient data
  const hasInsufficientData = metrics.total_closed_deals === 0

  if (hasInsufficientData) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {insights[0]?.description || "Need at least 3 won and 3 lost deals to identify meaningful patterns."}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <p className="text-sm text-slate-600">
            {insights[0]?.actionable_recommendation}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-blue-600" />
            Win/Loss Patterns
          </h1>
          <p className="text-slate-600 mt-2">
            AI-powered analysis of what drives wins and losses
          </p>
        </div>
        <Button
          onClick={runPatternAnalysis}
          disabled={analyzing}
          variant="outline"
        >
          {analyzing ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-spin" />
              Re-analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Refresh Analysis
            </>
          )}
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Win Rate</p>
              <p className="text-3xl font-bold text-green-600">
                {metrics.win_rate.toFixed(1)}%
              </p>
            </div>
            <Award className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {metrics.won_deals} wins / {metrics.total_closed_deals} closed
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Avg Sales Cycle</p>
              <p className="text-3xl font-bold">
                {metrics.avg_sales_cycle_won.toFixed(0)}d
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Wins: {metrics.avg_sales_cycle_won.toFixed(0)}d |
            Losses: {metrics.avg_sales_cycle_lost.toFixed(0)}d
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Avg Deal Size</p>
              <p className="text-3xl font-bold">
                ${(metrics.avg_deal_size_won / 1000).toFixed(0)}K
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Wins: ${(metrics.avg_deal_size_won / 1000).toFixed(0)}K |
            Losses: ${(metrics.avg_deal_size_lost / 1000).toFixed(0)}K
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Closed</p>
              <p className="text-3xl font-bold">
                {metrics.total_closed_deals}
              </p>
            </div>
            <Target className="h-8 w-8 text-slate-600" />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {metrics.won_deals} won, {metrics.lost_deals} lost
          </p>
        </Card>
      </div>

      {/* Key Insights */}
      {insights.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Key Insights
          </h2>
          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-lg">{insight.title}</h3>
                <p className="text-slate-600 mt-1">{insight.description}</p>
                <div className="mt-2 bg-blue-50 p-3 rounded">
                  <p className="text-sm font-medium text-blue-900">
                    <Zap className="h-4 w-4 inline mr-1" />
                    Action: {insight.actionable_recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Win & Loss Factors Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win Factors */}
        <Card className="p-6 border-green-200 bg-green-50/30">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700">
            <TrendingUp className="h-5 w-5" />
            Your Wins Have This in Common
          </h2>
          {top_win_factors.length > 0 ? (
            <ul className="space-y-3">
              {top_win_factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{factor}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">No win patterns detected yet.</p>
          )}
        </Card>

        {/* Loss Factors */}
        <Card className="p-6 border-red-200 bg-red-50/30">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-700">
            <TrendingDown className="h-5 w-5" />
            Your Losses Show This Pattern
          </h2>
          {top_loss_factors.length > 0 ? (
            <ul className="space-y-3">
              {top_loss_factors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{factor}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">No loss patterns detected yet.</p>
          )}
        </Card>
      </div>

      {/* Detailed Win Patterns */}
      {win_patterns.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            Detailed Win Patterns
          </h2>
          <div className="space-y-4">
            {win_patterns.map((pattern, idx) => {
              const Icon = getPatternIcon(pattern.pattern_type)
              return (
                <div key={idx} className="border rounded-lg p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className="h-5 w-5 text-green-600 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{pattern.description}</h3>
                          <Badge variant="outline" className="text-xs">
                            {pattern.pattern_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{pattern.example}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-slate-500">
                            Frequency: {pattern.frequency.toFixed(0)}%
                          </span>
                          <span className="text-xs text-slate-500">
                            Impact: {pattern.impact_score.toFixed(0)}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Detailed Loss Patterns */}
      {loss_patterns.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Detailed Loss Patterns
          </h2>
          <div className="space-y-4">
            {loss_patterns.map((pattern, idx) => {
              const Icon = getPatternIcon(pattern.pattern_type)
              return (
                <div key={idx} className="border rounded-lg p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className="h-5 w-5 text-red-600 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{pattern.description}</h3>
                          <Badge variant="outline" className="text-xs">
                            {pattern.pattern_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{pattern.example}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-slate-500">
                            Frequency: {pattern.frequency.toFixed(0)}%
                          </span>
                          <span className="text-xs text-slate-500">
                            Impact: {pattern.impact_score.toFixed(0)}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
