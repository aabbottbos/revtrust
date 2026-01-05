/**
 * Hook for Deal Review Wizard functionality
 * Manages state and API calls for reviewing and fixing deal issues
 */

import { useState, useCallback, useMemo, useEffect } from "react"
import { useAuthenticatedFetch } from "./useAuthenticatedFetch"
import { toast } from "sonner"

// ===========================================
// TYPES
// ===========================================

export interface DealIssue {
  id: string
  type: string
  rule_name: string
  category: string
  severity: "critical" | "warning" | "info"
  message: string
  field?: string
  current_value?: string
  suggested_value?: string
  recommendation?: string
  remediation_owner?: string
}

export interface FlaggedDeal {
  id: string
  crm_id: string
  crm_type: "salesforce" | "hubspot"
  name: string
  account_name?: string
  stage?: string
  amount?: number
  close_date?: string
  next_step?: string
  owner_name?: string
  last_activity_date?: string
  probability?: number
  description?: string
  issues: DealIssue[]
}

export interface DealUpdateRequest {
  crm_type: string
  crm_deal_id: string
  close_date?: string
  stage?: string
  amount?: number
  next_step?: string
  probability?: number
  description?: string
  custom_fields?: Record<string, any>
}

export interface DealUpdateResponse {
  success: boolean
  crm_deal_id: string
  updated_fields: string[]
  errors?: Array<{
    code: string
    message: string
    fields?: string[]
  }>
  crm_response?: any
}

export interface CRMConnectionStatus {
  hasConnection: boolean
  connections: Array<{
    id: string
    provider: string
    isActive: boolean
    accountName?: string
    connectedAt?: string
  }>
}

// ===========================================
// API FUNCTIONS HOOK
// ===========================================

export function useCRMWriteAPI() {
  const authenticatedFetch = useAuthenticatedFetch()

  const updateDeal = useCallback(
    async (
      crmType: string,
      dealId: string,
      updates: Partial<DealUpdateRequest>
    ): Promise<DealUpdateResponse> => {
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/crm/deals/${crmType}/${dealId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            crm_type: crmType,
            crm_deal_id: dealId,
            ...updates,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "Failed to update deal")
      }

      return response.json()
    },
    [authenticatedFetch]
  )

  const getCRMConnectionStatus = useCallback(async (): Promise<CRMConnectionStatus> => {
    const response = await authenticatedFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/crm/connections/status`
    )

    if (!response.ok) {
      throw new Error("Failed to get CRM connection status")
    }

    return response.json()
  }, [authenticatedFetch])

  const getFlaggedDeals = useCallback(
    async (analysisId: string): Promise<{ analysis_id: string; total_flagged: number; deals: FlaggedDeal[] }> => {
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/crm/analysis/${analysisId}/flagged-deals`
      )

      if (!response.ok) {
        throw new Error("Failed to get flagged deals")
      }

      return response.json()
    },
    [authenticatedFetch]
  )

  return {
    updateDeal,
    getCRMConnectionStatus,
    getFlaggedDeals,
  }
}

// ===========================================
// DEAL REVIEW WIZARD HOOK
// ===========================================

interface UseDealReviewOptions {
  deals: FlaggedDeal[]
  initialIndex?: number
  onComplete?: () => void
  onUpdate?: (dealId: string, updates: Partial<DealUpdateRequest>) => void
}

export function useDealReview({ deals, initialIndex = 0, onComplete, onUpdate }: UseDealReviewOptions) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [updatedDeals, setUpdatedDeals] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [updateError, setUpdateError] = useState<Error | null>(null)

  const { updateDeal } = useCRMWriteAPI()

  // Update currentIndex when initialIndex changes (e.g., wizard reopened with different deal)
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < deals.length) {
      setCurrentIndex(initialIndex)
    }
  }, [initialIndex, deals.length])

  const currentDeal = deals[currentIndex] || null
  const totalDeals = deals.length
  const hasNext = currentIndex < totalDeals - 1
  const hasPrevious = currentIndex > 0

  const goToNext = useCallback(() => {
    if (hasNext) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      // Last deal - close wizard
      onComplete?.()
    }
  }, [hasNext, onComplete])

  const goToPrevious = useCallback(() => {
    if (hasPrevious) {
      setCurrentIndex((prev) => prev - 1)
    }
  }, [hasPrevious])

  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalDeals) {
        setCurrentIndex(index)
      }
    },
    [totalDeals]
  )

  const saveDeal = useCallback(
    async (updates: Partial<DealUpdateRequest>) => {
      if (!currentDeal) return

      setIsSaving(true)
      setUpdateError(null)

      try {
        const response = await updateDeal(currentDeal.crm_type, currentDeal.crm_id, updates)

        if (response.success) {
          // Track that this deal was updated
          setUpdatedDeals((prev) => new Set(prev).add(currentDeal.id))

          // Notify parent of update
          onUpdate?.(currentDeal.id, updates)

          toast.success("Deal updated successfully!")

          // Auto-advance to next deal
          goToNext()
        } else {
          // Show error details
          const errorMsg = response.errors?.[0]?.message || "Failed to update deal"
          toast.error(errorMsg)
          setUpdateError(new Error(errorMsg))
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to update deal"
        toast.error(errorMsg)
        setUpdateError(error instanceof Error ? error : new Error(errorMsg))
      } finally {
        setIsSaving(false)
      }
    },
    [currentDeal, updateDeal, goToNext, onUpdate]
  )

  // Get indices of updated deals for progress indicator
  const updatedIndices = useMemo(() => {
    const indices = new Set<number>()
    deals.forEach((deal, idx) => {
      if (updatedDeals.has(deal.id)) {
        indices.add(idx)
      }
    })
    return indices
  }, [deals, updatedDeals])

  return {
    // Current state
    currentDeal,
    currentIndex,
    totalDeals,

    // Navigation
    hasNext,
    hasPrevious,
    goToNext,
    goToPrevious,
    goToIndex,

    // Updates
    saveDeal,
    isSaving,
    updateError,

    // Tracking
    updatedDeals,
    updatedCount: updatedDeals.size,
    updatedIndices,
  }
}

// ===========================================
// FLAGGED DEALS FETCHER HOOK
// ===========================================

export function useFlaggedDeals(analysisId: string) {
  const [deals, setDeals] = useState<FlaggedDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { getFlaggedDeals } = useCRMWriteAPI()

  const fetchDeals = useCallback(async () => {
    if (!analysisId) return

    setLoading(true)
    setError(null)

    try {
      console.log("[useFlaggedDeals] Fetching for analysisId:", analysisId)
      const data = await getFlaggedDeals(analysisId)
      console.log("[useFlaggedDeals] Got data:", { total: data.total_flagged, dealsCount: data.deals?.length })
      setDeals(data.deals || [])
    } catch (err) {
      console.error("[useFlaggedDeals] Error:", err)
      setError(err instanceof Error ? err.message : "Failed to load deals")
    } finally {
      setLoading(false)
    }
  }, [analysisId, getFlaggedDeals])

  const refetch = useCallback(() => {
    fetchDeals()
  }, [fetchDeals])

  // Fetch deals on mount and when analysisId changes
  useEffect(() => {
    fetchDeals()
  }, [analysisId]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    deals,
    loading,
    error,
    refetch,
    fetchDeals,
  }
}
