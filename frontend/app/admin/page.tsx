"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  ChevronRight
} from "lucide-react"
import Link from "next/link"

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
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/metrics`, {
        credentials: "include"
      })

      if (!res.ok) {
        throw new Error("Failed to fetch metrics")
      }

      const data = await res.json()
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-revtrust-blue" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            RevTrust Admin Dashboard
          </h1>
          <p className="text-slate-600">
            Last updated: {new Date(metrics.updated_at).toLocaleString()}
          </p>
        </div>

        {/* Admin Tools Navigation */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link href="/admin/prompts">
            <Card className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Prompts & LLM</div>
                    <div className="text-sm text-slate-600">Manage AI prompts & providers</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
              </div>
            </Card>
          </Link>

          <Link href="/admin/rules">
            <Card className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Business Rules</div>
                    <div className="text-sm text-slate-600">Configure deal analysis rules</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
              </div>
            </Card>
          </Link>

          <Link href="/admin/email-test">
            <Card className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Mail className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Email Test</div>
                    <div className="text-sm text-slate-600">Test Resend configuration</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-600 font-medium">Total Users</div>
              <Users className="w-5 h-5 text-revtrust-blue" />
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {metrics.users.total}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              +{metrics.users.recent_signups_30d} this month
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-600 font-medium">Pro Users</div>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              {metrics.users.pro}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {metrics.users.free} free users
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-600 font-medium">MRR</div>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600">
              ${metrics.revenue.mrr.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              ${metrics.revenue.arr.toLocaleString()} ARR
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-600 font-medium">Conversion</div>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {metrics.metrics.conversion_rate}%
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {metrics.metrics.churn_rate}% churn
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Usage Stats */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-revtrust-blue" />
              <h2 className="text-xl font-bold text-slate-900">Usage Stats</h2>
            </div>

            <Separator className="mb-4" />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Analyses</span>
                <span className="font-bold text-lg">
                  {metrics.metrics.total_analyses}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">This Month</span>
                <span className="font-bold text-lg text-green-600">
                  {metrics.metrics.analyses_this_month}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Avg per User</span>
                <span className="font-bold text-lg">
                  {(metrics.metrics.total_analyses / Math.max(metrics.users.total, 1)).toFixed(1)}
                </span>
              </div>
            </div>
          </Card>

          {/* Revenue Projections */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-bold text-slate-900">Revenue</h2>
            </div>

            <Separator className="mb-4" />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">MRR</span>
                <span className="font-bold text-lg">
                  ${metrics.revenue.mrr.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">ARR</span>
                <span className="font-bold text-lg text-blue-600">
                  ${metrics.revenue.arr.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Est. LTV (2yr)</span>
                <span className="font-bold text-lg text-green-600">
                  ${metrics.revenue.ltv_estimate.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Signups */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Recent Signups
          </h2>

          <Separator className="mb-4" />

          <div className="space-y-3">
            {metrics.users.latest.map((user, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{user.email}</div>
                  <div className="text-sm text-slate-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={user.tier === "pro" ? "default" : "secondary"}
                    className={
                      user.tier === "pro"
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : ""
                    }
                  >
                    {user.tier}
                  </Badge>

                  {user.status === "active" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
