import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, HelpCircle } from "lucide-react"

interface MethodologyItem {
  element: string
  present: boolean
  notes: string
}

interface MethodologyScore {
  methodology: string
  completed: number
  total: number
  completion_pct: number
  items: MethodologyItem[]
}

interface MethodologyScorecardProps {
  methodologyScore?: MethodologyScore | null
  className?: string
}

export function MethodologyScorecard({
  methodologyScore,
  className = ""
}: MethodologyScorecardProps) {
  // If no methodology data, don't render
  if (!methodologyScore || !methodologyScore.items || methodologyScore.items.length === 0) {
    return null
  }

  const { methodology, completed, total, completion_pct, items } = methodologyScore

  // Determine color scheme based on completion percentage
  const getCompletionColor = (pct: number) => {
    if (pct >= 80) return "text-green-600"
    if (pct >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getProgressColor = (pct: number) => {
    if (pct >= 80) return "bg-green-500"
    if (pct >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Card className={`p-4 bg-slate-50 border-slate-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-900">
            {methodology} Scorecard
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${getCompletionColor(completion_pct)}`}>
            {completed}/{total}
          </span>
          <span className="text-xs text-slate-600">
            ({completion_pct}%)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress
        value={completion_pct}
        className={`h-2 mb-3 ${getProgressColor(completion_pct)}`}
      />

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-2 text-xs"
          >
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {item.present ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
            </div>

            {/* Item Details */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${
                  item.present ? 'text-slate-900' : 'text-slate-700'
                }`}>
                  {item.element}
                </span>
                {!item.present && (
                  <span className="text-red-600 font-semibold">Missing</span>
                )}
              </div>
              {item.notes && (
                <div className="text-slate-600 mt-0.5 italic">
                  {item.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Prompt for Missing Items */}
      {completion_pct < 100 && (
        <div className="mt-3 pt-3 border-t border-slate-300">
          <div className="flex items-start gap-2 text-xs">
            <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-slate-700">
              <span className="font-semibold text-blue-900">Next Step:</span> Focus on identifying missing {methodology} elements to strengthen this deal.
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
