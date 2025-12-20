"use client"

/**
 * Form for editing deal fields based on issues
 */

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Loader2, Save } from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

interface DealIssue {
  type: string
  field?: string
  suggested_value?: string
}

interface DealEditFormProps {
  deal: {
    close_date?: string
    stage?: string
    amount?: number
    next_step?: string
    description?: string
    probability?: number
  }
  issues: DealIssue[]
  onSave: (updates: Record<string, any>) => void
  isSaving: boolean
  crmType: "salesforce" | "hubspot"
}

// Common stage options - these could be fetched from CRM in the future
const STAGE_OPTIONS = [
  "Prospecting",
  "Qualification",
  "Needs Analysis",
  "Value Proposition",
  "Proposal/Price Quote",
  "Negotiation/Review",
  "Closed Won",
  "Closed Lost",
]

export function DealEditForm({
  deal,
  issues,
  onSave,
  isSaving,
  crmType,
}: DealEditFormProps) {
  // Initialize form state from deal and suggested values
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Pre-populate with suggested values from issues
  useEffect(() => {
    const initial: Record<string, any> = {}

    issues.forEach((issue) => {
      if (issue.field && issue.suggested_value !== undefined) {
        initial[issue.field] = issue.suggested_value
      }
    })

    setFormData(initial)
    setHasChanges(Object.keys(initial).length > 0)
  }, [issues])

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (hasChanges) {
      // Convert field names to API format
      const apiUpdates: Record<string, any> = {}

      if (formData.close_date) {
        apiUpdates.close_date = formData.close_date
      }
      if (formData.stage) {
        apiUpdates.stage = formData.stage
      }
      if (formData.amount !== undefined) {
        apiUpdates.amount = formData.amount
      }
      if (formData.next_step) {
        apiUpdates.next_step = formData.next_step
      }
      if (formData.probability !== undefined) {
        apiUpdates.probability = formData.probability
      }
      if (formData.description) {
        apiUpdates.description = formData.description
      }

      onSave(apiUpdates)
    }
  }

  // Determine which fields to show based on issues
  const issueFields = new Set(issues.map((i) => i.field).filter(Boolean))

  // Always show fields that have issues, plus a few common ones
  const showCloseDate =
    issueFields.has("close_date") ||
    issues.some(
      (i) => i.type === "sh_001" || i.type === "close_date_past" || i.type === "unrealistic_close_date"
    )
  const showNextStep =
    issueFields.has("next_step") ||
    issues.some((i) => i.type === "sh_004" || i.type === "missing_next_step" || i.type === "stale_deal")
  const showStage =
    issueFields.has("stage") ||
    issues.some((i) => i.type === "stage_regression" || i.type === "stage_mismatch")
  const showAmount = issueFields.has("amount")
  const showProbability = issueFields.has("probability")

  // Parse date safely
  const parseDate = (dateStr: string | undefined): Date | undefined => {
    if (!dateStr) return undefined
    try {
      return parseISO(dateStr)
    } catch {
      return undefined
    }
  }

  const currentCloseDate = parseDate(formData.close_date || deal.close_date)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm font-medium text-slate-500 mb-4">
        Update the fields below to fix the issues:
      </div>

      {/* Close Date */}
      {showCloseDate && (
        <div className="space-y-2">
          <Label htmlFor="close_date">Close Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !currentCloseDate && "text-slate-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {currentCloseDate
                  ? format(currentCloseDate, "PPP")
                  : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={currentCloseDate}
                onSelect={(date) =>
                  date && updateField("close_date", format(date, "yyyy-MM-dd"))
                }
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {issues.find((i) => i.field === "close_date")?.suggested_value && (
            <p className="text-xs text-green-600">
              Suggested:{" "}
              {format(
                parseISO(
                  issues.find((i) => i.field === "close_date")!.suggested_value!
                ),
                "PPP"
              )}
            </p>
          )}
        </div>
      )}

      {/* Stage */}
      {showStage && (
        <div className="space-y-2">
          <Label htmlFor="stage">Stage</Label>
          <Select
            value={formData.stage || deal.stage}
            onValueChange={(value) => updateField("stage", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_OPTIONS.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Next Step */}
      {showNextStep && (
        <div className="space-y-2">
          <Label htmlFor="next_step">Next Step</Label>
          <Textarea
            id="next_step"
            value={formData.next_step ?? deal.next_step ?? ""}
            onChange={(e) => updateField("next_step", e.target.value)}
            placeholder="Describe the next action for this deal..."
            rows={3}
          />
          {issues.find((i) => i.field === "next_step")?.suggested_value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-green-600"
              onClick={() =>
                updateField(
                  "next_step",
                  issues.find((i) => i.field === "next_step")!.suggested_value
                )
              }
            >
              Use suggestion: &quot;
              {issues.find((i) => i.field === "next_step")!.suggested_value}
              &quot;
            </Button>
          )}
        </div>
      )}

      {/* Amount */}
      {showAmount && (
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              $
            </span>
            <Input
              id="amount"
              type="number"
              value={formData.amount ?? deal.amount ?? ""}
              onChange={(e) =>
                updateField("amount", parseFloat(e.target.value))
              }
              className="pl-7"
            />
          </div>
        </div>
      )}

      {/* Probability */}
      {showProbability && (
        <div className="space-y-2">
          <Label htmlFor="probability">Probability (%)</Label>
          <Input
            id="probability"
            type="number"
            min={0}
            max={100}
            value={formData.probability ?? deal.probability ?? ""}
            onChange={(e) =>
              updateField("probability", parseInt(e.target.value))
            }
          />
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={!hasChanges || isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving to {crmType === "salesforce" ? "Salesforce" : "HubSpot"}...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save & Push to {crmType === "salesforce" ? "Salesforce" : "HubSpot"}
          </>
        )}
      </Button>
    </form>
  )
}
