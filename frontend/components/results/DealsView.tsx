"use client"

/**
 * Deals View - Shows pipeline health from a deals-centric perspective
 * Displays how many deals have issues, grouped by deal with severity indicators
 */

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  Building2,
  DollarSign,
  Calendar,
} from "lucide-react"

interface DealSummary {
  deal_id: string
  deal_name: string
  account_name?: string
  amount?: number
  stage?: string
  close_date?: string
  severity: "critical" | "warning" | "info"
  total_issues: number
  critical_count: number
  warning_count: number
  info_count: number
  issue_types: string[]
}

interface DealsViewProps {
  dealsSummary: DealSummary[]
  totalDeals: number
  dealsWithIssues: number
  onDealClick?: (dealId: string) => void
  onReviewClick?: () => void
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    iconColor: "text-red-600",
    badgeBg: "bg-red-100",
    label: "Critical",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    iconColor: "text-orange-600",
    badgeBg: "bg-orange-100",
    label: "Warning",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    iconColor: "text-blue-600",
    badgeBg: "bg-blue-100",
    label: "Info",
  },
}

export function DealsView({
  dealsSummary,
  totalDeals,
  dealsWithIssues,
  onDealClick,
  onReviewClick,
}: DealsViewProps) {
  const healthyDeals = totalDeals - dealsWithIssues
  const criticalDeals = dealsSummary.filter(d => d.severity === "critical").length
  const warningDeals = dealsSummary.filter(d => d.severity === "warning").length
  const infoDeals = dealsSummary.filter(d => d.severity === "info").length

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-slate-900">{totalDeals}</div>
          <div className="text-sm text-slate-600">Total Deals</div>
        </Card>
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-2xl font-bold text-red-700">{criticalDeals}</div>
          <div className="text-sm text-red-600">Critical Issues</div>
        </Card>
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="text-2xl font-bold text-orange-700">{warningDeals}</div>
          <div className="text-sm text-orange-600">Warnings</div>
        </Card>
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="text-2xl font-bold text-green-700">{healthyDeals}</div>
          <div className="text-sm text-green-600">Healthy Deals</div>
        </Card>
      </div>

      {/* Deals List */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              Deals Requiring Attention ({dealsWithIssues})
            </h3>
            {dealsWithIssues > 0 && onReviewClick && (
              <Button size="sm" onClick={onReviewClick}>
                Review All
              </Button>
            )}
          </div>
        </div>

        {dealsSummary.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">All deals are healthy!</p>
            <p className="text-sm text-slate-500 mt-1">No issues detected in your pipeline.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {dealsSummary.map((deal) => {
              const config = severityConfig[deal.severity]
              const Icon = config.icon

              return (
                <div
                  key={deal.deal_id}
                  className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${config.bgColor} bg-opacity-30`}
                  onClick={() => onDealClick?.(deal.deal_id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className={`h-5 w-5 ${config.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-900 truncate">
                            {deal.deal_name}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`${config.badgeBg} ${config.textColor} border-0 text-xs`}
                          >
                            {deal.total_issues} issue{deal.total_issues !== 1 ? "s" : ""}
                          </Badge>
                        </div>

                        {/* Deal metadata */}
                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
                          {deal.account_name && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {deal.account_name}
                            </span>
                          )}
                          {deal.amount && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" />
                              {deal.amount.toLocaleString()}
                            </span>
                          )}
                          {deal.close_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(deal.close_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Issue breakdown */}
                        <div className="flex items-center gap-2">
                          {deal.critical_count > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                              {deal.critical_count} critical
                            </span>
                          )}
                          {deal.warning_count > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700">
                              {deal.warning_count} warning
                            </span>
                          )}
                          {deal.info_count > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                              {deal.info_count} info
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
