"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"

interface ReviewRun {
  id: string
  status: string
  started_at: string
  completed_at: string | null
  deals_analyzed: number | null
  health_score: number | null
  issues_found: number | null
  high_risk_deals: number | null
  error_message: string | null
  retry_count: number
  analysis_id: string | null
}

export default function RunHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const authenticatedFetch = useAuthenticatedFetch()
  const scheduleId = params.id as string

  const [runs, setRuns] = useState<ReviewRun[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRuns()
  }, [])

  const fetchRuns = async () => {
    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/scheduled-reviews/${scheduleId}/runs`
      )
      const data = await res.json()
      setRuns(data.runs)
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>
      case "running":
        return <Badge className="bg-blue-100 text-blue-700">Running</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700">Queued</Badge>
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button
        variant="ghost"
        onClick={() => router.push("/schedule")}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Schedules
      </Button>

      <h1 className="text-3xl font-bold mb-8">Run History</h1>

      {runs.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No runs yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => (
            <Card key={run.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {run.status === "completed" ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : run.status === "failed" ? (
                    <XCircle className="w-6 h-6 text-red-600" />
                  ) : (
                    <Clock className="w-6 h-6 text-blue-600" />
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        {new Date(run.started_at).toLocaleString()}
                      </span>
                      {getStatusBadge(run.status)}
                    </div>

                    {run.completed_at && (
                      <div className="text-xs text-slate-600">
                        Duration: {Math.round(
                          (new Date(run.completed_at).getTime() -
                           new Date(run.started_at).getTime()) / 1000
                        )}s
                      </div>
                    )}
                  </div>
                </div>

                {run.analysis_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/results/${run.analysis_id}/ai`)}
                  >
                    View Report
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>

              {run.status === "completed" && (
                <div className="grid grid-cols-4 gap-4 py-4 border-t border-b border-slate-200">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {run.deals_analyzed}
                    </div>
                    <div className="text-xs text-slate-600">Deals</div>
                  </div>

                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {run.health_score}
                    </div>
                    <div className="text-xs text-slate-600">Health</div>
                  </div>

                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {run.issues_found}
                    </div>
                    <div className="text-xs text-slate-600">Issues</div>
                  </div>

                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {run.high_risk_deals}
                    </div>
                    <div className="text-xs text-slate-600">High Risk</div>
                  </div>
                </div>
              )}

              {run.status === "failed" && run.error_message && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-800 font-mono">
                    {run.error_message}
                  </p>
                  {run.retry_count > 0 && (
                    <p className="text-xs text-red-600 mt-2">
                      Retried {run.retry_count} time(s)
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
