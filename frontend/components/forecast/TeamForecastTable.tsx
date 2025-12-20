"use client"

/**
 * Team forecast table for managers
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { TeamForecastRollup, TeamMemberForecast } from "@/hooks/useForecast"

interface TeamForecastTableProps {
  rollup: TeamForecastRollup
}

export function TeamForecastTable({ rollup }: TeamForecastTableProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "on_track":
      case "exceeding":
        return "bg-green-100 text-green-700"
      case "achievable":
        return "bg-yellow-100 text-yellow-700"
      case "needs_work":
        return "bg-orange-100 text-orange-700"
      case "at_risk":
        return "bg-red-100 text-red-700"
      case "no_target":
        return "bg-slate-100 text-slate-500"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  // Sort members: at_risk first, then by gap
  const sortedMembers = [...rollup.members].sort((a, b) => {
    const priorityOrder = ["at_risk", "needs_work", "achievable", "on_track", "exceeding", "no_target"]
    const aIndex = priorityOrder.indexOf(a.forecast_confidence)
    const bIndex = priorityOrder.indexOf(b.forecast_confidence)
    if (aIndex !== bIndex) return aIndex - bIndex
    return b.gap - a.gap
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Team Forecast</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {rollup.members_on_track} on track
            </Badge>
            <Badge variant="secondary" className="bg-red-100 text-red-700">
              {rollup.members_at_risk} at risk
            </Badge>
          </div>
        </div>
        <CardDescription>
          Team coverage: {(rollup.team_coverage * 100).toFixed(0)}% •
          Weighted: {(rollup.team_weighted_coverage * 100).toFixed(0)}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Team summary */}
        <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
          <div>
            <div className="text-xs text-slate-500">Team Target</div>
            <div className="text-xl font-bold">{formatCurrency(rollup.total_target)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Pipeline</div>
            <div className="text-xl font-bold">{formatCurrency(rollup.total_pipeline)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Gap</div>
            <div className={`text-xl font-bold ${rollup.total_gap > 0 ? "text-red-600" : "text-green-600"}`}>
              {formatCurrency(Math.abs(rollup.total_gap))}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Coverage</div>
            <div className={`text-xl font-bold ${rollup.team_coverage >= 1 ? "text-green-600" : "text-orange-600"}`}>
              {rollup.team_coverage.toFixed(1)}x
            </div>
          </div>
        </div>

        {/* Members table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead className="text-right">Target</TableHead>
              <TableHead className="text-right">Pipeline</TableHead>
              <TableHead className="text-right">Gap</TableHead>
              <TableHead className="text-right">Coverage</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMembers.map((member) => (
              <TableRow key={member.user_id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-slate-200">
                        {getInitials(member.name, member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {member.name || member.email.split("@")[0]}
                      </div>
                      <div className="text-xs text-slate-500">
                        {member.deal_count} deals
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {member.target_amount > 0 ? (
                    formatCurrency(member.target_amount)
                  ) : (
                    <span className="text-slate-400">Not set</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(member.current_pipeline)}
                </TableCell>
                <TableCell className="text-right">
                  {member.target_amount > 0 ? (
                    <span className={member.gap > 0 ? "text-red-600" : "text-green-600"}>
                      {member.gap > 0 ? "-" : "+"}
                      {formatCurrency(Math.abs(member.gap))}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {member.target_amount > 0 ? (
                    <span className={member.coverage_ratio >= 1 ? "text-green-600" : "text-orange-600"}>
                      {member.coverage_ratio.toFixed(1)}x
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={getConfidenceColor(member.forecast_confidence)}>
                    {member.forecast_confidence === "no_target" ? "No target" : member.forecast_confidence.replace("_", " ")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {rollup.members_without_targets > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            {rollup.members_without_targets} team member{rollup.members_without_targets > 1 ? "s" : ""} without targets set
          </div>
        )}
      </CardContent>
    </Card>
  )
}
