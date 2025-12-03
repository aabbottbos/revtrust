"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertCircle,
  TrendingUp,
  Zap,
  Target,
  Sparkles,
  ArrowRight,
  Lock,
  Download
} from "lucide-react"
import { HealthScoreChart } from "@/components/features/HealthScoreChart"
import { ExportButton } from "@/components/features/ExportButton"

interface IssueCategory {
  category: string
  count: number
  severity: "critical" | "warning" | "info"
  sample_violation?: {
    rule_name: string
    message: string
  }
}

interface AnalysisResult {
  analysis_id: string
  file_name: string
  analyzed_at: string
  total_deals: number
  deals_with_issues: number
  health_score: number
  health_status: string
  health_color: string
  percentage_with_issues: number
  issues_by_category: IssueCategory[]
  critical_issues: number
  warning_issues: number
  info_issues: number
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const analysisId = params.id as string

  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchResults()
  }, [analysisId])

  const fetchResults = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analysis/${analysisId}`
      )

      if (!response.ok) {
        throw new Error("Failed to load results")
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load results")
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200"
      case "warning":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "info":
        return "text-blue-600 bg-blue-50 border-blue-200"
      default:
        return "text-slate-600 bg-slate-50 border-slate-200"
    }
  }

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-300"
      case "warning":
        return "bg-orange-100 text-orange-700 border-orange-300"
      case "info":
        return "bg-blue-100 text-blue-700 border-blue-300"
      default:
        return "bg-slate-100 text-slate-700 border-slate-300"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-revtrust-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Results not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const issuePercentage = Math.round(result.percentage_with_issues)
  const needsAttention = issuePercentage > 30

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Pipeline Analysis Results
              </h1>
              <p className="text-slate-600 mt-1">
                {result.file_name} • Analyzed {new Date(result.analyzed_at).toLocaleDateString()}
              </p>
            </div>
            <ExportButton analysisId={analysisId} filename={result.file_name} />
          </div>

          {/* Alert Banner */}
          {needsAttention && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <strong>{issuePercentage}% of deals have critical issues.</strong>{" "}
                Cleaning these will immediately improve forecast accuracy and deal execution.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Health Score */}
          <div className="lg:col-span-1">
            <Card className="p-6 h-full">
              <h2 className="text-xl font-bold mb-6 text-slate-900">
                Pipeline Accuracy Check
              </h2>
              <HealthScoreChart
                totalDeals={result.total_deals}
                dealsWithIssues={result.deals_with_issues}
                healthScore={result.health_score}
                healthStatus={result.health_status}
                healthColor={result.health_color}
              />
            </Card>
          </div>

          {/* Right Column - Issues Table */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Deal Issues Identified
                </h2>
                <div className="text-sm text-slate-600">
                  {result.deals_with_issues} of {result.total_deals} deals need attention
                </div>
              </div>

              {/* Issues Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        Issue Category
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">
                        Count
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">
                        Severity
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.issues_by_category.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12">
                          <div className="text-green-600 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-slate-600 font-medium">No issues found!</p>
                          <p className="text-sm text-slate-500">Your pipeline is clean and healthy.</p>
                        </td>
                      </tr>
                    ) : (
                      result.issues_by_category.map((issue, index) => (
                        <tr
                          key={index}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-slate-900">
                                {issue.sample_violation?.rule_name || issue.category}
                              </div>
                              {issue.sample_violation?.message && (
                                <div className="text-sm text-slate-600 mt-1">
                                  {issue.sample_violation.message}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 font-semibold text-slate-700">
                              {issue.count}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge
                              variant="outline"
                              className={`${getSeverityBadgeColor(issue.severity)} border`}
                            >
                              {issue.severity === "critical" ? "High" :
                               issue.severity === "warning" ? "Med" : "Low"}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/results/${analysisId}/deals?severity=${issue.severity}`)}
                            >
                              View deals
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>

        {/* Unlock AI Section */}
        <Card className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-revtrust-blue rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Unlock the AI Upgrade
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Move beyond basic diagnostics with RevSmart AI, offering predictive insights
              and intelligent recommendations.
            </p>
          </div>

          {/* AI Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Feature 1: Supercharge Your Forecast */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-900">
                Supercharge Your Forecast
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                AI predicts deal risk, slip probability, and expected value — beyond your CRM's guesses.
              </p>
              <div className="bg-slate-100 rounded-lg p-3 text-xs font-mono text-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <span>Deal: Acme Corp</span>
                  <span className="text-red-600 font-semibold">78% Risk</span>
                </div>
                <div className="text-slate-600 text-xs">
                  Expected: $45K (originally $75K)
                </div>
              </div>
            </div>

            {/* Feature 2: Nail Your Next Step */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-2 border-revtrust-blue">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-900">
                Nail Your Next Step
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                AI analyzes deal patterns and suggests the next best action to move deals forward.
              </p>
              <div className="bg-green-50 rounded-lg p-3 text-xs">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="font-semibold text-green-900 mb-1">
                      Schedule executive briefing
                    </div>
                    <div className="text-green-700 text-xs">
                      Deals at this stage close 3x faster with C-level engagement
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Ace Your Pipeline Review */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-slate-900">
                Ace Your Pipeline Review
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                AI surfaces the three deals your VP will grill you on — and how to defend them.
              </p>
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 text-xs">
                <div className="font-semibold text-slate-900 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-1" />
                  Top 3 Deals at Risk
                </div>
                <div className="space-y-1 text-slate-700">
                  <div>1. GlobalTech ($120K) - No activity 18d</div>
                  <div>2. StartupXYZ ($85K) - Champion left</div>
                  <div>3. Enterprise Co ($200K) - Budget unclear</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-revtrust-blue hover:bg-blue-700 text-white px-8"
              onClick={() => router.push('/pricing')}
            >
              <Lock className="w-5 h-5 mr-2" />
              Unlock AI Insights
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8"
              onClick={() => router.push('/sign-up')}
            >
              Start Free Trial
            </Button>
          </div>

          <p className="text-center mt-4 text-sm text-slate-600">
            Pro plan: $59/month • 30-day money-back guarantee
          </p>
        </Card>

        {/* Back to History Link */}
        <div className="text-center mt-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/history')}
          >
            ← Back to History
          </Button>
        </div>
      </div>
    </div>
  )
}
