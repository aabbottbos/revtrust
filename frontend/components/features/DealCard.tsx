"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, AlertTriangle, Info } from "lucide-react"

interface Deal {
  deal_id: string
  deal_name: string
  violation_count: number
  critical_count: number
  warning_count: number
  info_count: number
  overall_severity: "critical" | "warning" | "info"
}

interface DealCardProps {
  deal: Deal
  onClick: () => void
}

export function DealCard({ deal, onClick }: DealCardProps) {
  // Determine border color based on severity
  const borderColors = {
    critical: "border-red-500",
    warning: "border-orange-500",
    info: "border-blue-500",
  }

  // Determine icon based on severity
  const SeverityIcon = {
    critical: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[deal.overall_severity]

  const iconColors = {
    critical: "text-red-600",
    warning: "text-orange-600",
    info: "text-blue-600",
  }

  return (
    <Card
      className={`p-4 cursor-pointer hover:shadow-lg transition-shadow border-l-4 ${
        borderColors[deal.overall_severity]
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Deal Name */}
          <div className="flex items-center space-x-2 mb-2">
            <SeverityIcon
              className={`h-5 w-5 ${iconColors[deal.overall_severity]}`}
            />
            <h3 className="font-semibold text-slate-900">{deal.deal_name}</h3>
          </div>

          {/* Severity Counts */}
          <div className="flex flex-wrap gap-2 mt-3">
            {deal.critical_count > 0 && (
              <Badge variant="destructive" className="text-xs">
                {deal.critical_count} Critical
              </Badge>
            )}
            {deal.warning_count > 0 && (
              <Badge className="text-xs bg-orange-500 hover:bg-orange-600">
                {deal.warning_count} Warning
              </Badge>
            )}
            {deal.info_count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {deal.info_count} Info
              </Badge>
            )}
          </div>
        </div>

        {/* Total Issues Count */}
        <div className="text-right ml-4">
          <div className="text-2xl font-bold text-slate-700">
            {deal.violation_count}
          </div>
          <div className="text-xs text-slate-500">
            {deal.violation_count === 1 ? "Issue" : "Issues"}
          </div>
        </div>
      </div>
    </Card>
  )
}
