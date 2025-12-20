"use client"

/**
 * Modal showing detailed pipeline data for a team member
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlertCircle, AlertTriangle, TrendingUp, TrendingDown, FileText, Calendar } from "lucide-react"
import { useMemberPipeline } from "@/hooks/useOrganization"
import { format } from "date-fns"

interface MemberDrilldownProps {
  orgId: string
  userId: string
  open: boolean
  onClose: () => void
}

export function MemberDrilldown({ orgId, userId, open, onClose }: MemberDrilldownProps) {
  const { data, loading, error } = useMemberPipeline(orgId, userId)

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getHealthBg = (score: number) => {
    if (score >= 80) return "bg-green-50"
    if (score >= 60) return "bg-yellow-50"
    return "bg-red-50"
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return "$0"
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pipeline Details</DialogTitle>
          <DialogDescription>View detailed pipeline health and history</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Member Info */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg bg-slate-200">
                  {getInitials(data.member.name, data.member.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-lg">
                  {data.member.name || data.member.email.split("@")[0]}
                </div>
                <div className="text-sm text-slate-500">{data.member.email}</div>
                <Badge variant="secondary" className="mt-1 capitalize">
                  {data.member.role}
                </Badge>
              </div>
            </div>

            {/* Current Analysis */}
            {data.currentAnalysis ? (
              <Card className={getHealthBg(data.currentAnalysis.healthScore)}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Current Pipeline</span>
                    <span className={`text-2xl font-bold ${getHealthColor(data.currentAnalysis.healthScore)}`}>
                      {data.currentAnalysis.healthScore.toFixed(0)}%
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-slate-500">Total Deals</div>
                      <div className="text-xl font-semibold">{data.currentAnalysis.totalDeals}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Pipeline Value</div>
                      <div className="text-xl font-semibold">
                        {formatCurrency(data.currentAnalysis.totalAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        Critical Issues
                      </div>
                      <div className="text-xl font-semibold text-red-600">
                        {data.currentAnalysis.totalCritical}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        Warnings
                      </div>
                      <div className="text-xl font-semibold text-yellow-600">
                        {data.currentAnalysis.totalWarnings}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs text-slate-500">
                    <FileText className="h-3 w-3" />
                    <span>{data.currentAnalysis.fileName}</span>
                    <span className="mx-2">•</span>
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(data.currentAnalysis.createdAt), "MMM d, yyyy h:mm a")}</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No pipeline data available</p>
                  <p className="text-sm">This member hasn't uploaded any pipeline files yet.</p>
                </CardContent>
              </Card>
            )}

            {/* Analysis History */}
            {data.analysisHistory && data.analysisHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.analysisHistory.map((analysis, index) => {
                      const prevAnalysis = data.analysisHistory[index + 1]
                      const change = prevAnalysis
                        ? analysis.healthScore - prevAnalysis.healthScore
                        : null

                      return (
                        <div
                          key={analysis.id}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-xs text-slate-500 w-24">
                              {format(new Date(analysis.createdAt), "MMM d, yyyy")}
                            </div>
                            <div className="text-sm">{analysis.fileName}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${getHealthColor(analysis.healthScore)}`}
                            >
                              {analysis.healthScore.toFixed(0)}%
                            </span>
                            {change !== null && (
                              <span
                                className={`flex items-center text-xs ${
                                  change >= 0 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {change >= 0 ? (
                                  <TrendingUp className="h-3 w-3 mr-0.5" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-0.5" />
                                )}
                                {change >= 0 ? "+" : ""}
                                {change.toFixed(1)}
                              </span>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {analysis.totalDeals} deals
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
