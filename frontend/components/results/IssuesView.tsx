"use client"

/**
 * Issues View - Shows pipeline health from an issues-centric perspective
 * Displays all issue types, how many occurrences, and which deals are affected
 */

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react"
import { useState } from "react"

interface IssueSummary {
  issue_type: string
  severity: "critical" | "warning" | "info"
  total_occurrences: number
  affected_deals_count: number
  affected_deal_ids: string[]
  sample_message: string
  category: string
}

export type IssuesFilter = "all" | "critical" | "warning" | "info"

interface IssuesViewProps {
  issuesSummary: IssueSummary[]
  totalIssues: number
  criticalCount: number
  warningCount: number
  infoCount: number
  totalDeals: number
  onIssueClick?: (issueType: string) => void
  onReviewClick?: () => void
  filter?: IssuesFilter
  onFilterChange?: (filter: IssuesFilter) => void
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    iconColor: "text-red-600",
    badgeBg: "bg-red-100",
    progressColor: "bg-red-500",
    label: "Critical",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    iconColor: "text-orange-600",
    badgeBg: "bg-orange-100",
    progressColor: "bg-orange-500",
    label: "Warning",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    iconColor: "text-blue-600",
    badgeBg: "bg-blue-100",
    progressColor: "bg-blue-500",
    label: "Info",
  },
}

function IssueRow({
  issue,
  totalDeals,
  onIssueClick,
}: {
  issue: IssueSummary
  totalDeals: number
  onIssueClick?: (issueType: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const config = severityConfig[issue.severity]
  const Icon = config.icon
  const affectedPercentage = totalDeals > 0 ? (issue.affected_deals_count / totalDeals) * 100 : 0

  return (
    <div className={`border-b border-slate-100 last:border-0`}>
      <div
        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${config.bgColor} bg-opacity-30`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-slate-900">
                  {issue.issue_type}
                </h4>
                <Badge
                  variant="outline"
                  className={`${config.badgeBg} ${config.textColor} border-0 text-xs uppercase`}
                >
                  {config.label}
                </Badge>
              </div>

              <p className="text-sm text-slate-600 mb-2 line-clamp-1">
                {issue.sample_message}
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {issue.total_occurrences}
                  </span>
                  <span className="text-sm text-slate-500">occurrences</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-900">
                    {issue.affected_deals_count}
                  </span>
                  <span className="text-sm text-slate-500">
                    deal{issue.affected_deals_count !== 1 ? "s" : ""} affected
                  </span>
                </div>
                <div className="hidden md:flex items-center gap-2 flex-1 max-w-[200px]">
                  <Progress
                    value={affectedPercentage}
                    className="h-2"
                  />
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {Math.round(affectedPercentage)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded view - show affected deals */}
      {expanded && (
        <div className="px-4 pb-4 bg-slate-50">
          <div className="ml-12 p-3 bg-white rounded-lg border border-slate-200">
            <div className="text-xs font-medium text-slate-500 uppercase mb-2">
              Affected Deals
            </div>
            <div className="flex flex-wrap gap-2">
              {issue.affected_deal_ids.slice(0, 10).map((dealId) => (
                <Badge
                  key={dealId}
                  variant="outline"
                  className="bg-slate-100 text-slate-700 cursor-pointer hover:bg-slate-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    onIssueClick?.(dealId)
                  }}
                >
                  {dealId}
                </Badge>
              ))}
              {issue.affected_deal_ids.length > 10 && (
                <Badge variant="outline" className="bg-slate-100 text-slate-500">
                  +{issue.affected_deal_ids.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function IssuesView({
  issuesSummary,
  totalIssues,
  criticalCount,
  warningCount,
  infoCount,
  totalDeals,
  onIssueClick,
  onReviewClick,
  filter = "all",
  onFilterChange,
}: IssuesViewProps) {
  const issueTypes = issuesSummary.length

  // Filter issues based on selected filter
  const filteredIssues = filter === "all"
    ? issuesSummary
    : issuesSummary.filter(issue => issue.severity === filter)

  // Get count for filtered results
  const filteredIssueTypes = filteredIssues.length

  // Selected card styling
  const selectedCardClasses = "ring-2 ring-offset-2 ring-slate-900"

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
            filter === "all" ? selectedCardClasses : ""
          }`}
          onClick={() => onFilterChange?.("all")}
        >
          <div className="text-2xl font-bold text-slate-900">{totalIssues}</div>
          <div className="text-sm text-slate-600">Total Issues</div>
        </Card>
        <Card
          className={`p-4 border-red-200 bg-red-50 cursor-pointer hover:shadow-md transition-shadow ${
            filter === "critical" ? selectedCardClasses : ""
          }`}
          onClick={() => onFilterChange?.("critical")}
        >
          <div className="text-2xl font-bold text-red-700">{criticalCount}</div>
          <div className="text-sm text-red-600">Critical</div>
        </Card>
        <Card
          className={`p-4 border-orange-200 bg-orange-50 cursor-pointer hover:shadow-md transition-shadow ${
            filter === "warning" ? selectedCardClasses : ""
          }`}
          onClick={() => onFilterChange?.("warning")}
        >
          <div className="text-2xl font-bold text-orange-700">{warningCount}</div>
          <div className="text-sm text-orange-600">Warnings</div>
        </Card>
        <Card
          className={`p-4 border-blue-200 bg-blue-50 cursor-pointer hover:shadow-md transition-shadow ${
            filter === "info" ? selectedCardClasses : ""
          }`}
          onClick={() => onFilterChange?.("info")}
        >
          <div className="text-2xl font-bold text-blue-700">{infoCount}</div>
          <div className="text-sm text-blue-600">Info</div>
        </Card>
      </div>

      {/* Issues List */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              Issue Types ({filteredIssueTypes})
              {filter !== "all" && (
                <span className="ml-2 text-sm font-normal text-slate-500">
                  (filtered by {filter})
                </span>
              )}
            </h3>
            {totalIssues > 0 && onReviewClick && (
              <Button size="sm" onClick={onReviewClick}>
                Review All
              </Button>
            )}
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            {filter === "all" ? (
              <>
                <p className="text-slate-600 font-medium">No issues detected!</p>
                <p className="text-sm text-slate-500 mt-1">Your pipeline is clean and healthy.</p>
              </>
            ) : (
              <>
                <p className="text-slate-600 font-medium">No {filter} issues</p>
                <p className="text-sm text-slate-500 mt-1">No issues match the selected filter.</p>
              </>
            )}
          </div>
        ) : (
          <div>
            {filteredIssues.map((issue) => (
              <IssueRow
                key={issue.issue_type}
                issue={issue}
                totalDeals={totalDeals}
                onIssueClick={onIssueClick}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
