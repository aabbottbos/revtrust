"use client"

/**
 * Business Rules Section
 * Shows the rule-based analysis results (available to all users)
 */

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ClipboardList,
  ArrowRight,
} from "lucide-react"

interface IssueCategory {
  category: string
  count: number
  severity: "critical" | "warning" | "info"
  sample_violation?: {
    rule_name: string
    message: string
  }
}

interface BusinessRulesSectionProps {
  issuesByCategory: IssueCategory[]
  totalDeals: number
  dealsWithIssues: number
  healthScore: number
  onReviewClick?: () => void
  onCategoryClick?: (category: string, severity: string) => void
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    iconColor: "text-red-600",
    badgeBg: "bg-red-100",
    label: "High",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    iconColor: "text-orange-600",
    badgeBg: "bg-orange-100",
    label: "Med",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    iconColor: "text-blue-600",
    badgeBg: "bg-blue-100",
    label: "Low",
  },
}

export function BusinessRulesSection({
  issuesByCategory,
  totalDeals,
  dealsWithIssues,
  healthScore,
  onReviewClick,
  onCategoryClick,
}: BusinessRulesSectionProps) {
  const healthyDeals = totalDeals - dealsWithIssues
  const issuePercentage = totalDeals > 0 ? Math.round((dealsWithIssues / totalDeals) * 100) : 0

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Business Rules Analysis</h3>
            <p className="text-sm text-slate-500">
              {issuesByCategory.length} rule{issuesByCategory.length !== 1 ? "s" : ""} triggered
            </p>
          </div>
        </div>
        {dealsWithIssues > 0 && onReviewClick && (
          <Button size="sm" onClick={onReviewClick}>
            Review & Fix
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-2xl font-bold text-slate-900">{totalDeals}</div>
          <div className="text-xs text-slate-500">Total Deals</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-700">{dealsWithIssues}</div>
          <div className="text-xs text-orange-600">Need Attention</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-700">{healthyDeals}</div>
          <div className="text-xs text-green-600">Healthy</div>
        </div>
      </div>

      {/* Issues Table */}
      {issuesByCategory.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-slate-600 font-medium">No issues found!</p>
          <p className="text-sm text-slate-500 mt-1">
            Your pipeline passed all {issuesByCategory.length || 14} business rules.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase">
                  Issue
                </th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase w-20">
                  Count
                </th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-slate-500 uppercase w-20">
                  Severity
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-slate-500 uppercase w-24">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {issuesByCategory.map((issue, index) => {
                const config = severityConfig[issue.severity] || severityConfig.info

                return (
                  <tr
                    key={index}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div>
                        <div className="font-medium text-slate-900 text-sm">
                          {issue.sample_violation?.rule_name || issue.category}
                        </div>
                        {issue.sample_violation?.message && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {issue.sample_violation.message}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                        {issue.count}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge
                        variant="outline"
                        className={`${config.badgeBg} ${config.textColor} border-0 text-xs`}
                      >
                        {config.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onCategoryClick?.(issue.category, issue.severity)}
                      >
                        View
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
