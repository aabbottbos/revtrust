/**
 * Hooks for forecast tracking feature
 */

import { useState, useEffect, useCallback } from "react"
import { useAuthenticatedFetch } from "./useAuthenticatedFetch"

// ===========================================
// TYPES
// ===========================================

export interface QuarterlyTarget {
  id: string
  user_id: string
  org_id: string | null
  target_amount: number
  quarter: number
  year: number
  set_by_user_id: string
  set_by_role: string
  created_at: string
  updated_at: string
}

export interface DealSummary {
  id: string
  name: string
  amount: number
  close_date: string | null
  stage: string | null
  probability: number | null
  owner: string | null
  account: string | null
  days_until_close: number | null
  last_activity_date: string | null
}

export interface ForecastAnalysis {
  target: QuarterlyTarget | null
  target_amount: number
  current_pipeline: number
  weighted_pipeline: number
  gap: number
  gap_percentage: number
  deal_count: number
  deals: DealSummary[]
  coverage_ratio: number
  weighted_coverage: number
  quarter: number
  year: number
  quarter_start: string
  quarter_end: string
  days_remaining: number
}

export interface DealRecommendation {
  deal_id: string
  deal_name: string
  deal_amount: number
  current_stage: string | null
  assessment: string
  action: string
  priority: "critical" | "high" | "medium" | "low"
  probability_of_close: string
  risk_factors: string[]
}

export interface ForecastCoaching {
  verdict: string
  forecast_confidence: "at_risk" | "needs_work" | "achievable" | "on_track" | "exceeding"
  gap_strategy: string
  deal_recommendations: DealRecommendation[]
  this_week_actions: string[]
  hard_truth: string
  total_deals_analyzed: number
  high_priority_count: number
  generated_at: string
}

export interface TeamMemberForecast {
  user_id: string
  name: string | null
  email: string
  target_amount: number
  current_pipeline: number
  weighted_pipeline: number
  gap: number
  gap_percentage: number
  coverage_ratio: number
  deal_count: number
  forecast_confidence: string
  set_by_role: string
}

export interface TeamForecastRollup {
  org_id: string
  org_name: string
  quarter: number
  year: number
  total_target: number
  total_pipeline: number
  total_weighted_pipeline: number
  total_gap: number
  team_coverage: number
  team_weighted_coverage: number
  members: TeamMemberForecast[]
  members_on_track: number
  members_at_risk: number
  members_without_targets: number
}

// ===========================================
// HOOKS
// ===========================================

export function useQuarterlyTarget(orgId?: string, quarter?: number, year?: number) {
  const [target, setTarget] = useState<QuarterlyTarget | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const authFetch = useAuthenticatedFetch()

  const fetchTarget = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (orgId) params.append("org_id", orgId)
      if (quarter) params.append("quarter", quarter.toString())
      if (year) params.append("year", year.toString())

      const response = await authFetch(`/api/forecast/target?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTarget(data)
      } else if (response.status === 404) {
        setTarget(null)
      } else {
        const data = await response.json()
        setError(data.detail || "Failed to fetch target")
      }
    } catch (err) {
      setError("Failed to fetch target")
    } finally {
      setLoading(false)
    }
  }, [authFetch, orgId, quarter, year])

  useEffect(() => {
    fetchTarget()
  }, [fetchTarget])

  return { target, loading, error, refetch: fetchTarget }
}

export function useSetTarget() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const authFetch = useAuthenticatedFetch()

  const setTarget = async (data: {
    target_amount: number
    quarter: number
    year: number
    user_id?: string
    org_id?: string
  }): Promise<QuarterlyTarget | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await authFetch("/api/forecast/target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        return await response.json()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || "Failed to set target")
        return null
      }
    } catch (err) {
      setError("Failed to set target")
      return null
    } finally {
      setLoading(false)
    }
  }

  return { setTarget, loading, error }
}

export function useForecastAnalysis(orgId?: string, quarter?: number, year?: number) {
  const [analysis, setAnalysis] = useState<ForecastAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const authFetch = useAuthenticatedFetch()

  const fetchAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (orgId) params.append("org_id", orgId)
      if (quarter) params.append("quarter", quarter.toString())
      if (year) params.append("year", year.toString())

      const response = await authFetch(`/api/forecast/analysis?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      } else {
        const data = await response.json()
        setError(data.detail || "Failed to fetch analysis")
      }
    } catch (err) {
      setError("Failed to fetch analysis")
    } finally {
      setLoading(false)
    }
  }, [authFetch, orgId, quarter, year])

  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  return { analysis, loading, error, refetch: fetchAnalysis }
}

export function useForecastCoaching(orgId?: string) {
  const [coaching, setCoaching] = useState<{ analysis: ForecastAnalysis; coaching: ForecastCoaching } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const authFetch = useAuthenticatedFetch()

  const getCoaching = async (quarter?: number, year?: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await authFetch("/api/forecast/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, quarter, year }),
      })

      if (response.ok) {
        const data = await response.json()
        setCoaching(data)
        return data
      } else {
        const errorData = await response.json()
        setError(errorData.detail || "Failed to get coaching")
        return null
      }
    } catch (err) {
      setError("Failed to get coaching")
      return null
    } finally {
      setLoading(false)
    }
  }

  return { coaching, loading, error, getCoaching }
}

export function useTeamForecast(orgId: string | undefined, quarter?: number, year?: number) {
  const [rollup, setRollup] = useState<TeamForecastRollup | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const authFetch = useAuthenticatedFetch()

  const fetchRollup = useCallback(async () => {
    if (!orgId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (quarter) params.append("quarter", quarter.toString())
      if (year) params.append("year", year.toString())

      const response = await authFetch(`/api/forecast/team/${orgId}?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setRollup(data)
      } else {
        const data = await response.json()
        setError(data.detail || "Failed to fetch team forecast")
      }
    } catch (err) {
      setError("Failed to fetch team forecast")
    } finally {
      setLoading(false)
    }
  }, [authFetch, orgId, quarter, year])

  useEffect(() => {
    fetchRollup()
  }, [fetchRollup])

  return { rollup, loading, error, refetch: fetchRollup }
}

// Helper to get current quarter
export function getCurrentQuarter(): { quarter: number; year: number } {
  const now = new Date()
  const quarter = Math.ceil((now.getMonth() + 1) / 3)
  return { quarter, year: now.getFullYear() }
}

// Helper to format quarter label
export function formatQuarterLabel(quarter: number, year: number): string {
  return `Q${quarter} ${year}`
}
