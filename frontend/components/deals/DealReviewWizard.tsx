"use client"

/**
 * Full-screen modal for reviewing and fixing deal issues
 */

import { useState, useMemo, useCallback } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import {
  useDealReview,
  FlaggedDeal,
  DealIssue,
  DealUpdateRequest,
} from "@/hooks/useDealReview"
import { DealDetailsCard } from "./DealDetailsCard"
import { IssueHighlight } from "./IssueHighlight"
import { DealEditForm } from "./DealEditForm"
import { CRMPushConfirmDialog } from "./CRMPushConfirmDialog"
import { WizardProgress } from "./WizardProgress"

interface DealReviewWizardProps {
  open: boolean
  onClose: () => void
  deals: FlaggedDeal[]
  onDealsUpdated?: () => void // Callback to refresh parent data
}

export function DealReviewWizard({
  open,
  onClose,
  deals,
  onDealsUpdated,
}: DealReviewWizardProps) {
  const [pendingUpdate, setPendingUpdate] = useState<{
    updates: Record<string, any>
    changes: Record<string, { from: any; to: any }>
  } | null>(null)

  const {
    currentDeal,
    currentIndex,
    totalDeals,
    hasNext,
    hasPrevious,
    goToNext,
    goToPrevious,
    saveDeal,
    isSaving,
    updatedDeals,
    updatedIndices,
  } = useDealReview({
    deals,
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

  // Sort issues by severity
  const sortedIssues = useMemo(() => {
    if (!currentDeal) return []
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    return [...currentDeal.issues].sort(
      (a, b) =>
        (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3)
    )
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

                {/* Right Column - Issues & Edit Form */}
                <div className="space-y-6">
                  {/* Issues */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      Issues Found ({sortedIssues.length})
                    </h3>
                    {sortedIssues.map((issue, idx) => (
                      <IssueHighlight
                        key={issue.id || idx}
                        issue={issue}
                        showRecommendation={true}
                      />
                    ))}
                  </div>

                  {/* Edit Form */}
                  <div className="border rounded-lg p-4 bg-white">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Fix Issues
                    </h3>
                    <DealEditForm
                      deal={currentDeal}
                      issues={sortedIssues}
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
