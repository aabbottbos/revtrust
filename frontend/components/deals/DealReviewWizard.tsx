"use client"

/**
 * Full-screen modal for reviewing and fixing deal issues
 * Separates Business Rules (available to all) from AI Insights (paid only)
 */

import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Sparkles,
  Lock,
} from "lucide-react"
import {
  useDealReview,
  FlaggedDeal,
  DealIssue,
  DealUpdateRequest,
} from "@/hooks/useDealReview"
import { useSubscription } from "@/hooks/useSubscription"
import { DealDetailsCard } from "./DealDetailsCard"
import { IssueHighlight } from "./IssueHighlight"
import { DealEditForm } from "./DealEditForm"
import { CRMPushConfirmDialog } from "./CRMPushConfirmDialog"
import { WizardProgress } from "./WizardProgress"

interface DealReviewWizardProps {
  open: boolean
  onClose: () => void
  deals: FlaggedDeal[]
  initialDealId?: string | null // ID of deal to start with
  onDealsUpdated?: () => void // Callback to refresh parent data
}

// Blurred AI Insights section for non-paid users
function AIInsightsLocked() {
  const router = useRouter()

  return (
    <div className="relative">
      {/* Blurred background */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <div className="blur-sm opacity-40 p-4">
          <div className="space-y-3">
            <div className="h-16 bg-purple-100 rounded-lg" />
            <div className="h-16 bg-purple-100 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Frosted overlay with CTA */}
      <div className="relative backdrop-blur-md bg-white/80 rounded-lg border-2 border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-3">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <h4 className="font-semibold text-slate-900 mb-1">
          AI Insights Locked
        </h4>
        <p className="text-sm text-slate-600 mb-4 max-w-xs">
          Upgrade to Pro to get AI-powered recommendations and risk analysis for each deal.
        </p>
        <Button
          size="sm"
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          onClick={() => router.push("/pricing")}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Upgrade to Pro
        </Button>
      </div>
    </div>
  )
}

// AI Insights content for paid users
function AIInsightsContent({ issues }: { issues: DealIssue[] }) {
  // Filter for AI-generated insights (issues with recommendations)
  const aiIssues = issues.filter((issue) => issue.recommendation)

  if (aiIssues.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No AI insights available for this deal yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {aiIssues.map((issue, idx) => (
        <div
          key={issue.id || idx}
          className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-slate-900 mb-1">
                {issue.rule_name || "AI Recommendation"}
              </div>
              <p className="text-sm text-slate-700">{issue.recommendation}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DealReviewWizard({
  open,
  onClose,
  deals,
  initialDealId,
  onDealsUpdated,
}: DealReviewWizardProps) {
  const [pendingUpdate, setPendingUpdate] = useState<{
    updates: Record<string, any>
    changes: Record<string, { from: any; to: any }>
  } | null>(null)
  const [activeTab, setActiveTab] = useState<"rules" | "ai">("rules")

  const { hasAIAccess } = useSubscription()

  // Find initial index based on initialDealId (can be id, crm_id, or name)
  const initialIndex = useMemo(() => {
    if (!initialDealId) return 0
    const index = deals.findIndex(
      (d) =>
        d.id === initialDealId ||
        d.crm_id === initialDealId ||
        d.name === initialDealId  // Also match by name since deal_id in summary may be the name
    )
    // Debug logging - remove after fixing
    console.log("[DealReviewWizard] Finding deal:", {
      initialDealId,
      foundIndex: index,
      dealsCount: deals.length,
      dealNames: deals.slice(0, 5).map(d => ({ id: d.id, name: d.name }))
    })
    return index >= 0 ? index : 0
  }, [initialDealId, deals])

  const {
    currentDeal,
    currentIndex,
    totalDeals,
    hasNext,
    hasPrevious,
    goToNext,
    goToPrevious,
    goToIndex,
    saveDeal,
    isSaving,
    updatedDeals,
    updatedIndices,
  } = useDealReview({
    deals,
    initialIndex,  // Pass initial index directly to the hook
    onComplete: () => {
      onDealsUpdated?.()
      onClose()
    },
    onUpdate: () => {
      onDealsUpdated?.()
    },
  })

  // Get fields with issues for highlighting
  const issueFields = useMemo(() => {
    if (!currentDeal) return []
    return currentDeal.issues
      .map((i) => i.field)
      .filter((f): f is string => !!f)
  }, [currentDeal])

  // Separate business rules from AI insights
  const { businessRuleIssues, aiIssues } = useMemo(() => {
    if (!currentDeal) return { businessRuleIssues: [], aiIssues: [] }

    const severityOrder = { critical: 0, warning: 1, info: 2 }
    const sortedIssues = [...currentDeal.issues].sort(
      (a, b) =>
        (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3)
    )

    // Business rules = issues without AI recommendation (or all issues for display)
    // AI insights = issues with recommendation field
    const businessRuleIssues = sortedIssues
    const aiIssues = sortedIssues.filter((i) => i.recommendation)

    return { businessRuleIssues, aiIssues }
  }, [currentDeal])

  // Handle save with confirmation
  const handleSaveRequest = useCallback(
    (updates: Record<string, any>) => {
      if (!currentDeal) return

      // Build changes object for confirmation dialog
      const changes: Record<string, { from: any; to: any }> = {}

      if (updates.close_date) {
        changes.close_date = {
          from: currentDeal.close_date,
          to: updates.close_date,
        }
      }
      if (updates.stage) {
        changes.stage = { from: currentDeal.stage, to: updates.stage }
      }
      if (updates.next_step) {
        changes.next_step = {
          from: currentDeal.next_step,
          to: updates.next_step,
        }
      }
      if (updates.amount !== undefined) {
        changes.amount = { from: currentDeal.amount, to: updates.amount }
      }
      if (updates.probability !== undefined) {
        changes.probability = {
          from: currentDeal.probability,
          to: updates.probability,
        }
      }

      setPendingUpdate({ updates, changes })
    },
    [currentDeal]
  )

  const handleConfirmSave = useCallback(async () => {
    if (!pendingUpdate) return

    await saveDeal(pendingUpdate.updates)
    setPendingUpdate(null)
  }, [pendingUpdate, saveDeal])

  const handleCancelSave = useCallback(() => {
    setPendingUpdate(null)
  }, [])

  // Handle close
  const handleClose = () => {
    onDealsUpdated?.()
    onClose()
  }

  if (!currentDeal) {
    return null
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          showCloseButton={false}
          className="max-w-none sm:max-w-none w-[75vw] h-screen p-0 m-0 rounded-lg border flex flex-col"
        >
          <VisuallyHidden>
            <DialogTitle>Review & Fix Deal Issues</DialogTitle>
          </VisuallyHidden>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-white flex-shrink-0">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-6 w-6 text-amber-500" />
              <div>
                <h2 className="text-lg font-semibold">Review & Fix Issues</h2>
                <p className="text-sm text-slate-500">
                  Fix issues and push updates to your CRM
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <WizardProgress
                current={currentIndex}
                total={totalDeals}
                updatedIndices={updatedIndices}
              />
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto p-6 bg-slate-50">
            <div className="max-w-[1800px] mx-auto">
              {/* Deal Name Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold">{currentDeal.name}</h1>
                <p className="text-slate-500">{currentDeal.account_name}</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column - Deal Details */}
                <div className="space-y-6">
                  <DealDetailsCard
                    deal={currentDeal}
                    highlightFields={issueFields}
                  />
                </div>

                {/* Right Column - Tabbed Issues & Edit Form */}
                <div className="space-y-6">
                  {/* Tabbed Issues Section */}
                  <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as "rules" | "ai")}
                    className="w-full"
                  >
                    <TabsList className="w-full">
                      <TabsTrigger value="rules" className="flex-1 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        Business Rules ({businessRuleIssues.length})
                      </TabsTrigger>
                      <TabsTrigger value="ai" className="flex-1 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Insights
                        {!hasAIAccess && <Lock className="w-3 h-3" />}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="rules" className="mt-4">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                          Issues Found ({businessRuleIssues.length})
                        </h3>
                        {businessRuleIssues.length === 0 ? (
                          <div className="text-center py-8 text-slate-500">
                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                            <p>No business rule violations for this deal.</p>
                          </div>
                        ) : (
                          businessRuleIssues.map((issue, idx) => (
                            <IssueHighlight
                              key={issue.id || idx}
                              issue={issue}
                              showRecommendation={false} // Hide AI recommendations in rules tab
                            />
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="ai" className="mt-4">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-purple-500" />
                          AI Recommendations
                        </h3>
                        {hasAIAccess ? (
                          <AIInsightsContent issues={businessRuleIssues} />
                        ) : (
                          <AIInsightsLocked />
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Edit Form */}
                  <div className="border rounded-lg p-4 bg-white">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Fix Issues
                    </h3>
                    <DealEditForm
                      deal={currentDeal}
                      issues={businessRuleIssues}
                      onSave={handleSaveRequest}
                      isSaving={isSaving}
                      crmType={currentDeal.crm_type}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-white flex-shrink-0">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={!hasPrevious}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="text-sm text-slate-500">
              {updatedDeals.size > 0 && (
                <span className="text-green-600">
                  {updatedDeals.size} deal{updatedDeals.size !== 1 ? "s" : ""}{" "}
                  updated
                </span>
              )}
            </div>

            <Button variant="outline" onClick={goToNext}>
              {hasNext ? (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Finish
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      {pendingUpdate && currentDeal && (
        <CRMPushConfirmDialog
          open={true}
          onConfirm={handleConfirmSave}
          onCancel={handleCancelSave}
          dealName={currentDeal.name}
          crmType={currentDeal.crm_type}
          changes={pendingUpdate.changes}
        />
      )}
    </>
  )
}
