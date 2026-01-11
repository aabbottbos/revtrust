"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { NavBar } from "@/components/layout/NavBar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  MessageSquare,
  BookOpen,
  ChevronRight,
  Database,
  Server,
  RefreshCw,
  ExternalLink,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

interface HealthStatus {
  status: "healthy" | "unhealthy"
  database: string
  user_count: number
  timestamp: string
  error?: string
}

interface AdminMetrics {
  users: {
    total: number
    pro: number
    free: number
    recent_signups_30d: number
    latest: Array<{
      email: string
      createdAt: string
      tier: string
      status: string
    }>
  }
  revenue: {
    mrr: number
    arr: number
    ltv_estimate: number
  }
  metrics: {
    conversion_rate: number
    churn_rate: number
    total_analyses: number
    analyses_this_month: number
  }
  updated_at: string
}

export default function AdminDashboard() {
  const { getToken } = useAuth()
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  const environment = apiUrl.includes("localhost") ? "development" : "production"

  const fetchHealth = async (token: string | null) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/health-check`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (res.ok) {
        return await res.json()
      }
      return { status: "unhealthy", database: "error", error: "Failed to connect" }
    } catch {
      return { status: "unhealthy", database: "error", error: "API unreachable" }
    }
  }

  const fetchMetrics = async (token: string | null) => {
    const res = await fetch(`${apiUrl}/api/admin/metrics`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    if (!res.ok) {
      throw new Error("Failed to fetch metrics")
    }
    return await res.json()
  }

  const fetchAll = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = await getToken()
      const [healthData, metricsData] = await Promise.all([
        fetchHealth(token),
        fetchMetrics(token)
      ])
      setHealth(healthData)
      setMetrics(metricsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAll()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <div className="container mx-auto max-w-6xl p-8">
        {/* Header with Environment Badge */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <Badge
                variant="outline"
                className={environment === "development"
                  ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                  : "bg-green-50 text-green-700 border-green-300"
                }
              >
                {environment}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              {metrics?.updated_at && `Last updated: ${new Date(metrics.updated_at).toLocaleString()}`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* System Health Bar */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">API:</span>
                {health?.status === "healthy" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Database:</span>
                {health?.database === "connected" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              {health?.error && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{health.error}</span>
                </div>
              )}
            </div>
            <Link
              href={`${apiUrl}/docs`}
              target="_blank"
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              API Docs <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="p-4 mb-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Admin Tools - Primary Navigation */}
        <h2 className="text-lg font-semibold text-slate-700 mb-3">Admin Tools</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link href="/admin/prompts">
            <Card className="p-5 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Prompts & LLM</div>
                    <div className="text-sm text-slate-500">Manage AI prompts & providers</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 transition-colors" />
              </div>
            </Card>
          </Link>

          <Link href="/admin/rules">
            <Card className="p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Business Rules</div>
                    <div className="text-sm text-slate-500">Configure deal analysis rules</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </Card>
          </Link>

          <Link href="/admin/email-test">
            <Card className="p-5 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Mail className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Email Test</div>
                    <div className="text-sm text-slate-500">Test Resend configuration</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-orange-500 transition-colors" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Metrics Summary Row */}
        {metrics && (
          <>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">Quick Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Users</span>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{metrics.users.total}</div>
                <div className="text-xs text-slate-500">{metrics.users.pro} pro / {metrics.users.free} free</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">MRR</span>
                  <DollarSign className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900">${metrics.revenue.mrr.toLocaleString()}</div>
                <div className="text-xs text-slate-500">${metrics.revenue.arr.toLocaleString()} ARR</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Analyses</span>
                  <Activity className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{metrics.metrics.total_analyses}</div>
                <div className="text-xs text-slate-500">{metrics.metrics.analyses_this_month} this month</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Conversion</span>
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{metrics.metrics.conversion_rate}%</div>
                <div className="text-xs text-slate-500">{metrics.metrics.churn_rate}% churn</div>
              </Card>
            </div>

            {/* Recent Signups */}
            <h2 className="text-lg font-semibold text-slate-700 mb-3">Recent Signups</h2>
            <Card className="p-4">
              {metrics.users.latest.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No recent signups</p>
              ) : (
                <div className="space-y-2">
                  {metrics.users.latest.slice(0, 5).map((user, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded"
                    >
                      <div>
                        <span className="text-sm font-medium text-slate-900">{user.email}</span>
                        <span className="text-xs text-slate-500 ml-2">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            user.tier === "pro"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }
                        >
                          {user.tier}
                        </Badge>
                        {user.status === "active" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
