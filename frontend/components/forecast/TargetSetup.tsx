"use client"

/**
 * Component for setting quarterly target
 */

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Target, Loader2, Check, Edit2 } from "lucide-react"
import { QuarterlyTarget, formatQuarterLabel } from "@/hooks/useForecast"

interface TargetSetupProps {
  target: QuarterlyTarget | null
  quarter: number
  year: number
  onSave: (amount: number) => Promise<boolean>
  saving?: boolean
}

export function TargetSetup({ target, quarter, year, onSave, saving }: TargetSetupProps) {
  const [editing, setEditing] = useState(!target)
  const [amount, setAmount] = useState(target?.target_amount?.toString() || "")
  const [localSaving, setLocalSaving] = useState(false)

  const handleSave = async () => {
    const numAmount = parseFloat(amount.replace(/[^0-9.]/g, ""))
    if (isNaN(numAmount) || numAmount <= 0) return

    setLocalSaving(true)
    const success = await onSave(numAmount)
    setLocalSaving(false)

    if (success) {
      setEditing(false)
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const isSaving = saving || localSaving

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Quarterly Target</CardTitle>
          </div>
          <Badge variant="secondary">{formatQuarterLabel(quarter, year)}</Badge>
        </div>
        <CardDescription>
          {target
            ? `Set by ${target.set_by_role === "self" ? "you" : target.set_by_role}`
            : "Set your target to track progress"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target">Target Amount ($)</Label>
              <div className="flex gap-2">
                <Input
                  id="target"
                  type="text"
                  placeholder="e.g., 500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSave} disabled={isSaving || !amount}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {target ? formatCurrency(target.target_amount) : "$0"}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Quarterly target
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
