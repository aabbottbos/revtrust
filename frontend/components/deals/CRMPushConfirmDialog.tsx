"use client"

/**
 * Confirmation dialog before pushing changes to CRM
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { CloudUpload } from "lucide-react"

interface CRMPushConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  dealName: string
  crmType: "salesforce" | "hubspot"
  changes: Record<string, { from: any; to: any }>
}

export function CRMPushConfirmDialog({
  open,
  onConfirm,
  onCancel,
  dealName,
  crmType,
  changes,
}: CRMPushConfirmDialogProps) {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === "") return "Not set"
    if (typeof value === "number") return value.toLocaleString()
    return String(value)
  }

  const formatFieldName = (field: string): string => {
    return field
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const crmName = crmType === "salesforce" ? "Salesforce" : "HubSpot"

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CloudUpload className="h-5 w-5 text-blue-600" />
            Confirm CRM Update
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                You&apos;re about to update <strong>{dealName}</strong> in{" "}
                {crmName}.
              </p>

              <div className="bg-slate-100 rounded-lg p-4 space-y-2">
                <div className="text-sm font-medium mb-2 text-slate-800">
                  Changes:
                </div>
                {Object.entries(changes).map(([field, { from, to }]) => (
                  <div
                    key={field}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Badge variant="outline" className="capitalize">
                      {formatFieldName(field)}
                    </Badge>
                    <span className="text-slate-500 line-through">
                      {formatValue(from)}
                    </span>
                    <span className="text-slate-400">&rarr;</span>
                    <span className="font-medium text-green-700">
                      {formatValue(to)}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-slate-500">
                This will immediately update the record in {crmName}. This
                action cannot be undone from RevTrust.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Update in {crmName}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
