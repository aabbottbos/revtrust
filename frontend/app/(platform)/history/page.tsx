"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import { format } from "date-fns"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"

interface Analysis {
  analysis_id: string
  filename: string
  total_deals: number
  deals_with_issues: number
  health_score: number
  health_status: string
  analyzed_at: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const authenticatedFetch = useAuthenticatedFetch()

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await authenticatedFetch(`${apiUrl}/api/history`)

      if (!response.ok) throw new Error("Failed to fetch history")

      const data = await response.json()
      setAnalyses(data.analyses || [])
    } catch (error) {
      console.error("Error fetching history:", error)
      setError(error instanceof Error ? error.message : "Failed to load history")
    } finally {
      setLoading(false)
    }
  }

  const getHealthColor = (status: string) => {
    const colors = {
      excellent: "text-green-600 bg-green-50 border-green-200",
      good: "text-yellow-600 bg-yellow-50 border-yellow-200",
      fair: "text-orange-600 bg-orange-50 border-orange-200",
      poor: "text-red-600 bg-red-50 border-red-200",
    }
    return colors[status as keyof typeof colors] || colors.good
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return "#10B981"
    if (score >= 50) return "#F59E0B"
    return "#EF4444"
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading your analysis history...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="p-12 text-center border-red-200 bg-red-50">
          <p className="text-red-600">{error}</p>
          <Button
            onClick={fetchHistory}
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Analysis History
        </h1>
        <p className="text-slate-600">
          View all your previous pipeline analyses
        </p>
      </div>

      {analyses.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            No analyses yet
          </h3>
          <p className="text-slate-500 mb-6">
            Upload your first CSV to get started
          </p>
          <Button onClick={() => router.push("/upload")}>
            Upload Pipeline
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {analyses.map((analysis) => (
            <Card
              key={analysis.analysis_id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/results/${analysis.analysis_id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="h-5 w-5 text-slate-400" />
                    <h3 className="font-semibold text-slate-900">
                      {analysis.filename}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-slate-600 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(analysis.analyzed_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    <div>
                      {analysis.total_deals} deals analyzed
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Badge
                      className={`capitalize ${getHealthColor(analysis.health_status)}`}
                      variant="outline"
                    >
                      {analysis.health_status} Health
                    </Badge>
                    <div className="flex items-center space-x-2">
                      {analysis.deals_with_issues > 0 ? (
                        <TrendingDown className="h-4 w-4 text-orange-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-sm text-slate-600">
                        {analysis.deals_with_issues} {analysis.deals_with_issues === 1 ? 'issue' : 'issues'} found
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-6">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: getScoreColor(analysis.health_score) }}
                  >
                    {Math.round(analysis.health_score)}
                  </div>
                  <div className="text-xs text-slate-500">Health Score</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
