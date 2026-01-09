"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  Wrench,
  LayoutGrid,
  ListChecks,
} from "lucide-react"
import { HealthScoreChart } from "@/components/features/HealthScoreChart"
import { ExportButton } from "@/components/features/ExportButton"
import { analytics } from "@/lib/analytics"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { useSubscription } from "@/hooks/useSubscription"
import { DealReviewWizard } from "@/components/deals"
import { useFlaggedDeals } from "@/hooks/useDealReview"
import {
  DealsView,
  IssuesView,
  AIInsightsSection,
} from "@/components/results"
import type { DealsFilter, IssuesFilter } from "@/components/results"

interface DealSummary {
  deal_id: string
  deal_name: string
  account_name?: string
  amount?: number
  stage?: string
  close_date?: string
  severity: "critical" | "warning" | "info"
  total_issues: number
  critical_count: number
  warning_count: number
  info_count: number
  issue_types: string[]
}

interface IssueSummary {
  issue_type: string
  severity: "critical" | "warning" | "info"
  total_occurrences: number
  affected_deals_count: number
  affected_deal_ids: string[]
  sample_message: string
  category: string
}

interface IssueCategory {
  category: string
  count: number
  severity: "critical" | "warning" | "info"
  sample_violation?: {
    rule_name: string
    message: string
  }
}

interface Violation {
  deal_id?: string
  deal_name?: string
  rule_id?: string
  rule_name: string
  category: string
  severity: string
  message: string
  field_name?: string
  current_value?: string
  expected_value?: string
  remediation_action?: string
  remediation_owner?: string
}

interface AnalysisResult {
  analysis_id: string
  file_name: string
  analyzed_at: string
  total_deals: number
  deals_with_issues: number
  health_score: number
  health_status: string
  health_color: string
  percentage_with_issues: number
  total_issues: number
  critical_issues: number
  warning_issues: number
  info_issues: number
  issues_by_category: IssueCategory[]
  issues_summary: IssueSummary[]
  deals_summary: DealSummary[]
  violations_by_deal?: Record<string, Violation[]>
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const analysisId = params.id as string
  const authenticatedFetch = useAuthenticatedFetch()
  const { hasAIAccess, loading: subscriptionLoading } = useSubscription()

  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [activeTab, setActiveTab] = useState<"deals" | "issues">("deals")
  const [initialDealId, setInitialDealId] = useState<string | null>(null)

  // Filter state for each view - initialized from URL params
  const [dealsFilter, setDealsFilter] = useState<DealsFilter>(() => {
    const filterParam = searchParams.get("filter")
    if (filterParam && ["all", "critical", "warning", "healthy"].includes(filterParam)) {
      return filterParam as DealsFilter
    }
    return "all"
  })
  const [issuesFilter, setIssuesFilter] = useState<IssuesFilter>(() => {
    const filterParam = searchParams.get("filter")
    if (filterParam && ["all", "critical", "warning", "info"].includes(filterParam)) {
      return filterParam as IssuesFilter
    }
    return "all"
  })

  // Update URL when filter changes
  const updateFilterUrl = useCallback((filter: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (filter === "all") {
      params.delete("filter")
    } else {
      params.set("filter", filter)
    }
    const newUrl = params.toString()
      ? `/results/${analysisId}?${params.toString()}`
      : `/results/${analysisId}`
    router.replace(newUrl, { scroll: false })
  }, [analysisId, router, searchParams])

  const handleDealsFilterChange = useCallback((filter: DealsFilter) => {
    setDealsFilter(filter)
    updateFilterUrl(filter)
  }, [updateFilterUrl])

  const handleIssuesFilterChange = useCallback((filter: IssuesFilter) => {
    setIssuesFilter(filter)
    updateFilterUrl(filter)
  }, [updateFilterUrl])

  // Fetch flagged deals for the wizard
  const { deals: flaggedDeals, refetch: refetchFlaggedDeals, loading: flaggedDealsLoading, error: flaggedDealsError } = useFlaggedDeals(analysisId)

  // Build fallback deals from violations_by_deal if flaggedDeals fails to load
  const wizardDeals = useMemo(() => {
    // If we have flagged deals from the API, use those
    if (flaggedDeals.length > 0) {
      return flaggedDeals
    }

    // Fallback: build deals from violations_by_deal in the result
    if (!result?.violations_by_deal) {
      return []
    }

    return Object.entries(result.violations_by_deal).map(([dealKey, violations]) => {
      const firstViolation = violations[0] || {}
      return {
        id: dealKey,
        crm_id: dealKey,
        crm_type: "salesforce" as const,
        name: firstViolation.deal_name || dealKey,
        account_name: undefined,
        stage: undefined,
        amount: undefined,
        close_date: undefined,
        next_step: undefined,
        owner_name: undefined,
        last_activity_date: undefined,
        probability: undefined,
        description: undefined,
        issues: violations.map((v, idx) => ({
          id: `${dealKey}-${idx}`,
          type: v.rule_id || "unknown",
          rule_name: v.rule_name || "Unknown Rule",
          category: v.category || "OTHER",
          severity: (v.severity?.toLowerCase() || "warning") as "critical" | "warning" | "info",
          message: v.message || "",
          field: v.field_name,
          current_value: v.current_value,
          suggested_value: v.expected_value,
          recommendation: v.remediation_action,
          remediation_owner: v.remediation_owner,
        })),
      }
    })
  }, [flaggedDeals, result?.violations_by_deal])

