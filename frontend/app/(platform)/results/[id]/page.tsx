"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { HealthScoreChart } from "@/components/features/HealthScoreChart"
import { DealsTable } from "@/components/features/DealsTable"
import { ExportButton } from "@/components/features/ExportButton"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AnalysisResult {
  analysis_id: string
  filename: string
  total_deals: number
  deals_with_issues: number
  deals_without_issues: number
  percentage_with_issues: number
  health_score: number
  health_status: "excellent" | "good" | "fair" | "poor"
  health_color: string
  critical_issues: number
  warning_issues: number
  info_issues: number
  violations_by_deal: Record<string, any[]>
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const analysisId = params.id as string

  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!analysisId) {
      router.push("/upload")
      return
    }

    fetchResults()
  }, [analysisId, router])

  const fetchResults = async () => {
    try {
      setLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(
        `${apiUrl}/api/analysis/${analysisId}`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch results")
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load results")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Results not found"}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/upload")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Pipeline Analysis Results
                </h1>
                <p className="text-sm text-slate-500">{result.filename}</p>
              </div>
            </div>

            <ExportButton
              analysisId={analysisId}
              filename={result.filename}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Alert Banner */}
        {result.percentage_with_issues > 50 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Your pipeline needs work. {result.percentage_with_issues}% of deals have critical issues.
              Cleaning these will immediately improve forecast accuracy and deal execution.
            </AlertDescription>
          </Alert>
        )}

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Health Score Chart (1/3) */}
          <div className="lg:col-span-1">
            <HealthScoreChart
              totalDeals={result.total_deals}
              dealsWithIssues={result.deals_with_issues}
              dealsWithoutIssues={result.deals_without_issues}
              healthScore={result.health_score}
              healthStatus={result.health_status}
              healthColor={result.health_color}
            />

            {/* Additional Metrics Card */}
            <Card className="mt-6 p-6">
              <h3 className="font-semibold text-slate-700 mb-4">
                Issues Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive" className="w-16 justify-center">
                      Critical
                    </Badge>
                    <span className="text-sm text-slate-600">High Priority</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">
                    {result.critical_issues}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Badge className="w-16 justify-center bg-orange-500">
                      Warning
                    </Badge>
                    <span className="text-sm text-slate-600">Medium Priority</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">
                    {result.warning_issues}
                  </span>
                </div>

                {result.info_issues > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="w-16 justify-center">
                        Info
                      </Badge>
                      <span className="text-sm text-slate-600">Low Priority</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">
                      {result.info_issues}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT: Deals Table (2/3) */}
          <div className="lg:col-span-2">
            <DealsTable
              analysisId={analysisId}
              totalDealsWithIssues={result.deals_with_issues}
            />
          </div>
        </div>

        {/* Unlock AI Section */}
        <div className="mt-8">
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Unlock the AI Upgrade
              </h3>
              <p className="text-slate-600">
                Move beyond basic diagnostics with RevTrust AI, offering predictive
                insights and intelligent recommendations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="font-semibold mb-2">Supercharge Your Forecast</h4>
                <p className="text-sm text-slate-600">
                  AI predicts deal risk, slip probability, and expected value — beyond
                  your CRM&apos;s guesses.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="font-semibold mb-2">Nail Your Next Step</h4>
                <p className="text-sm text-slate-600">
                  AI analyzes deal patterns and suggests the next best action to move
                  deals forward.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="font-semibold mb-2">Ace Your Pipeline Review</h4>
                <p className="text-sm text-slate-600">
                  AI surfaces the three deals your VP will grill you on — and how to
                  defend them.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Unlock AI Insights
              </Button>
              <p className="text-xs text-slate-500 mt-2">
                Available in MVP (coming soon)
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
