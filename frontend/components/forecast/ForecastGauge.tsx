"use client"

/**
 * Visual gauge showing pipeline vs target
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { ForecastAnalysis } from "@/hooks/useForecast"

interface ForecastGaugeProps {
  analysis: ForecastAnalysis
}

export function ForecastGauge({ analysis }: ForecastGaugeProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  // Calculate gauge percentage (capped at 150%)
  const percentage = Math.min((analysis.current_pipeline / analysis.target_amount) * 100, 150)
  const gaugeWidth = analysis.target_amount > 0 ? percentage : 0

  // Determine status
  const getStatus = () => {
    if (analysis.target_amount === 0) return { label: "No Target", color: "bg-slate-100 text-slate-700", icon: AlertTriangle }
    if (analysis.coverage_ratio >= 1.0) return { label: "On Track", color: "bg-green-100 text-green-700", icon: CheckCircle2 }
    if (analysis.coverage_ratio >= 0.8) return { label: "Close", color: "bg-yellow-100 text-yellow-700", icon: TrendingUp }
    if (analysis.coverage_ratio >= 0.5) return { label: "Behind", color: "bg-orange-100 text-orange-700", icon: TrendingDown }
    return { label: "At Risk", color: "bg-red-100 text-red-700", icon: XCircle }
  }

  const status = getStatus()
  const StatusIcon = status.icon

  // Gauge color based on coverage
  const getGaugeColor = () => {
    if (analysis.coverage_ratio >= 1.0) return "bg-green-500"
    if (analysis.coverage_ratio >= 0.8) return "bg-yellow-500"
    if (analysis.coverage_ratio >= 0.5) return "bg-orange-500"
    return "bg-red-500"
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Pipeline vs Target</CardTitle>
          <Badge className={status.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main gauge */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Progress</span>
            <span className="font-medium">{(analysis.coverage_ratio * 100).toFixed(0)}%</span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
            <div
              className={`h-full ${getGaugeColor()} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(gaugeWidth, 100)}%` }}
            />
            {/* Target marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-800"
              style={{ left: `${Math.min(100, (100 / analysis.coverage_ratio) * 100 / 150)}%` }}
            />
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Target</div>
            <div className="text-xl font-bold">{formatCurrency(analysis.target_amount)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Pipeline</div>
            <div className="text-xl font-bold">{formatCurrency(analysis.current_pipeline)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-500">
              {analysis.gap > 0 ? "Gap" : "Surplus"}
            </div>
            <div className={`text-xl font-bold ${analysis.gap > 0 ? "text-red-600" : "text-green-600"}`}>
              {formatCurrency(Math.abs(analysis.gap))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Coverage</div>
            <div className={`text-xl font-bold ${analysis.coverage_ratio >= 1 ? "text-green-600" : "text-orange-600"}`}>
              {analysis.coverage_ratio.toFixed(1)}x
            </div>
          </div>
        </div>

        {/* Additional info */}
        <div className="flex items-center justify-between pt-2 border-t text-sm text-slate-500">
          <span>{analysis.deal_count} deals in quarter</span>
          <span>{analysis.days_remaining} days remaining</span>
        </div>
      </CardContent>
    </Card>
  )
}
