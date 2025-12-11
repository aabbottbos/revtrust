"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save } from "lucide-react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { toast } from "sonner"

interface CRMConnection {
  id: string
  provider: string
  account_name: string
  is_active: boolean
}

export default function EditSchedulePage() {
  const router = useRouter()
  const params = useParams()
  const scheduleId = params.id as string
  const authenticatedFetch = useAuthenticatedFetch()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState<CRMConnection[]>([])

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [connectionId, setConnectionId] = useState("")
  const [frequency, setFrequency] = useState("daily")
  const [hour, setHour] = useState("6")
  const [minute, setMinute] = useState("0")
  const [timezone, setTimezone] = useState("America/New_York")
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [emailRecipients, setEmailRecipients] = useState("")
  const [slackEnabled, setSlackEnabled] = useState(false)
  const [slackWebhook, setSlackWebhook] = useState("")

  useEffect(() => {
    fetchConnections()
    fetchScheduledReview()
  }, [])

  const fetchConnections = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/oauth/connections`)
      const data = await res.json()
      const activeConnections = data.connections.filter((c: CRMConnection) => c.is_active)
      setConnections(activeConnections)
    } catch (err) {
      console.error("Error fetching connections:", err)
      toast.error("Failed to load CRM connections. Please refresh the page.")
    }
  }

  const fetchScheduledReview = async () => {
    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/scheduled-reviews/${scheduleId}`
      )

      if (!res.ok) {
        throw new Error("Failed to load scheduled review")
      }

      const data = await res.json()

      // Populate form with existing data
      setName(data.name || "")
      setDescription(data.description || "")
      setConnectionId(data.crm_connection_id || "")
      setTimezone(data.timezone || "America/New_York")

      // Parse delivery channels
      const deliveryChannels = Array.isArray(data.delivery_channels)
        ? data.delivery_channels
        : typeof data.delivery_channels === "string"
          ? JSON.parse(data.delivery_channels)
          : []

      setEmailEnabled(deliveryChannels.includes("email"))
      setSlackEnabled(deliveryChannels.includes("slack"))

      // Parse email recipients
      if (data.email_recipients && Array.isArray(data.email_recipients)) {
        setEmailRecipients(data.email_recipients.join(", "))
      }

      // Set Slack webhook
      setSlackWebhook(data.slack_webhook_url || "")

      // Parse cron expression to extract frequency and time
      if (data.schedule) {
        parseCronExpression(data.schedule)
      }

    } catch (err) {
      console.error("Error:", err)
      toast.error("Failed to load scheduled review")
      router.push("/schedule")
    } finally {
      setLoading(false)
    }
  }

  const parseCronExpression = (cron: string) => {
    // Parse cron: "minute hour * * dayOfWeek"
    const parts = cron.split(" ")
    if (parts.length >= 5) {
      const [min, hr, , , dayOfWeek] = parts

      setMinute(min)
      setHour(hr)

      // Determine frequency
      if (dayOfWeek === "*") {
        setFrequency("daily")
      } else if (dayOfWeek === "1-5") {
        setFrequency("weekdays")
      } else if (dayOfWeek === "1") {
        setFrequency("monday")
      } else if (dayOfWeek === "1,3,5") {
        setFrequency("mon-wed-fri")
      }
    }
  }

  const buildCronExpression = () => {
    // Build cron from frequency
    switch (frequency) {
      case "daily":
        return `${minute} ${hour} * * *`
      case "weekdays":
        return `${minute} ${hour} * * 1-5`
      case "monday":
        return `${minute} ${hour} * * 1`
      case "mon-wed-fri":
        return `${minute} ${hour} * * 1,3,5`
      default:
        return `${minute} ${hour} * * *`
    }
  }

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      toast.error("Please enter a name")
      return
    }

    if (!connectionId) {
      toast.error("Please select a CRM connection")
      return
    }

    if (emailEnabled && !emailRecipients.trim()) {
      toast.error("Please enter email recipients")
      return
    }

    if (slackEnabled && !slackWebhook.trim()) {
      toast.error("Please enter Slack webhook URL")
      return
    }

    setSaving(true)

    try {
      const deliveryChannels = []
      if (emailEnabled) deliveryChannels.push("email")
      if (slackEnabled) deliveryChannels.push("slack")

      const payload = {
        name,
        description,
        schedule: buildCronExpression(),
        timezone,
        delivery_channels: deliveryChannels,
        email_recipients: emailEnabled
          ? emailRecipients.split(",").map(e => e.trim())
          : [],
        slack_webhook_url: slackEnabled ? slackWebhook : null
      }

      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/scheduled-reviews/${scheduleId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      )

      if (res.ok) {
        toast.success("Schedule updated successfully")
        router.push("/schedule")
      } else {
        const error = await res.json()
        toast.error(`Error: ${error.detail}`)
      }
    } catch (err) {
      toast.error("Failed to update schedule")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-8" />
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <h1 className="text-3xl font-bold mb-8">Edit Scheduled Review</h1>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Review Name *</Label>
              <Input
                id="name"
                placeholder="Weekly Pipeline Review"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Weekly check-in for sales team"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </Card>

        {/* Data Source */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Data Source</h2>

          {connections.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-600 mb-4">
                No CRM connections found. Please connect a CRM first.
              </p>
              <Button onClick={() => router.push("/crm?returnTo=/schedule")}>
                Connect CRM
              </Button>
            </div>
          ) : (
            <div>
              <Label>CRM Connection *</Label>
              <Select
                value={connectionId}
                onValueChange={(value) => {
                  setConnectionId(value)
                  localStorage.setItem("preferred_crm_connection", value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select CRM" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((conn) => (
                    <SelectItem key={conn.id} value={conn.id}>
                      {conn.provider === "salesforce" ? "Salesforce" : "HubSpot"} - {conn.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-600 mt-2">
                Need a different CRM?{" "}
                <a
                  href="/crm?returnTo=/schedule"
                  className="text-blue-600 hover:underline"
                >
                  Manage connections
                </a>
              </p>
            </div>
          )}
        </Card>

        {/* Schedule */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Schedule</h2>

          <div className="space-y-4">
            <div>
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Every Day</SelectItem>
                  <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
                  <SelectItem value="monday">Every Monday</SelectItem>
                  <SelectItem value="mon-wed-fri">Mon, Wed, Fri</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hour</Label>
                <Select value={hour} onValueChange={setHour}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Next run:</strong> {frequency === "daily" ? "Every day" :
                  frequency === "weekdays" ? "Monday-Friday" :
                    frequency === "monday" ? "Every Monday" :
                      "Mon, Wed, Fri"} at {hour}:00 {timezone.split("/")[1]}
              </p>
            </div>
          </div>
        </Card>

        {/* Delivery Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Delivery Settings</h2>

          <div className="space-y-6">
            {/* Email */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  checked={emailEnabled}
                  onCheckedChange={(checked) => setEmailEnabled(!!checked)}
                />
                <Label className="cursor-pointer">Email</Label>
              </div>

              {emailEnabled && (
                <div>
                  <Label htmlFor="emails">Recipients (comma-separated)</Label>
                  <Input
                    id="emails"
                    placeholder="you@company.com, team@company.com"
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Slack */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  checked={slackEnabled}
                  onCheckedChange={(checked) => setSlackEnabled(!!checked)}
                />
                <Label className="cursor-pointer">Slack</Label>
              </div>

              {slackEnabled && (
                <div>
                  <Label htmlFor="slack">Webhook URL</Label>
                  <Input
                    id="slack"
                    placeholder="https://hooks.slack.com/services/..."
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    <a
                      href="https://api.slack.com/messaging/webhooks"
                      target="_blank"
                      className="text-blue-600 hover:underline"
                    >
                      How to get a Slack webhook URL →
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || connections.length === 0}
            className="bg-revtrust-blue"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Schedule
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