  // Check for deal query param on mount to auto-open wizard
  useEffect(() => {
    const dealParam = searchParams.get("deal")
    if (dealParam && wizardDeals.length > 0) {
      setInitialDealId(dealParam)
      setShowWizard(true)
      // Clean up the URL
      router.replace(`/results/${analysisId}`, { scroll: false })
    }
  }, [searchParams, wizardDeals, analysisId, router])

  useEffect(() => {
    fetchResults()
  }, [analysisId])

  const fetchResults = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analysis/${analysisId}`
      )

      if (!response.ok) {
        throw new Error("Failed to load results")
      }

      const data = await response.json()
      setResult(data)

      // Track analysis completion
      analytics.analysisCompleted(
        analysisId,
        data.critical_issues + data.warning_issues,
        data.health_score
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load results")
    } finally {
      setLoading(false)
    }
  }

  const handleDealClick = (dealId: string) => {
    // Open wizard at the specific deal
    console.log("[ResultsPage] handleDealClick:", { dealId, wizardDealsCount: wizardDeals.length })
    setInitialDealId(dealId)
    setShowWizard(true)
  }

  const handleCategoryClick = (category: string, severity: string) => {
    // For now, just open the wizard - could filter by severity in future
    setShowWizard(true)
  }

  const handleWizardClose = () => {
    setShowWizard(false)
    setInitialDealId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-revtrust-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Results not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const issuePercentage = Math.round(result.percentage_with_issues)
  const needsAttention = issuePercentage > 30

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Pipeline Analysis Results
              </h1>
              <p className="text-slate-600 mt-1">
                {result.file_name} • Analyzed {new Date(result.analyzed_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {result.deals_with_issues > 0 && (
                <Button
                  onClick={() => setShowWizard(true)}
                  className="bg-revtrust-blue hover:bg-blue-700"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Review & Fix Issues
                </Button>
              )}
              <ExportButton analysisId={analysisId} filename={result.file_name} />
            </div>
          </div>

          {/* Alert Banner */}
          {needsAttention && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900">
                <strong>{issuePercentage}% of deals have issues.</strong>{" "}
                Review and fix these to improve forecast accuracy and deal execution.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Health Score */}
          <div className="lg:col-span-1">
            <Card className="p-6 h-full">
              <h2 className="text-xl font-bold mb-6 text-slate-900">
                Pipeline Health
              </h2>
              <HealthScoreChart
                totalDeals={result.total_deals}
                dealsWithIssues={result.deals_with_issues}
                healthScore={result.health_score}
                healthStatus={result.health_status}
                healthColor={result.health_color}
              />
            </Card>
          </div>

          {/* Right Column - Tabbed Views */}
          <div className="lg:col-span-2">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "deals" | "issues")}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="deals" className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    Deals
                  </TabsTrigger>
                  <TabsTrigger value="issues" className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4" />
                    Issues
                  </TabsTrigger>
                </TabsList>
                <div className="text-sm text-slate-500">
                  {activeTab === "deals"
                    ? `${result.deals_with_issues} of ${result.total_deals} deals need attention`
                    : `${result.total_issues} total issues found`}
                </div>
              </div>

              <TabsContent value="deals" className="mt-0">
                <DealsView
                  dealsSummary={result.deals_summary || []}
                  totalDeals={result.total_deals}
                  dealsWithIssues={result.deals_with_issues}
                  onDealClick={handleDealClick}
                  onReviewClick={() => setShowWizard(true)}
                  filter={dealsFilter}
                  onFilterChange={handleDealsFilterChange}
                />
              </TabsContent>

              <TabsContent value="issues" className="mt-0">
                <IssuesView
                  issuesSummary={result.issues_summary || []}
                  totalIssues={result.total_issues}
                  criticalCount={result.critical_issues}
                  warningCount={result.warning_issues}
                  infoCount={result.info_issues}
                  totalDeals={result.total_deals}
                  onIssueClick={handleDealClick}
                  onReviewClick={() => setShowWizard(true)}
                  filter={issuesFilter}
                  onFilterChange={handleIssuesFilterChange}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* AI Insights Section */}
        <div className="mb-8">
          <AIInsightsSection
            analysisId={analysisId}
            hasAIAccess={hasAIAccess}
          />
        </div>

        {/* Back to History Link */}
        <div className="text-center mt-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/history')}
          >
            ← Back to History
          </Button>
        </div>
      </div>

      {/* Deal Review Wizard */}
      {wizardDeals.length > 0 && (
        <DealReviewWizard
          key={initialDealId || "default"}  // Force remount when initial deal changes
          open={showWizard}
          onClose={handleWizardClose}
          deals={wizardDeals}
          initialDealId={initialDealId}
          onDealsUpdated={() => {
            fetchResults()
            refetchFlaggedDeals()
          }}
        />
      )}
    </div>
  )
}
