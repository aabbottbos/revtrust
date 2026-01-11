"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Database,
  Mail,
  MessageSquare,
  CreditCard,
  User,
  Loader2,
  Check,
  X,
  RefreshCw,
  Plus,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  AlertCircle
} from "lucide-react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { toast } from "sonner"

interface CRMConnection {
  id: string
  provider: string
  account_name: string
  is_active: boolean
  last_sync_at: string | null
  created_at: string
}

interface UserSubscription {
  tier: string
  status: string
  hasAIAccess: boolean
  hasCRMWrite: boolean
  hasTeamFeatures: boolean
  hasScheduledReviews: boolean
  stripeCustomerId: string | null
  hasActiveSubscription: boolean
}

interface DeliverySettings {
  defaultEmailRecipients: string[]
  slackWebhookUrl: string | null
  slackEnabled: boolean
  emailEnabled: boolean
}

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const authenticatedFetch = useAuthenticatedFetch()

  const defaultTab = searchParams.get("tab") || "crm"

  // CRM state
  const [connections, setConnections] = useState<CRMConnection[]>([])
  const [loadingConnections, setLoadingConnections] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)

  // Delivery state
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({
    defaultEmailRecipients: [],
    slackWebhookUrl: null,
    slackEnabled: false,
    emailEnabled: true
  })
  const [loadingDelivery, setLoadingDelivery] = useState(true)
  const [savingDelivery, setSavingDelivery] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [slackWebhookInput, setSlackWebhookInput] = useState("")

  // Subscription state
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(true)
  const [creatingPortal, setCreatingPortal] = useState(false)

  const isPaidUser = subscription?.tier && ["pro", "team", "enterprise"].includes(subscription.tier)

  useEffect(() => {
    fetchConnections()
    fetchDeliverySettings()
    fetchSubscription()
  }, [])

  // CRM Functions
  const fetchConnections = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/oauth/connections`)
      const data = await res.json()
      setConnections(data.connections || [])
    } catch (err) {
      console.error("Error fetching connections:", err)
    } finally {
      setLoadingConnections(false)
    }
  }

  const connectSalesforce = async () => {
    setConnecting("salesforce")
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/oauth/salesforce/authorize`)
      const data = await res.json()
      window.location.href = data.authorization_url
    } catch (err) {
      console.error("Error:", err)
      toast.error("Failed to initiate Salesforce connection")
      setConnecting(null)
    }
  }

  const connectHubSpot = async () => {
    setConnecting("hubspot")
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/oauth/hubspot/authorize`)
      const data = await res.json()
      window.location.href = data.authorization_url
    } catch (err) {
      console.error("Error:", err)
      toast.error("Failed to initiate HubSpot connection")
      setConnecting(null)
    }
  }

  const testConnection = async (connectionId: string) => {
    setTestingConnection(connectionId)
    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/oauth/connections/${connectionId}/test`,
        { method: "POST" }
      )
      const data = await res.json()

      if (data.status === "success") {
        toast.success("Connection test successful!")
        fetchConnections()
      } else {
        toast.error("Connection test failed")
      }
    } catch (err) {
      toast.error("Connection test failed")
    } finally {
      setTestingConnection(null)
    }
  }

  const deleteConnection = async (connectionId: string) => {
    if (!confirm("Are you sure you want to disconnect this CRM?")) return

    try {
      await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/oauth/connections/${connectionId}`,
        { method: "DELETE" }
      )
      fetchConnections()
      toast.success("CRM disconnected")
    } catch (err) {
      toast.error("Failed to disconnect CRM")
    }
  }

  // Delivery Functions
  const fetchDeliverySettings = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/delivery`)
      if (res.ok) {
        const data = await res.json()
        setDeliverySettings(data)
        setEmailInput(data.defaultEmailRecipients?.join(", ") || "")
        setSlackWebhookInput(data.slackWebhookUrl || "")
      }
    } catch (err) {
      console.error("Error fetching delivery settings:", err)
    } finally {
      setLoadingDelivery(false)
    }
  }

  const saveDeliverySettings = async () => {
    setSavingDelivery(true)
    try {
      const emails = emailInput
        .split(",")
        .map(e => e.trim())
        .filter(e => e.length > 0)

      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/settings/delivery`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            defaultEmailRecipients: emails,
            slackWebhookUrl: slackWebhookInput || null,
            slackEnabled: !!slackWebhookInput,
            emailEnabled: emails.length > 0
          })
        }
      )

      if (res.ok) {
        toast.success("Delivery settings saved")
        fetchDeliverySettings()
      } else {
        toast.error("Failed to save settings")
      }
    } catch (err) {
      toast.error("Failed to save settings")
    } finally {
      setSavingDelivery(false)
    }
  }

  // Subscription Functions
  const fetchSubscription = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/subscription`)
      if (res.ok) {
        const data = await res.json()
        setSubscription(data)
      }
    } catch (err) {
      console.error("Error fetching subscription:", err)
    } finally {
      setLoadingSubscription(false)
    }
  }

  const openCustomerPortal = async () => {
    setCreatingPortal(true)
    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stripe/create-portal-session`,
        { method: "POST" }
      )
      if (res.ok) {
        const data = await res.json()
        window.location.href = data.url
      } else {
        toast.error("Failed to open billing portal")
      }
    } catch (err) {
      toast.error("Failed to open billing portal")
    } finally {
      setCreatingPortal(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-600">
          Manage your CRM connections, delivery options, and subscription
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="crm" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">CRM</span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Delivery</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Plan</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>

        {/* CRM Tab */}
        <TabsContent value="crm" className="space-y-6">
          {/* Connected CRMs */}
          <Card>
            <CardHeader>
              <CardTitle>Connected CRMs</CardTitle>
              <CardDescription>
                Manage your connected CRM integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingConnections ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : connections.length > 0 ? (
                <div className="space-y-4">
                  {connections.map((conn) => (
                    <div key={conn.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
                          conn.provider === "salesforce"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                        }`}>
                          {conn.provider === "salesforce" ? "SF" : "HS"}
                        </div>
                        <div>
                          <div className="font-semibold">{conn.account_name}</div>
                          <div className="text-sm text-slate-600 capitalize">{conn.provider}</div>
                          {conn.last_sync_at && (
                            <div className="text-xs text-slate-500">
                              Last sync: {new Date(conn.last_sync_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {conn.is_active ? (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">Inactive</Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testConnection(conn.id)}
                          disabled={testingConnection === conn.id}
                        >
                          {testingConnection === conn.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Test
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteConnection(conn.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No CRMs connected yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connect New CRM */}
          <Card>
            <CardHeader>
              <CardTitle>Connect New CRM</CardTitle>
              <CardDescription>
                Add a new CRM integration to pull live pipeline data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl font-bold text-blue-700">
                      SF
                    </div>
                    <div>
                      <div className="font-semibold">Salesforce</div>
                      <div className="text-sm text-slate-600">
                        Connect via OAuth
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={connectSalesforce}
                    disabled={connecting === "salesforce"}
                    className="w-full"
                  >
                    {connecting === "salesforce" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Connect Salesforce
                      </>
                    )}
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-xl font-bold text-orange-700">
                      HS
                    </div>
                    <div>
                      <div className="font-semibold">HubSpot</div>
                      <div className="text-sm text-slate-600">
                        Connect via OAuth
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={connectHubSpot}
                    disabled={connecting === "hubspot"}
                    className="w-full"
                  >
                    {connecting === "hubspot" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Connect HubSpot
                      </>
                    )}
                  </Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Delivery
              </CardTitle>
              <CardDescription>
                Configure default email recipients for scheduled reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emails">Default Email Recipients</Label>
                <Input
                  id="emails"
                  type="text"
                  placeholder="email1@example.com, email2@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Separate multiple emails with commas
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Slack Integration
              </CardTitle>
              <CardDescription>
                Send scheduled reports to a Slack channel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slack">Slack Webhook URL</Label>
                <Input
                  id="slack"
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackWebhookInput}
                  onChange={(e) => setSlackWebhookInput(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Create a webhook in your Slack workspace settings
                </p>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={saveDeliverySettings}
            disabled={savingDelivery}
            className="w-full"
          >
            {savingDelivery ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Delivery Settings
              </>
            )}
          </Button>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Your subscription status and features
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubscription ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border">
                    <div>
                      <div className="text-sm text-slate-500">Plan</div>
                      <div className="text-2xl font-bold capitalize">
                        {subscription?.tier || "Free"}
                      </div>
                    </div>
                    <Badge className={isPaidUser ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}>
                      {subscription?.status || "Active"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-slate-50 border">
                      <div className="flex items-center gap-2 mb-2">
                        {subscription?.hasAIAccess ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-slate-400" />
                        )}
                        <span className="text-sm font-medium">AI Insights</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Deal scoring & recommendations
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-50 border">
                      <div className="flex items-center gap-2 mb-2">
                        {subscription?.hasScheduledReviews ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-slate-400" />
                        )}
                        <span className="text-sm font-medium">Scheduled Reviews</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Automated pipeline analysis
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-50 border">
                      <div className="flex items-center gap-2 mb-2">
                        {subscription?.hasCRMWrite ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-slate-400" />
                        )}
                        <span className="text-sm font-medium">CRM Write-back</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Update deals in your CRM
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-50 border">
                      <div className="flex items-center gap-2 mb-2">
                        {subscription?.hasTeamFeatures ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-slate-400" />
                        )}
                        <span className="text-sm font-medium">Team Features</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Rollups & leaderboards
                      </p>
                    </div>
                  </div>

                  {isPaidUser ? (
                    <Button
                      variant="outline"
                      onClick={openCustomerPortal}
                      disabled={creatingPortal}
                      className="w-full"
                    >
                      {creatingPortal ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4 mr-2" />
                      )}
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button
                      onClick={() => router.push("/pricing")}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your profile and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700">
                  {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <div className="font-semibold text-lg">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-slate-600">
                    {user?.emailAddresses[0]?.emailAddress}
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  To update your profile information, please use the Clerk account management.
                </AlertDescription>
              </Alert>

              <Button
                variant="outline"
                onClick={() => {
                  // Open Clerk user profile
                  const userButton = document.querySelector('[data-clerk-user-button]') as HTMLElement
                  userButton?.click()
                }}
                className="w-full"
              >
                <User className="w-4 h-4 mr-2" />
                Manage Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
