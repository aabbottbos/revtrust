"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Badge } from "@/components/ui/badge"

interface HealthScoreChartProps {
  totalDeals: number
  dealsWithIssues: number
  healthScore: number
  healthStatus: string
  healthColor: string
}

export function HealthScoreChart({
  totalDeals,
  dealsWithIssues,
  healthScore,
  healthStatus,
  healthColor,
}: HealthScoreChartProps) {
  const healthyDeals = totalDeals - dealsWithIssues
  const issuePercentage = Math.round((dealsWithIssues / totalDeals) * 100)

  const data = [
    { name: "Issues", value: dealsWithIssues, fill: "#F97316" },
    { name: "Healthy", value: healthyDeals, fill: "#2563EB" },
  ]

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: healthColor }}>
              {dealsWithIssues}
            </div>
            <div className="text-sm text-slate-600">of {totalDeals}</div>
            <div className="text-xs text-slate-500 mt-1">need attention</div>
          </div>
        </div>
      </div>

      {/* Health Status Badge */}
      <div className="text-center">
        <Badge
          className="text-sm px-4 py-1"
          style={{ backgroundColor: healthColor, color: 'white' }}
        >
          {issuePercentage}% Issues • {healthStatus}
        </Badge>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-slate-900">{totalDeals}</div>
          <div className="text-xs text-slate-600">Total Deals</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-orange-600">{dealsWithIssues}</div>
          <div className="text-xs text-slate-600">Need Attention</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-slate-600">Issues ({dealsWithIssues})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <span className="text-slate-600">Healthy ({healthyDeals})</span>
        </div>
      </div>
    </div>
  )
}
