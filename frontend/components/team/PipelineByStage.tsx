"use client"

/**
 * Displays pipeline value breakdown by stage
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

interface PipelineByStageProps {
  data: Record<string, number>
}

const stageColors: Record<string, string> = {
  discovery: "bg-blue-500",
  qualification: "bg-cyan-500",
  proposal: "bg-yellow-500",
  negotiation: "bg-orange-500",
  "closed-won": "bg-green-500",
  "closed-lost": "bg-red-400",
}

const stageLabels: Record<string, string> = {
  discovery: "Discovery",
  qualification: "Qualification",
  proposal: "Proposal",
  negotiation: "Negotiation",
  "closed-won": "Closed Won",
  "closed-lost": "Closed Lost",
}

export function PipelineByStage({ data }: PipelineByStageProps) {
  if (!data) {
    return null
  }

  const entries = Object.entries(data)
  const total = entries.reduce((sum, [, value]) => sum + value, 0)
  const maxValue = Math.max(...entries.map(([, value]) => value))

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Pipeline by Stage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-slate-500">
            No pipeline data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Pipeline by Stage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map(([stage, value]) => {
            const percentage = total > 0 ? (value / total) * 100 : 0
            const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0
            const color = stageColors[stage.toLowerCase()] || "bg-slate-400"
            const label = stageLabels[stage.toLowerCase()] || stage

            return (
              <div key={stage} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="text-slate-600">
                    {formatCurrency(value)}
                    <span className="text-slate-400 ml-1">({percentage.toFixed(0)}%)</span>
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-300`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="font-medium">Total Pipeline</span>
            <span className="text-lg font-bold">{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
