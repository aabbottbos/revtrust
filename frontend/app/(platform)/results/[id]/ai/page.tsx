"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle,
  Zap,
  ArrowRight,
  Download,
  Sparkles,
  TrendingDown,
  Activity,
  Users,
  Calendar
} from "lucide-react"
import { LinkedInShareButton } from "@/components/LinkedInShareButton"
import { analytics } from "@/lib/analytics"

interface DealAIResult {
  deal_id: string
  deal_name: string
  deal_amount: number
  risk_score: number
  risk_level: string
  risk_factors: string[]
  next_best_action: string
  action_priority: string
  action_rationale: string
  executive_summary: string
  confidence: number
}

interface PipelineSummary {
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

interface AIAnalysis {
  analysis_id: string
  status: string
  pipeline_summary: PipelineSummary
  metrics: {
    total_deals_analyzed: number
    average_risk_score: number
    high_risk_count: number
    medium_risk_count: number
    low_risk_count: number
    critical_actions_needed: number
  }
  results: DealAIResult[]
}

export default function AIResultsPage() {
  const params = useParams()
  const router = useRouter()
  const analysisId = params.id as string

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAIResults()
  }, [analysisId])

  const fetchAIResults = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/analysis/${analysisId}`
      )

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("AI analysis not found. Please run AI review first.")
        }
        throw new Error("Failed to load AI analysis")
      }

      const data = await response.json()
      setAiAnalysis(data)

      // Track AI review completion
      analytics.aiReviewCompleted(
        analysisId,
        data.metrics?.average_risk_score || 0,
        data.metrics?.total_deals_analyzed || 0
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load AI results")
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "low":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-slate-600 bg-slate-50 border-slate-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-blue-500"
      default:
        return "bg-slate-500"
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "text-green-600"
      case "good":
        return "text-blue-600"
      case "concerning":
        return "text-orange-600"
      case "critical":
        return "text-red-600"
      default:
        return "text-slate-600"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-revtrust-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading AI insights...</p>
        </div>
      </div>
    )
  }

  if (error || !aiAnalysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-lg p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "AI analysis not found"}</AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
            <Button onClick={() => router.push(`/results/${analysisId}`)}>
              View Business Rules
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const summary = aiAnalysis.pipeline_summary
  const metrics = aiAnalysis.metrics

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  AI Pipeline Insights
                </h1>
                <p className="text-slate-600">
                  Powered by RevSmart AI • {metrics.total_deals_analyzed} deals analyzed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LinkedInShareButton
                dealCount={metrics.total_deals_analyzed}
                riskScore={metrics.average_risk_score}
                highRiskCount={metrics.high_risk_count}
              />
              <Button
                variant="outline"
                onClick={() => router.push(`/results/${analysisId}`)}
              >
                View Business Rules
              </Button>
            </div>
          </div>
        </div>

        {/* Pipeline Health Overview */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-slate-900">Pipeline Health</h2>
                <Badge className={`text-lg px-3 py-1 ${getHealthColor(summary.overall_health)}`}>
                  {summary.overall_health.toUpperCase()}
                </Badge>
              </div>
              <p className="text-slate-600">{summary.key_insight}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-revtrust-blue mb-1">
                {summary.health_score}
              </div>
              <div className="text-sm text-slate-600">Health Score</div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-slate-400" />
                <span className="text-2xl font-bold text-slate-900">
                  {metrics.total_deals_analyzed}
                </span>
              </div>
              <div className="text-xs text-slate-600">Total Deals</div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span className="text-2xl font-bold text-red-600">
                  {metrics.high_risk_count}
                </span>
              </div>
              <div className="text-xs text-red-700">High Risk</div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">
                  {metrics.medium_risk_count}
                </span>
              </div>
              <div className="text-xs text-orange-700">Medium Risk</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {metrics.low_risk_count}
                </span>
              </div>
              <div className="text-xs text-green-700">Low Risk</div>
            </div>
          </div>
        </Card>

        {/* Three-Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Column 1: Supercharge Your Forecast */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Supercharge Your Forecast
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Average Risk Score</span>
                  <span className="text-lg font-bold text-slate-900">
                    {metrics.average_risk_score}/100
                  </span>
                </div>
                <Progress
                  value={metrics.average_risk_score}
                  className="h-2"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-900">Risk Distribution</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">High Risk</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(metrics.high_risk_count / metrics.total_deals_analyzed) * 100}
                        className="h-2 w-20"
                      />
                      <span className="text-sm font-semibold text-red-600">
                        {Math.round((metrics.high_risk_count / metrics.total_deals_analyzed) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Medium Risk</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(metrics.medium_risk_count / metrics.total_deals_analyzed) * 100}
                        className="h-2 w-20"
                      />
                      <span className="text-sm font-semibold text-orange-600">
                        {Math.round((metrics.medium_risk_count / metrics.total_deals_analyzed) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Low Risk</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(metrics.low_risk_count / metrics.total_deals_analyzed) * 100}
                        className="h-2 w-20"
                      />
                      <span className="text-sm font-semibold text-green-600">
                        {Math.round((metrics.low_risk_count / metrics.total_deals_analyzed) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-xs font-semibold text-purple-900 mb-1">
                  Forecast Impact
                </div>
                <div className="text-sm text-purple-800">
                  {summary.forecast_impact}
                </div>
              </div>
            </div>
          </Card>

          {/* Column 2: Nail Your Next Step */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Nail Your Next Step
              </h3>
            </div>

            <div className="space-y-3">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-green-600" />
                  <div className="text-xs font-semibold text-green-900">
                    Critical Actions Needed
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-900">
                  {metrics.critical_actions_needed}
                </div>
                <div className="text-xs text-green-700 mt-1">
                  Require immediate attention
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-semibold text-slate-900 mb-3">
                  Recommended Focus
                </div>
                <div className="text-sm text-slate-600 leading-relaxed">
                  {summary.recommended_focus}
                </div>
              </div>

              <Button
                className="w-full mt-4"
                onClick={() => {
                  // Scroll to actions section
                  document.getElementById('action-plan')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                View All Actions
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>

          {/* Column 3: Ace Your Pipeline Review */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Ace Your Pipeline Review
              </h3>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-slate-600 mb-3">
                Top {summary.top_3_risks.length} deals your VP will ask about:
              </div>

              {summary.top_3_risks.map((risk, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 border border-red-200"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-slate-900 mb-1">
                        {risk.deal_name}
                      </div>
                      <div className="text-xs text-slate-600 mb-1">
                        ${(risk.deal_value || 0).toLocaleString()} • Risk: {risk.risk_score}/100
                      </div>
                      <div className="text-xs text-red-800 italic">
                        "{risk.defense_talking_point}"
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Detailed Action Plan */}
        <Card className="p-6 mb-6" id="action-plan">
          <h2 className="text-2xl font-bold mb-6 text-slate-900">
            Deal-by-Deal Action Plan
          </h2>

          <div className="space-y-4">
            {aiAnalysis.results
              .sort((a, b) => {
                // Sort by priority: critical > high > medium > low
                const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
                return (
                  priorityOrder[a.action_priority as keyof typeof priorityOrder] -
                  priorityOrder[b.action_priority as keyof typeof priorityOrder]
                )
              })
              .map((deal, index) => (
                <div
                  key={deal.deal_id}
                  className={`rounded-lg border-2 p-6 transition-all hover:shadow-md ${
                    deal.risk_level === "high"
                      ? "border-red-200 bg-red-50"
                      : deal.risk_level === "medium"
                      ? "border-orange-200 bg-orange-50"
                      : "border-green-200 bg-green-50"
                  }`}
                >
                  {/* Deal Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {deal.deal_name}
                        </h3>
                        <Badge className={getRiskColor(deal.risk_level)}>
                          {deal.risk_level.toUpperCase()} RISK
                        </Badge>
                        <Badge
                          className={`${getPriorityColor(deal.action_priority)} text-white`}
                        >
                          {deal.action_priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="font-semibold">
                          ${deal.deal_amount.toLocaleString()}
                        </span>
                        <span>•</span>
                        <span>Risk Score: {deal.risk_score}/100</span>
                        <span>•</span>
                        <span>Confidence: {Math.round(deal.confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <div className="bg-white rounded-lg p-4 mb-4 border border-slate-200">
                    <div className="text-xs font-semibold text-slate-500 mb-2">
                      EXECUTIVE SUMMARY
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {deal.executive_summary}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Risk Factors */}
                    <div>
                      <div className="text-sm font-semibold text-slate-900 mb-3">
                        🚨 Risk Factors
                      </div>
                      <ul className="space-y-2">
                        {deal.risk_factors.map((factor, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                            <span className="text-sm text-slate-700">{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Next Action */}
                    <div>
                      <div className="text-sm font-semibold text-slate-900 mb-3">
                        ⚡ Next Best Action
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="font-medium text-blue-900 mb-2">
                          {deal.next_best_action}
                        </div>
                        <div className="text-xs text-blue-700">
                          {deal.action_rationale}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push(`/results/${analysisId}`)}
          >
            View Business Rules
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/history")}
          >
            Back to History
          </Button>
        </div>
      </div>
    </div>
  )
}
