"use client"

/**
 * Displays aggregate team health metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, TrendingDown, AlertCircle, DollarSign, Target } from "lucide-react"
import { TeamHealthSummary } from "@/hooks/useOrganization"

interface TeamHealthCardProps {
  summary: TeamHealthSummary
}

export function TeamHealthCard({ summary }: TeamHealthCardProps) {
  if (!summary) {
    return null
  }

  const healthColor =
    summary.averageHealthScore >= 80
      ? "text-green-600"
      : summary.averageHealthScore >= 60
      ? "text-yellow-600"
      : "text-red-600"

  const healthBg =
    summary.averageHealthScore >= 80
      ? "bg-green-50"
      : summary.averageHealthScore >= 60
      ? "bg-yellow-50"
      : "bg-red-50"

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Team Health Score */}
      <Card className={`border-2 ${healthBg}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team Health</CardTitle>
          <Target className={`h-4 w-4 ${healthColor}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${healthColor}`}>
            {summary.averageHealthScore.toFixed(0)}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {summary.activeMembers} of {summary.totalMembers} members active
          </p>
          {summary.healthScoreChange != null && (
            <div className="flex items-center mt-2 text-xs">
              {summary.healthScoreChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={summary.healthScoreChange >= 0 ? "text-green-600" : "text-red-600"}>
                {summary.healthScoreChange >= 0 ? "+" : ""}
                {summary.healthScoreChange.toFixed(1)}%
              </span>
              <span className="text-slate-500 ml-1">vs last period</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
          <DollarSign className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            ${(summary.totalPipelineValue / 1000000).toFixed(1)}M
          </div>
          <p className="text-xs text-slate-500 mt-1">{summary.totalDeals} active deals</p>
        </CardContent>
      </Card>

      {/* Critical Issues */}
      <Card className={summary.totalCriticalIssues > 0 ? "border-red-200 bg-red-50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
          <AlertCircle
            className={`h-4 w-4 ${
              summary.totalCriticalIssues > 0 ? "text-red-600" : "text-slate-400"
            }`}
          />
        </CardHeader>
        <CardContent>
          <div
            className={`text-3xl font-bold ${
              summary.totalCriticalIssues > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {summary.totalCriticalIssues}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {summary.totalMajorIssues} major, {summary.totalMinorIssues} minor
          </p>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team Size</CardTitle>
          <Users className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{summary.totalMembers}</div>
          <p className="text-xs text-slate-500 mt-1">{summary.activeMembers} with pipeline data</p>
        </CardContent>
      </Card>
    </div>
  )
}
