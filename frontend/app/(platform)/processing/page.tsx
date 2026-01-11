"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"

interface ProcessingStep {
  id: string
  label: string
  completed: boolean
}

function ProcessingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const analysisId = searchParams.get("id")
  const authenticatedFetch = useAuthenticatedFetch()

  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("Starting analysis...")
  const [status, setStatus] = useState<"pending" | "processing" | "completed" | "failed">("pending")

  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: "hygiene", label: "Deal hygiene", completed: false },
    { id: "next_steps", label: "Next steps", completed: false },
    { id: "stage", label: "Stage accuracy", completed: false },
    { id: "activity", label: "Activity freshness", completed: false },
    { id: "close_date", label: "Close date realism", completed: false },
    { id: "forecast", label: "Forecast risk signal", completed: false },
  ])

  useEffect(() => {
    if (!analysisId) {
      router.push("/scan")
      return
    }

    // Poll for status updates
    const pollInterval = setInterval(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        const response = await authenticatedFetch(
          `${apiUrl}/api/analysis/${analysisId}/status`
        )

        if (!response.ok) {
          throw new Error("Failed to fetch status")
        }

        const data = await response.json()

        setStatus(data.status)
        setProgress(data.progress || 0)
        setCurrentStep(data.current_step || "Processing...")

        // Update completed steps based on progress
        const completedCount = Math.floor((data.progress / 100) * steps.length)
        setSteps(prevSteps =>
          prevSteps.map((step, index) => ({
            ...step,
            completed: index < completedCount,
          }))
        )

        // Redirect when complete
        if (data.status === "completed") {
          clearInterval(pollInterval)
          setTimeout(() => {
            router.push(`/results/${analysisId}`)
          }, 1000) // Small delay to show completion
        }

        // Handle failure
        if (data.status === "failed") {
          clearInterval(pollInterval)
          console.error("Analysis failed:", data.error)
          // Could redirect to error page or show error
        }

      } catch (error) {
        console.error("Error polling status:", error)
      }
    }, 500) // Poll every 500ms

    return () => clearInterval(pollInterval)
  }, [analysisId, router, steps.length])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-2xl mx-auto px-4">
        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-12 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            </div>

            <h1 className="text-3xl font-bold text-slate-900">
              Analyzing pipeline
              <span className="animate-pulse">...</span>
            </h1>

            <p className="text-slate-600">
              We&apos;re processing your file to pinpoint critical issues and opportunities.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-slate-500 text-center">
              {progress}% complete
            </p>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                  step.completed
                    ? "bg-green-50 border border-green-200"
                    : "bg-slate-50 border border-slate-200"
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 animate-in zoom-in duration-300" />
                ) : (
                  <div className="h-5 w-5 border-2 border-slate-300 rounded-full flex-shrink-0" />
                )}
                <span
                  className={`text-sm font-medium ${
                    step.completed ? "text-green-900" : "text-slate-600"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Current Step */}
          <div className="text-center">
            <p className="text-sm text-slate-500 italic">
              {currentStep}
            </p>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-400">
              This may take a few moments depending on file size.
            </p>
          </div>
        </div>

        {/* Unlock AI Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-slate-200">
            <h3 className="text-xl font-semibold mb-2 text-center">
              Unlock the AI Upgrade
            </h3>
            <p className="text-slate-600 text-sm mb-4 text-center">
              Move beyond basic diagnostics with RevTrust AI, offering predictive
              insights and intelligent recommendations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold text-sm mb-1">Supercharge Your Forecast</h4>
                <p className="text-xs text-slate-600">
                  AI predicts deal risk and expected value
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Nail Your Next Step</h4>
                <p className="text-xs text-slate-600">
                  AI suggests best actions to move deals forward
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Ace Your Pipeline Review</h4>
                <p className="text-xs text-slate-600">
                  AI surfaces top 3 deals at risk
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  )
}
