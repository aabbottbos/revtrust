import { Badge } from "@/components/ui/badge"
import { TrendingUp, AlertTriangle } from "lucide-react"

interface DealPriorityBadgeProps {
  priorityScore?: number | null
  quotaImpactPct?: number | null
  className?: string
}

export function DealPriorityBadge({
  priorityScore,
  quotaImpactPct,
  className = ""
}: DealPriorityBadgeProps) {
  // If no priority data, don't render anything
  if (priorityScore === null || priorityScore === undefined) {
    return null
  }

  // Determine priority level and styling
  let priorityLevel: string
  let bgColor: string
  let textColor: string
  let borderColor: string
  let icon: JSX.Element

  if (priorityScore >= 75) {
    priorityLevel = "Critical Priority"
    bgColor = "bg-red-50"
    textColor = "text-red-900"
    borderColor = "border-red-300"
    icon = <AlertTriangle className="w-3.5 h-3.5" />
  } else if (priorityScore >= 50) {
    priorityLevel = "High Priority"
    bgColor = "bg-orange-50"
    textColor = "text-orange-900"
    borderColor = "border-orange-300"
    icon = <AlertTriangle className="w-3.5 h-3.5" />
  } else if (priorityScore >= 25) {
    priorityLevel = "Medium Priority"
    bgColor = "bg-yellow-50"
    textColor = "text-yellow-900"
    borderColor = "border-yellow-300"
    icon = <TrendingUp className="w-3.5 h-3.5" />
  } else {
    priorityLevel = "Low Priority"
    bgColor = "bg-blue-50"
    textColor = "text-blue-900"
    borderColor = "border-blue-300"
    icon = <TrendingUp className="w-3.5 h-3.5" />
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge
        className={`${bgColor} ${textColor} ${borderColor} border-2 px-3 py-1 flex items-center gap-1.5 font-semibold`}
      >
        {icon}
        {priorityLevel}
      </Badge>

      {quotaImpactPct !== null && quotaImpactPct !== undefined && quotaImpactPct > 0 && (
        <div className="flex items-center gap-1 text-sm">
          <span className="text-slate-600">Quota Impact:</span>
          <span className={`font-bold ${
            quotaImpactPct >= 50 ? 'text-red-600' :
            quotaImpactPct >= 25 ? 'text-orange-600' :
            quotaImpactPct >= 10 ? 'text-yellow-600' :
            'text-blue-600'
          }`}>
            {quotaImpactPct.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}
