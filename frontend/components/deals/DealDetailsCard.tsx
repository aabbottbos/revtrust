"use client"

/**
 * Displays deal details in a card format with issue highlighting
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Calendar,
  DollarSign,
  User,
  Clock,
  Target,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Deal {
  id: string
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
}

interface DealDetailsCardProps {
  deal: Deal
  highlightFields?: string[] // Fields with issues to highlight
}

export function DealDetailsCard({ deal, highlightFields = [] }: DealDetailsCardProps) {
  const isFieldHighlighted = (field: string) => highlightFields.includes(field)

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "Not set"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "Not set"
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const isDatePast = (dateStr: string | undefined) => {
    if (!dateStr) return false
    try {
      return new Date(dateStr) < new Date()
    } catch {
      return false
    }
  }

  const DetailRow = ({
    icon: Icon,
    label,
    value,
    field,
    valueClassName,
  }: {
    icon: React.ElementType
    label: string
    value: string | number | undefined
    field?: string
    valueClassName?: string
  }) => {
    const highlighted = field && isFieldHighlighted(field)

    return (
      <div
        className={cn(
          "flex items-center gap-3 py-2",
          highlighted && "bg-red-50 -mx-3 px-3 rounded"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 flex-shrink-0",
            highlighted ? "text-red-500" : "text-slate-400"
          )}
        />
        <span
          className={cn(
            "text-sm",
            highlighted ? "text-red-600" : "text-slate-500"
          )}
        >
          {label}:
        </span>
        <span
          className={cn(
            "text-sm font-medium",
            highlighted ? "text-red-700 font-bold" : "",
            valueClassName
          )}
        >
          {value || <span className="text-slate-400 italic">Not set</span>}
        </span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{deal.name}</CardTitle>
            {deal.account_name && (
              <div className="flex items-center gap-2 mt-1 text-slate-500">
                <Building2 className="h-4 w-4" />
                <span>{deal.account_name}</span>
              </div>
            )}
          </div>
          {deal.stage && (
            <Badge variant="outline" className="text-sm">
              {deal.stage}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <DetailRow
          icon={DollarSign}
          label="Amount"
          value={formatCurrency(deal.amount)}
          field="amount"
        />
        <DetailRow
          icon={Calendar}
          label="Close Date"
          value={formatDate(deal.close_date)}
          field="close_date"
          valueClassName={
            isDatePast(deal.close_date) ? "text-red-600" : undefined
          }
        />
        <DetailRow
          icon={Target}
          label="Probability"
          value={deal.probability ? `${deal.probability}%` : undefined}
          field="probability"
        />
        <DetailRow icon={User} label="Owner" value={deal.owner_name} />
        <DetailRow
          icon={FileText}
          label="Next Step"
          value={deal.next_step}
          field="next_step"
        />
        <DetailRow
          icon={Clock}
          label="Last Activity"
          value={formatDate(deal.last_activity_date)}
          field="last_activity_date"
        />
      </CardContent>
    </Card>
  )
}
