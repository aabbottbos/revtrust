"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react"

interface Violation {
  severity: string
  category: string
  message: string
  field?: string
  remediation_action?: string
  remediation_owner?: string
}

interface DealDetails {
  deal_id: string
  deal_name: string
  violations: Violation[]
  violations_by_category: Record<string, Violation[]>
  critical_count: number
  warning_count: number
  info_count: number
  total_violations: number
}

interface DealDetailModalProps {
  isOpen: boolean
  onClose: () => void
  analysisId: string
  dealId: string | null
}

export function DealDetailModal({
  isOpen,
  onClose,
  analysisId,
  dealId,
}: DealDetailModalProps) {
  const [dealDetails, setDealDetails] = useState<DealDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && dealId) {
      fetchDealDetails()
    }
  }, [isOpen, dealId, analysisId])

  const fetchDealDetails = async () => {
    if (!dealId) return

    try {
      setLoading(true)
      setError(null)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(
        `${apiUrl}/api/analysis/${analysisId}/deals/${encodeURIComponent(dealId)}`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch deal details")
      }

      const data = await response.json()
      setDealDetails(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deal details")
    } finally {
      setLoading(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    const severityLower = severity.toLowerCase()
    if (severityLower === "critical") return AlertCircle
    if (severityLower === "warning") return AlertTriangle
    return Info
  }

  const getSeverityColor = (severity: string) => {
    const severityLower = severity.toLowerCase()
    if (severityLower === "critical") return "text-red-600"
    if (severityLower === "warning") return "text-orange-600"
    return "text-blue-600"
  }

  const getSeverityBadge = (severity: string) => {
    const severityLower = severity.toLowerCase()
    if (severityLower === "critical") {
      return <Badge variant="destructive">Critical</Badge>
    }
    if (severityLower === "warning") {
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600">Warning</Badge>
      )
    }
    return <Badge variant="secondary">Info</Badge>
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {dealDetails?.deal_name || "Loading..."}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="text-center text-red-600 py-8">{error}</div>
        )}

        {dealDetails && !loading && (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {dealDetails.critical_count}
                  </div>
                  <div className="text-xs text-slate-500">Critical</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {dealDetails.warning_count}
                  </div>
                  <div className="text-xs text-slate-500">Warnings</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {dealDetails.info_count}
                  </div>
                  <div className="text-xs text-slate-500">Info</div>
                </Card>
              </div>

              <Separator />

              {/* Violations by Category */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700">
                  Issues by Category
                </h3>

                {Object.entries(dealDetails.violations_by_category).map(
                  ([category, violations]) => (
                    <Card key={category} className="p-4">
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center justify-between">
                        <span>{category.replace(/_/g, " ")}</span>
                        <Badge variant="outline">{violations.length}</Badge>
                      </h4>

                      <div className="space-y-3">
                        {violations.map((violation, idx) => {
                          const SeverityIcon = getSeverityIcon(violation.severity)
                          const severityColor = getSeverityColor(violation.severity)

                          return (
                            <div
                              key={idx}
                              className="border-l-2 border-slate-200 pl-4 py-2"
                            >
                              <div className="flex items-start space-x-2 mb-2">
                                <SeverityIcon
                                  className={`h-4 w-4 mt-0.5 ${severityColor}`}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    {getSeverityBadge(violation.severity)}
                                    {violation.field && (
                                      <span className="text-xs text-slate-500">
                                        Field: {violation.field}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-700">
                                    {violation.message}
                                  </p>
                                </div>
                              </div>

                              {violation.remediation_action && (
                                <div className="mt-2 bg-blue-50 rounded-md p-3">
                                  <div className="text-xs font-semibold text-blue-900 mb-1">
                                    Recommended Action:
                                  </div>
                                  <p className="text-xs text-blue-800">
                                    {violation.remediation_action}
                                  </p>
                                  {violation.remediation_owner && (
                                    <div className="text-xs text-blue-600 mt-1">
                                      Owner: {violation.remediation_owner}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </Card>
                  )
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
