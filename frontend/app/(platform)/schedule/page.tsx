"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Play,
  Pause,
  Settings,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { toast } from "sonner"
import { formatToEST } from "@/lib/utils"

interface ScheduledReview {
  id: string
  name: string
  description: string
  crm_provider: string
  crm_account: string
  schedule: string
  timezone: string
  delivery_channels: string[]
  is_active: boolean
  last_run_at: string | null
  next_run_at: string | null
  created_at: string
}

export default function SchedulePage() {
  const router = useRouter()
  const authenticatedFetch = useAuthenticatedFetch()
  const [schedules, setSchedules] = useState<ScheduledReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchSchedules()

    // Cleanup polling interval on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const fetchSchedules = async () => {
    try {
      setError(null)
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scheduled-reviews`)

      if (!res.ok) {
        throw new Error(`Failed to load schedules: ${res.statusText}`)
      }

      const data = await res.json()
      setSchedules(data.scheduled_reviews)
    } catch (err) {
      console.error("Error:", err)
      setError(err instanceof Error ? err.message : "Failed to load schedules")
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (scheduleId: string, isActive: boolean) => {
    try {
      await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/scheduled-reviews/${scheduleId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !isActive })
        }
      )
      fetchSchedules()
      toast.success(isActive ? "Schedule paused" : "Schedule activated")
    } catch (err) {
      toast.error("Failed to update schedule")
    }
  }

  const runNow = async (scheduleId: string) => {
    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/scheduled-reviews/${scheduleId}/run-now`,
        { method: "POST" }
      )

      if (res.ok) {
        toast.success("Review started! The schedule will refresh automatically when complete.")

        // Clear any existing polling interval
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
        }

        // Poll for updates every 5 seconds for up to 2 minutes
        let pollCount = 0
        const maxPolls = 24 // 2 minutes (24 * 5 seconds)

        pollIntervalRef.current = setInterval(async () => {
          pollCount++
          await fetchSchedules()

          // Stop polling after max time
          if (pollCount >= maxPolls && pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
        }, 5000)
      } else {
        toast.error("Failed to start review")
      }
    } catch (err) {
      toast.error("Failed to start review")
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm("Delete this scheduled review?")) return

    try {
      await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/scheduled-reviews/${scheduleId}`,
        { method: "DELETE" }
      )
      fetchSchedules()
      toast.success("Schedule deleted")
    } catch (err) {
      toast.error("Failed to delete")
    }
  }

  const formatSchedule = (cron: string) => {
    // Simple cron formatter
    const parts = cron.split(" ")
    const [min, hour, day, month, dayOfWeek] = parts

    if (dayOfWeek === "*") return `Every day at ${hour}:${min.padStart(2, '0')}`
    if (dayOfWeek === "1") return `Every Monday at ${hour}:${min.padStart(2, '0')}`
    if (dayOfWeek === "1,3,5") return `Mon/Wed/Fri at ${hour}:${min.padStart(2, '0')}`

    return cron
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setLoading(true)
                fetchSchedules()
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Scheduled Reviews</h1>
          <p className="text-slate-600">
            Automate your pipeline reviews with fresh data from your CRM
          </p>
        </div>
        <Button
          onClick={() => router.push("/schedule/new")}
          className="bg-revtrust-blue"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Schedule
        </Button>
      </div>

      {/* Empty State */}
      {schedules.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">No Scheduled Reviews Yet</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Set up your first scheduled review to automatically receive pipeline
            insights in your email or Slack.
          </p>
          <Button
            onClick={() => router.push("/schedule/new")}
            className="bg-revtrust-blue"
          >
            Create First Schedule
          </Button>
        </Card>
      )}

      {/* Schedule List */}
      {schedules.length > 0 && (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="p-6">
              <div className="flex items-start justify-between">
                {/* Left: Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{schedule.name}</h3>
                    {schedule.is_active ? (
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    ) : (
                      <Badge className="bg-slate-200 text-slate-700">Paused</Badge>
                    )}
                  </div>

                  {schedule.description && (
                    <p className="text-slate-600 text-sm mb-3">
                      {schedule.description}
                    </p>
                  )}

                  <div className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {/* CRM */}
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        {schedule.crm_provider === "salesforce" ? "Salesforce" : "HubSpot"}
                        ({schedule.crm_account})
                      </span>
                    </div>

                    {/* Schedule */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        {formatSchedule(schedule.schedule)}
                      </span>
                    </div>

                    {/* Delivery */}
                    <div className="flex items-center gap-2">
                      {schedule.delivery_channels.includes("email") && (
                        <Mail className="w-4 h-4 text-slate-400" />
                      )}
                      {schedule.delivery_channels.includes("slack") && (
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-slate-600">
                        {schedule.delivery_channels.length === 0
                          ? "No delivery"
                          : schedule.delivery_channels.join(", ")}
                      </span>
                    </div>

                    {/* Next Run */}
                    {schedule.next_run_at && formatToEST(schedule.next_run_at) && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">
                          Next: {formatToEST(schedule.next_run_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runNow(schedule.id)}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Run Now
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(schedule.id, schedule.is_active)}
                  >
                    {schedule.is_active ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/schedule/${schedule.id}/edit`)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteSchedule(schedule.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              {/* Last Run */}
              {schedule.last_run_at && formatToEST(schedule.last_run_at) && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/schedule/${schedule.id}/history`)}
                  >
                    Last run: {formatToEST(schedule.last_run_at)}
                    <span className="ml-2">→</span>
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
