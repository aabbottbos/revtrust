"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"

interface HealthScoreChartProps {
  totalDeals: number
  dealsWithIssues: number
  dealsWithoutIssues: number
  healthScore: number
  healthStatus: "excellent" | "good" | "fair" | "poor"
  healthColor: string
}

export function HealthScoreChart({
  totalDeals,
  dealsWithIssues,
  dealsWithoutIssues,
  healthScore,
  healthStatus,
  healthColor,
}: HealthScoreChartProps) {
  // Prepare data for pie chart
  const chartData = [
    { name: "Issues", value: dealsWithIssues, color: "#F97316" }, // Orange
    { name: "Healthy", value: dealsWithoutIssues, color: "#2563EB" }, // Blue
  ]

  // Status labels
  const statusLabels = {
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
  }

  return (
    <Card className="p-6 space-y-6">
      {/* Chart Title */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-700">
          Pipeline Health Score
        </h3>
      </div>

      {/* Circular Chart */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={450}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in">
          <div className="text-center">
            <div className="text-4xl font-bold animate-pulse-scale" style={{ color: healthColor }}>
              {dealsWithIssues}
            </div>
            <div className="text-2xl font-light text-slate-400">/</div>
            <div className="text-3xl font-semibold text-slate-700">
              {totalDeals}
            </div>
          </div>
        </div>
      </div>

      {/* Health Status Badge */}
      <div className="text-center">
        <div
          className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold"
          style={{
            backgroundColor: `${healthColor}20`,
            color: healthColor,
          }}
        >
          {statusLabels[healthStatus]} Health • {healthScore}/100
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-700">
            {totalDeals}
          </div>
          <div className="text-xs text-slate-500">Total Deals</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {dealsWithIssues}
          </div>
          <div className="text-xs text-slate-500">Need Attention</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-600" />
          <span className="text-slate-600">Healthy ({dealsWithoutIssues})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-slate-600">Issues ({dealsWithIssues})</span>
        </div>
      </div>
    </Card>
  )
}
