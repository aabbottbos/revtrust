"use client"

/**
 * AI coaching display component
 */

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Brain,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Target,
  Lightbulb,
  AlertCircle,
  Flame,
} from "lucide-react"
import { ForecastCoaching, DealRecommendation } from "@/hooks/useForecast"

interface AICoachingCardProps {
  coaching: ForecastCoaching | null
  loading: boolean
  error: string | null
  onGetCoaching: () => void
}

export function AICoachingCard({ coaching, loading, error, onGetCoaching }: AICoachingCardProps) {
  const [expandedDeals, setExpandedDeals] = useState<Set<string>>(new Set())

  const toggleDeal = (dealId: string) => {
    const newExpanded = new Set(expandedDeals)
    if (newExpanded.has(dealId)) {
      newExpanded.delete(dealId)
    } else {
      newExpanded.add(dealId)
    }
    setExpandedDeals(newExpanded)
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "exceeding":
        return "bg-green-100 text-green-700"
      case "on_track":
        return "bg-green-100 text-green-700"
      case "achievable":
        return "bg-yellow-100 text-yellow-700"
      case "needs_work":
        return "bg-orange-100 text-orange-700"
      case "at_risk":
        return "bg-red-100 text-red-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-700"
      case "high":
        return "bg-orange-100 text-orange-700"
      case "medium":
        return "bg-yellow-100 text-yellow-700"
      case "low":
        return "bg-slate-100 text-slate-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  if (!coaching && !loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">AI Coaching</CardTitle>
          </div>
          <CardDescription>
            Get brutally honest AI-powered advice on hitting your target
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <Button onClick={onGetCoaching} className="w-full">
            <Brain className="h-4 w-4 mr-2" />
            Get AI Coaching
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-purple-600" />
          <p className="font-medium">Analyzing your pipeline...</p>
          <p className="text-sm text-slate-500 mt-1">This may take a moment</p>
        </CardContent>
      </Card>
    )
  }

  if (!coaching) return null

  return (
    <div className="space-y-4">
      {/* Verdict Card */}
      <Card className={`border-2 ${coaching.forecast_confidence === "at_risk" ? "border-red-200 bg-red-50" : coaching.forecast_confidence === "on_track" ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {coaching.forecast_confidence === "at_risk" ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : coaching.forecast_confidence === "on_track" || coaching.forecast_confidence === "exceeding" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Target className="h-5 w-5 text-orange-600" />
              )}
              <CardTitle className="text-lg">The Verdict</CardTitle>
            </div>
            <Badge className={getConfidenceColor(coaching.forecast_confidence)}>
              {coaching.forecast_confidence.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">{coaching.verdict}</p>
        </CardContent>
      </Card>

      {/* Gap Strategy */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-lg">Gap Strategy</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p>{coaching.gap_strategy}</p>
        </CardContent>
      </Card>

      {/* This Week Actions */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg">This Week</CardTitle>
          </div>
          <CardDescription>Your priority actions for the next 5 business days</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {coaching.this_week_actions.map((action, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Hard Truth */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Hard Truth</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{coaching.hard_truth}</p>
        </CardContent>
      </Card>

      {/* Deal Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Deal-by-Deal Plan</CardTitle>
            </div>
            <Badge variant="secondary">
              {coaching.high_priority_count} high priority
            </Badge>
          </div>
          <CardDescription>
            Specific actions for each deal in your pipeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {coaching.deal_recommendations.map((deal) => (
            <DealRecommendationItem
              key={deal.deal_id}
              deal={deal}
              expanded={expandedDeals.has(deal.deal_id)}
              onToggle={() => toggleDeal(deal.deal_id)}
              getPriorityColor={getPriorityColor}
              formatCurrency={formatCurrency}
            />
          ))}
        </CardContent>
      </Card>

      {/* Refresh button */}
      <div className="text-center">
        <Button variant="outline" onClick={onGetCoaching} disabled={loading}>
          <Brain className="h-4 w-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>
    </div>
  )
}

interface DealRecommendationItemProps {
  deal: DealRecommendation
  expanded: boolean
  onToggle: () => void
  getPriorityColor: (priority: string) => string
  formatCurrency: (value: number) => string
}

function DealRecommendationItem({
  deal,
  expanded,
  onToggle,
  getPriorityColor,
  formatCurrency,
}: DealRecommendationItemProps) {
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 cursor-pointer">
          <div className="flex items-center gap-3">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
            <div>
              <div className="font-medium">{deal.deal_name}</div>
              <div className="text-sm text-slate-500">
                {formatCurrency(deal.deal_amount)} • {deal.current_stage || "Unknown stage"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(deal.priority)}>{deal.priority}</Badge>
            <Badge variant="outline">{deal.probability_of_close}</Badge>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3 ml-7 space-y-3">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase mb-1">Assessment</div>
            <p className="text-sm">{deal.assessment}</p>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase mb-1">Action Required</div>
            <p className="text-sm font-medium text-blue-700">{deal.action}</p>
          </div>
          {deal.risk_factors.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase mb-1">Risk Factors</div>
              <ul className="text-sm space-y-1">
                {deal.risk_factors.map((factor, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
