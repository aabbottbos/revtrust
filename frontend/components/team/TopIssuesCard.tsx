"use client"

/**
 * Displays top issues across the team
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

interface TopIssuesCardProps {
  issues: Array<{ type: string; count: number }>
}

const issueLabels: Record<string, string> = {
  stale_deal: "Stale Deals",
  missing_next_step: "Missing Next Steps",
  no_activity: "No Recent Activity",
  overdue_close: "Overdue Close Date",
  low_engagement: "Low Engagement",
  champion_risk: "Champion Risk",
  competitive_threat: "Competitive Threat",
  budget_undefined: "Budget Undefined",
  decision_maker_absent: "No Decision Maker",
  timeline_slip: "Timeline Slipping",
}

const issueColors: Record<string, string> = {
  stale_deal: "bg-red-100 text-red-700",
  missing_next_step: "bg-orange-100 text-orange-700",
  no_activity: "bg-yellow-100 text-yellow-700",
  overdue_close: "bg-red-100 text-red-700",
  low_engagement: "bg-orange-100 text-orange-700",
  champion_risk: "bg-purple-100 text-purple-700",
  competitive_threat: "bg-blue-100 text-blue-700",
  budget_undefined: "bg-slate-100 text-slate-700",
  decision_maker_absent: "bg-pink-100 text-pink-700",
  timeline_slip: "bg-amber-100 text-amber-700",
}

export function TopIssuesCard({ issues }: TopIssuesCardProps) {
  if (!issues) {
    return null
  }

  const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0)

  if (issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Top Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-green-600">
            No issues detected across the team
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Top Issues
          <Badge variant="secondary" className="ml-auto">
            {totalIssues} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {issues.slice(0, 5).map((issue) => {
            const label = issueLabels[issue.type] || issue.type.replace(/_/g, " ")
            const colorClass = issueColors[issue.type] || "bg-slate-100 text-slate-700"

            return (
              <div
                key={issue.type}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm">{label}</span>
                <Badge className={colorClass}>{issue.count}</Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
