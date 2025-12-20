"use client"

/**
 * Displays a single issue with severity styling and recommendation
 */

import { AlertCircle, AlertTriangle, Info, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

interface DealIssue {
  type: string
  rule_name?: string
  severity: "critical" | "warning" | "info"
  message: string
  field?: string
  current_value?: string
  suggested_value?: string
  recommendation?: string
}

interface IssueHighlightProps {
  issue: DealIssue
  showRecommendation?: boolean
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    iconColor: "text-red-600",
    label: "CRITICAL",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    iconColor: "text-orange-600",
    label: "WARNING",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    iconColor: "text-blue-600",
    label: "INFO",
  },
}

export function IssueHighlight({ issue, showRecommendation = true }: IssueHighlightProps) {
  const config = severityConfig[issue.severity] || severityConfig.info
  const Icon = config.icon

  const formatValue = (value: string | null | undefined): string => {
    if (value === null || value === undefined || value === "") return "Not set"
    return String(value)
  }

  return (
    <div
      className={cn(
        "rounded-lg border-2 p-4",
        config.bgColor,
        config.borderColor
      )}
    >
      {/* Issue Header */}
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.iconColor)} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "text-xs font-bold px-2 py-0.5 rounded",
                config.bgColor,
                config.textColor
              )}
            >
              {config.label}
            </span>
            {issue.rule_name && (
              <span className="text-xs text-slate-500">{issue.rule_name}</span>
            )}
          </div>
          <p className={cn("font-semibold", config.textColor)}>{issue.message}</p>
        </div>
      </div>

      {/* Current vs Suggested */}
      {(issue.current_value !== undefined || issue.suggested_value !== undefined) && (
        <div className="mt-3 ml-8 grid grid-cols-2 gap-4 text-sm">
          {issue.current_value !== undefined && (
            <div>
              <span className="text-slate-500">Current:</span>
              <span className={cn("ml-2 font-medium line-through", config.textColor)}>
                {formatValue(issue.current_value)}
              </span>
            </div>
          )}
          {issue.suggested_value !== undefined && (
            <div>
              <span className="text-slate-500">Suggested:</span>
              <span className="ml-2 font-medium text-green-700">
                {formatValue(issue.suggested_value)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* AI Recommendation */}
      {showRecommendation && issue.recommendation && (
        <div className="mt-4 ml-8 p-3 bg-white rounded-lg border">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs font-medium text-amber-600 uppercase">
                Recommendation
              </span>
              <p className="text-sm text-slate-700 mt-1">{issue.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
