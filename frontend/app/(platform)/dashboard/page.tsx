"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  BookmarkCheck,
  Calendar,
  History,
  Settings,
  Lock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Sparkles
} from "lucide-react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { formatToEST } from "@/lib/utils"

interface DashboardStats {
  lastScanDate: string | null
  lastScanScore: number | null
  lastScanHealthStatus: string | null
  scansThisMonth: number
  criticalIssuesThisMonth: number
  connectedCRMs: number
  savedScansCount: number
  scheduledScansCount: number
  subscriptionTier: string
  subscriptionStatus: string
  recentScans: {
    analysis_id: string
    filename: string
    health_score: number
    analyzed_at: string
  }[]
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useUser()
  const authenticatedFetch = useAuthenticatedFetch()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isPaidUser = stats?.subscriptionTier && ["pro", "team", "enterprise"].includes(stats.subscriptionTier)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await authenticatedFetch(`${apiUrl}/api/dashboard/stats`)

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats")
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error("Error fetching dashboard stats:", err)
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  const getHealthColor = (score: number | null) => {
    if (score === null) return "text-slate-400"
    if (score >= 75) return "text-green-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getHealthBgColor = (score: number | null) => {
    if (score === null) return "bg-slate-100"
    if (score >= 75) return "bg-green-100"
    if (score >= 50) return "bg-yellow-100"
    return "bg-red-100"
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="p-12 text-center border-red-200 bg-red-50">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardStats} variant="outline">
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-slate-600">
            Here's an overview of your pipeline health
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/settings")}
          className="hidden md:flex"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Primary CTA - Scan Now */}
      <Card className="mb-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready to analyze your pipeline?</h2>
              <p className="text-blue-100 mb-4">
                Upload a file, scan from your CRM, or use a saved configuration
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => router.push("/scan")}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8"
            >
              <Play className="h-5 w-5 mr-2" />
              Scan Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Last Scan Score */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Last Scan Score</p>
                {stats?.lastScanScore !== null ? (
                  <>
                    <p className={`text-3xl font-bold ${getHealthColor(stats?.lastScanScore ?? null)}`}>
                      {Math.round(stats?.lastScanScore ?? 0)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {stats?.lastScanDate ? formatToEST(stats.lastScanDate) : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-lg text-slate-400">No scans yet</p>
                )}
              </div>
              <div className={`p-3 rounded-full ${getHealthBgColor(stats?.lastScanScore ?? null)}`}>
                {stats?.lastScanScore !== null ? (
                  stats.lastScanScore >= 75 ? (
                    <CheckCircle2 className={`h-6 w-6 ${getHealthColor(stats.lastScanScore)}`} />
                  ) : stats.lastScanScore >= 50 ? (
                    <TrendingDown className={`h-6 w-6 ${getHealthColor(stats.lastScanScore)}`} />
                  ) : (
                    <AlertTriangle className={`h-6 w-6 ${getHealthColor(stats.lastScanScore)}`} />
                  )
                ) : (
                  <TrendingUp className="h-6 w-6 text-slate-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scans This Month */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Scans This Month</p>
                <p className="text-3xl font-bold text-slate-900">
                  {stats?.scansThisMonth ?? 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {(stats?.connectedCRMs ?? 0) > 0
                    ? `${stats?.connectedCRMs} CRM${(stats?.connectedCRMs ?? 0) > 1 ? "s" : ""} connected`
                    : "No CRMs connected"}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical Issues */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Critical Issues Found</p>
                <p className={`text-3xl font-bold ${(stats?.criticalIssuesThisMonth ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                  {stats?.criticalIssuesThisMonth ?? 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">This month</p>
              </div>
              <div className={`p-3 rounded-full ${(stats?.criticalIssuesThisMonth ?? 0) > 0 ? "bg-red-100" : "bg-green-100"}`}>
                <AlertTriangle className={`h-6 w-6 ${(stats?.criticalIssuesThisMonth ?? 0) > 0 ? "text-red-600" : "text-green-600"}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Saved Scans Card */}
        <Card className={`relative overflow-hidden ${!isPaidUser ? "opacity-90" : ""}`}>
          {!isPaidUser && (
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                <Lock className="h-3 w-3 mr-1" />
                Pro
              </Badge>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isPaidUser ? "bg-purple-100" : "bg-slate-100"}`}>
                <BookmarkCheck className={`h-5 w-5 ${isPaidUser ? "text-purple-600" : "text-slate-400"}`} />
              </div>
              <div>
                <CardTitle className="text-lg">Saved Scans</CardTitle>
                <CardDescription>
                  {isPaidUser
                    ? `${stats?.savedScansCount ?? 0} saved configuration${(stats?.savedScansCount ?? 0) !== 1 ? "s" : ""}`
                    : "Save scan configurations for quick access"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isPaidUser ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/scan")}
              >
                View Saved Scans
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  Save your favorite CRM + filter combinations and run them with one click.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => router.push("/pricing")}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Scans Card */}
        <Card className={`relative overflow-hidden ${!isPaidUser ? "opacity-90" : ""}`}>
          {!isPaidUser && (
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                <Lock className="h-3 w-3 mr-1" />
                Pro
              </Badge>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isPaidUser ? "bg-green-100" : "bg-slate-100"}`}>
                <Calendar className={`h-5 w-5 ${isPaidUser ? "text-green-600" : "text-slate-400"}`} />
              </div>
              <div>
                <CardTitle className="text-lg">Scheduled Scans</CardTitle>
                <CardDescription>
                  {isPaidUser
                    ? `${stats?.scheduledScansCount ?? 0} active schedule${(stats?.scheduledScansCount ?? 0) !== 1 ? "s" : ""}`
                    : "Automate your pipeline reviews"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isPaidUser ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/schedule")}
              >
                Manage Schedules
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  Get automatic reports delivered to your email or Slack on a schedule.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => router.push("/pricing")}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <History className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">History</CardTitle>
                <CardDescription>View all past analyses</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.recentScans && stats.recentScans.length > 0 ? (
              <div className="space-y-3">
                {stats.recentScans.slice(0, 3).map((scan) => (
                  <div
                    key={scan.analysis_id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                    onClick={() => router.push(`/results/${scan.analysis_id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {scan.filename}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatToEST(scan.analyzed_at)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`ml-2 ${
                        scan.health_score >= 75
                          ? "text-green-600 border-green-200"
                          : scan.health_score >= 50
                          ? "text-yellow-600 border-yellow-200"
                          : "text-red-600 border-red-200"
                      }`}
                    >
                      {Math.round(scan.health_score)}
                    </Badge>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => router.push("/history")}
                >
                  View All History
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 mb-3">No scans yet</p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/scan")}
                >
                  Run Your First Scan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Settings className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Settings</CardTitle>
                <CardDescription>CRM connections & preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-sm text-slate-600">Connected CRMs</span>
                <Badge variant="outline">{stats?.connectedCRMs ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-sm text-slate-600">Subscription</span>
                <Badge
                  variant="outline"
                  className={isPaidUser ? "text-green-600 border-green-200" : ""}
                >
                  {stats?.subscriptionTier === "free" ? "Free" : stats?.subscriptionTier?.charAt(0).toUpperCase() + (stats?.subscriptionTier?.slice(1) ?? "")}
                </Badge>
              </div>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => router.push("/settings")}
              >
                Open Settings
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Banner for Free Users */}
      {!isPaidUser && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-100">
                  <Sparkles className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Unlock Pro Features</h3>
                  <p className="text-sm text-slate-600">
                    Get saved scans, scheduled reviews, AI insights, and more
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push("/pricing")}
                className="bg-amber-600 hover:bg-amber-700"
              >
                View Plans
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
