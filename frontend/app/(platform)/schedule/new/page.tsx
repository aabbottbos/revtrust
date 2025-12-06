"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save } from "lucide-react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"

interface CRMConnection {
  id: string
  provider: string
  account_name: string
  is_active: boolean
}

export default function NewSchedulePage() {
  const router = useRouter()
  const authenticatedFetch = useAuthenticatedFetch()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState<CRMConnection[]>([])
  const [justConnected, setJustConnected] = useState(false)

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
    detectTimezone()

    // Check if user just returned from connecting a CRM
    const justReturned = sessionStorage.getItem("just_connected_crm")
    if (justReturned === "true") {
      setJustConnected(true)
      sessionStorage.removeItem("just_connected_crm")
      // Auto-fetch connections again after a short delay to ensure backend has saved
      setTimeout(() => {
        fetchConnections()
      }, 500)
    }
  }, [])

  const fetchConnections = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/oauth/connections`)
      const data = await res.json()
      const activeConnections = data.connections.filter((c: CRMConnection) => c.is_active)
      setConnections(activeConnections)

      // Load previously saved connection preference
      const savedConnectionId = localStorage.getItem("preferred_crm_connection")

      if (activeConnections.length > 0) {
        // If we have a saved preference and it still exists, use it
        if (savedConnectionId && activeConnections.find(c => c.id === savedConnectionId)) {
          setConnectionId(savedConnectionId)
        }
        // Otherwise, auto-select if only one connection
        else if (activeConnections.length === 1 && !connectionId) {
          setConnectionId(activeConnections[0].id)
          // Save this as the preference
          localStorage.setItem("preferred_crm_connection", activeConnections[0].id)
        }
      }
    } catch (err) {
      console.error("Error fetching connections:", err)
      // Show error to user
      alert("Failed to load CRM connections. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  const detectTimezone = () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    setTimezone(tz)
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
      alert("Please enter a name")
      return
    }

    if (!connectionId) {
      alert("Please select a CRM connection")
      return
    }

    if (emailEnabled && !emailRecipients.trim()) {
      alert("Please enter email recipients")
      return
    }

    if (slackEnabled && !slackWebhook.trim()) {
      alert("Please enter Slack webhook URL")
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
        crm_connection_id: connectionId,
        schedule: buildCronExpression(),
        timezone,
        delivery_channels: deliveryChannels,
        email_recipients: emailEnabled
          ? emailRecipients.split(",").map(e => e.trim())
          : [],
        slack_webhook_url: slackEnabled ? slackWebhook : null
      }

      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/scheduled-reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      )

      if (res.ok) {
        router.push("/schedule")
      } else {
        const error = await res.json()
        alert(`Error: ${error.detail}`)
      }
    } catch (err) {
      alert("Failed to create schedule")
    } finally {
      setSaving(false)
    }
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

      <h1 className="text-3xl font-bold mb-8">Create Scheduled Review</h1>

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

          {justConnected && connections.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-900">
                ✓ <strong>CRM Connected Successfully!</strong> Your {connections[0]?.provider === "salesforce" ? "Salesforce" : "HubSpot"} account is now connected and ready to use.
              </p>
            </div>
          )}

          {connections.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-600 mb-4">
                No CRM connections found. Please connect a CRM first.
              </p>
              <Button onClick={() => router.push("/crm?returnTo=/schedule/new")}>
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
                  // Save preference for next time
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
                  href="/crm?returnTo=/schedule/new"
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
                Create Schedule
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
