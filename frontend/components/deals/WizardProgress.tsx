"use client"

/**
 * Progress indicator for deal review wizard
 */

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface WizardProgressProps {
  current: number
  total: number
  updatedIndices: Set<number>
}

export function WizardProgress({
  current,
  total,
  updatedIndices,
}: WizardProgressProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Text indicator */}
      <div className="text-sm font-medium">
        Deal <span className="text-revtrust-blue">{current + 1}</span> of{" "}
        {total}
      </div>

      {/* Visual progress dots (for smaller lists) */}
      {total <= 12 && (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all flex items-center justify-center",
                idx === current
                  ? "bg-revtrust-blue scale-125"
                  : updatedIndices.has(idx)
                    ? "bg-green-500"
                    : "bg-slate-300"
              )}
            >
              {updatedIndices.has(idx) && idx !== current && (
                <Check className="h-2 w-2 text-white" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress bar (for larger lists) */}
      {total > 12 && (
        <div className="flex-1 max-w-xs">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-revtrust-blue transition-all"
              style={{ width: `${((current + 1) / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Updated count */}
      {updatedIndices.size > 0 && (
        <div className="text-sm text-green-600">
          {updatedIndices.size} updated
        </div>
      )}
    </div>
  )
}
