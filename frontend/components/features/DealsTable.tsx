"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DealCard } from "./DealCard"
import { DealDetailModal } from "./DealDetailModal"
import { Loader2 } from "lucide-react"

interface Deal {
  deal_id: string
  deal_name: string
  violation_count: number
  critical_count: number
  warning_count: number
  info_count: number
  overall_severity: "critical" | "warning" | "info"
}

interface DealsTableProps {
  analysisId: string
  totalDealsWithIssues: number
}

export function DealsTable({
  analysisId,
  totalDealsWithIssues,
}: DealsTableProps) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSeverity, setSelectedSeverity] = useState<
    "all" | "critical" | "warning" | "info"
  >("all")
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchDeals(selectedSeverity)
  }, [analysisId, selectedSeverity])

  const fetchDeals = async (severity: "all" | "critical" | "warning" | "info") => {
    try {
      setLoading(true)
      setError(null)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(
        `${apiUrl}/api/analysis/${analysisId}/deals?severity=${severity}`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch deals")
      }

      const data = await response.json()
      setDeals(data.deals || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deals")
    } finally {
      setLoading(false)
    }
  }

  const handleDealClick = (dealId: string) => {
    setSelectedDealId(dealId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDealId(null)
  }

  const handleTabChange = (value: string) => {
    setSelectedSeverity(value as "all" | "critical" | "warning" | "info")
  }

  // Count deals by severity for tab badges
  const criticalCount = deals.filter(
    (d) => d.overall_severity === "critical"
  ).length
  const warningCount = deals.filter(
    (d) => d.overall_severity === "warning"
  ).length
  const infoCount = deals.filter((d) => d.overall_severity === "info").length

  return (
    <>
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Deals Requiring Attention
          </h2>
          <p className="text-sm text-slate-500">
            {totalDealsWithIssues} deal{totalDealsWithIssues !== 1 ? "s" : ""}{" "}
            with issues found
          </p>
        </div>

        <Tabs
          value={selectedSeverity}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">
              All ({deals.length})
            </TabsTrigger>
            <TabsTrigger value="critical" className="text-red-600">
              Critical ({criticalCount})
            </TabsTrigger>
            <TabsTrigger value="warning" className="text-orange-600">
              Warning ({warningCount})
            </TabsTrigger>
            <TabsTrigger value="info" className="text-blue-600">
              Info ({infoCount})
            </TabsTrigger>
          </TabsList>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {error && (
            <div className="text-center text-red-600 py-8">{error}</div>
          )}

          {!loading && !error && deals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">
                No deals found with {selectedSeverity === "all" ? "any" : selectedSeverity} severity
              </p>
            </div>
          )}

          {!loading && !error && deals.length > 0 && (
            <TabsContent value={selectedSeverity} className="space-y-3 mt-0">
              {deals.map((deal) => (
                <DealCard
                  key={deal.deal_id}
                  deal={deal}
                  onClick={() => handleDealClick(deal.deal_id)}
                />
              ))}
            </TabsContent>
          )}
        </Tabs>
      </Card>

      <DealDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        analysisId={analysisId}
        dealId={selectedDealId}
      />
    </>
  )
}
