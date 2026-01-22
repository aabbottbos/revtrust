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
  AlertCircle,
  Target,
  UserCircle,
  TrendingUp,
  MapPin,
  Package,
  Settings
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

// Helper component to display saved value with clear button
function SavedValueDisplay({
  value,
  onClear,
  getDisplayText
}: {
  value: string
  onClear: () => void
  getDisplayText: (val: string) => string
}) {
  if (!value) return null

  return (
    <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
      <div className="flex-1 text-sm text-blue-900">
        <span className="font-medium">Current: </span>
        {getDisplayText(value)}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="h-6 w-6 p-0 hover:bg-blue-100"
      >
        <X className="h-4 w-4 text-blue-600" />
      </Button>
    </div>
  )
}

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const authenticatedFetch = useAuthenticatedFetch()

  const defaultTab = searchParams.get("tab") || "profile"

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

  // Profile state
  const [profileData, setProfileData] = useState({
    role: "",
    sellingMotion: "",
    yearsInSales: "",
    salesMethodology: "",
    typicalSalesCycle: "",
    typicalDealSize: "",
  })
  const [savedProfileData, setSavedProfileData] = useState({
    role: "",
    sellingMotion: "",
    yearsInSales: "",
    salesMethodology: "",
    typicalSalesCycle: "",
    typicalDealSize: "",
  })
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)

  // Performance state
  const [revenueTargets, setRevenueTargets] = useState<any[]>([])
  const [loadingTargets, setLoadingTargets] = useState(true)
  const [newTarget, setNewTarget] = useState({
    year: new Date().getFullYear(),
    quarter: Math.floor(new Date().getMonth() / 3) + 1,
    target: "",
  })
  const [savingTarget, setSavingTarget] = useState(false)

  // Territory state
  const [territoryData, setTerritoryData] = useState({
    territory: "",
    industry: "",
    marketMaturity: "",
    competition: "",
  })
  const [savedTerritoryData, setSavedTerritoryData] = useState({
    territory: "",
    industry: "",
    marketMaturity: "",
    competition: "",
  })
  const [loadingTerritory, setLoadingTerritory] = useState(true)
  const [savingTerritory, setSavingTerritory] = useState(false)

  // Products state
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [newProduct, setNewProduct] = useState({
    name: "",
    typicalCycle: "",
    priceRange: "",
  })
  const [savingProduct, setSavingProduct] = useState(false)

  // Preferences state
  const [preferencesData, setPreferencesData] = useState({
    coachingStyle: "",
    notificationFrequency: "",
    riskTolerance: "",
    communicationTone: "",
  })
  const [savedPreferencesData, setSavedPreferencesData] = useState({
    coachingStyle: "",
    notificationFrequency: "",
    riskTolerance: "",
    communicationTone: "",
  })
  const [loadingPreferences, setLoadingPreferences] = useState(true)
  const [savingPreferences, setSavingPreferences] = useState(false)

  const isPaidUser = subscription?.tier && ["pro", "team", "enterprise"].includes(subscription.tier)

  // Helper functions for display text
  const getRoleDisplayText = (value: string) => {
    const map: Record<string, string> = {
      ic: "Individual Contributor (AE/SDR)",
      manager: "Sales Manager",
      director: "Director of Sales",
      vp: "VP of Sales",
      c_level: "C-Level (CRO/CEO)"
    }
    return map[value] || value
  }

  const getSellingMotionDisplayText = (value: string) => {
    const map: Record<string, string> = {
      hunter: "Hunter (New Logos)",
      farmer: "Farmer (Account Management)",
      hybrid: "Hybrid (Both)"
    }
    return map[value] || value
  }

  const getYearsDisplayText = (value: string) => {
    const map: Record<string, string> = {
      "<1": "Less than 1 year",
      "1-3": "1-3 years",
      "3-5": "3-5 years",
      "5-10": "5-10 years",
      "10+": "10+ years"
    }
    return map[value] || value
  }

  const getMethodologyDisplayText = (value: string) => {
    const map: Record<string, string> = {
      meddic: "MEDDIC",
      bant: "BANT",
      sandler: "Sandler",
      solution_selling: "Solution Selling",
      challenger: "Challenger Sale",
      custom: "Custom/Proprietary",
      none: "No formal methodology"
    }
    return map[value] || value
  }

  const getCycleDisplayText = (value: string) => {
    const map: Record<string, string> = {
      "<30": "Less than 30 days",
      "30-60": "30-60 days",
      "60-90": "60-90 days",
      "90-180": "90-180 days",
      "180+": "180+ days"
    }
    return map[value] || value
  }

  const getDealSizeDisplayText = (value: string) => {
    const map: Record<string, string> = {
      "<10k": "Less than $10K",
      "10k-50k": "$10K - $50K",
      "50k-100k": "$50K - $100K",
      "100k-500k": "$100K - $500K",
      "500k+": "$500K+"
    }
    return map[value] || value
  }

  // Territory helper functions
  const getMarketMaturityDisplayText = (value: string) => {
    const map: Record<string, string> = {
      greenfield: "Greenfield",
      growing: "Growing",
      mature: "Mature",
      declining: "Declining"
    }
    return map[value] || value
  }

  // Products helper functions
  const getProductCycleDisplayText = (value: string) => {
    return getCycleDisplayText(value) // Reuse cycle display text
  }

  const getProductPriceDisplayText = (value: string) => {
    return getDealSizeDisplayText(value) // Reuse deal size display text
  }

  // Preferences helper functions
  const getCoachingStyleDisplayText = (value: string) => {
    const map: Record<string, string> = {
      aggressive: "Aggressive",
      balanced: "Balanced",
      conservative: "Conservative"
    }
    return map[value] || value
  }

  const getNotificationFrequencyDisplayText = (value: string) => {
    const map: Record<string, string> = {
      realtime: "Real-time",
      daily: "Daily Digest",
      weekly: "Weekly Summary"
    }
    return map[value] || value
  }

  const getRiskToleranceDisplayText = (value: string) => {
    const map: Record<string, string> = {
      show_all: "Show Everything",
      critical_only: "Critical Only",
      balanced: "Balanced"
    }
    return map[value] || value
  }

  const getCommunicationToneDisplayText = (value: string) => {
    const map: Record<string, string> = {
      direct: "Direct/Blunt",
      professional: "Professional",
      encouraging: "Encouraging"
    }
    return map[value] || value
  }

  useEffect(() => {
    fetchConnections()
    fetchDeliverySettings()
    fetchSubscription()
    fetchProfile()
    fetchRevenueTargets()
    fetchTerritory()
    fetchProducts()
    fetchPreferences()
  }, [])

  // Profile Functions
  const fetchProfile = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`)

      if (res.ok) {
        const data = await res.json()

        const profile = {
          role: data.role || "",
          sellingMotion: data.sellingMotion || "",
          yearsInSales: data.yearsInSales || "",
          salesMethodology: data.salesMethodology || "",
          typicalSalesCycle: data.typicalSalesCycle || "",
          typicalDealSize: data.typicalDealSize || "",
        }

        // Set profile data for the form
        setProfileData({ ...profile })
        // Set saved profile data for the display (create separate object reference)
        setSavedProfileData({ ...profile })
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
    } finally {
      setLoadingProfile(false)
    }
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: profileData.role || null,
            selling_motion: profileData.sellingMotion || null,
            years_in_sales: profileData.yearsInSales || null,
            sales_methodology: profileData.salesMethodology || null,
            typical_sales_cycle: profileData.typicalSalesCycle || null,
            typical_deal_size: profileData.typicalDealSize || null,
          })
        }
      )

      if (res.ok) {
        toast.success("Profile updated successfully")
        // Fetch fresh data from API to ensure saved and current data are in sync
        await fetchProfile()
      } else {
        toast.error("Failed to update profile")
      }
    } catch (err) {
      console.error("Error saving profile:", err)
      toast.error("Failed to update profile")
    } finally {
      setSavingProfile(false)
    }
  }

  // Performance Functions
  const fetchRevenueTargets = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/revenue-targets`)
      if (res.ok) {
        const data = await res.json()
        setRevenueTargets(data.targets || [])
      }
    } catch (err) {
      console.error("Error fetching revenue targets:", err)
    } finally {
      setLoadingTargets(false)
    }
  }

  const saveRevenueTarget = async () => {
    if (!newTarget.target || parseFloat(newTarget.target) <= 0) {
      toast.error("Please enter a valid revenue target")
      return
    }

    // Check if this quarter/year combo already exists
    const existing = revenueTargets.find(
      t => t.year === newTarget.year && t.quarter === newTarget.quarter
    )

    setSavingTarget(true)
    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/revenue-target`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year: newTarget.year,
            quarter: newTarget.quarter,
            target: parseFloat(newTarget.target),
            set_by: "self",
          })
        }
      )

      if (res.ok) {
        if (existing) {
          toast.success(`Q${newTarget.quarter} ${newTarget.year} target updated`)
        } else {
          toast.success(`Q${newTarget.quarter} ${newTarget.year} target added`)
        }

        setNewTarget({
          year: new Date().getFullYear(),
          quarter: Math.floor(new Date().getMonth() / 3) + 1,
          target: "",
        })
        fetchRevenueTargets()
      } else {
        const error = await res.json()
        toast.error(error.detail || "Failed to save revenue target")
      }
    } catch (err) {
      toast.error("Failed to save revenue target")
    } finally {
      setSavingTarget(false)
    }
  }

  const deleteRevenueTarget = async (targetId: string) => {
    if (!confirm("Are you sure you want to delete this revenue target?")) return

    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/revenue-target/${targetId}`,
        { method: "DELETE" }
      )

      if (res.ok) {
        toast.success("Revenue target deleted")
        fetchRevenueTargets()
      } else {
        toast.error("Failed to delete revenue target")
      }
    } catch (err) {
      toast.error("Failed to delete revenue target")
    }
  }

  // Territory Functions
  const fetchTerritory = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/territory`)

      if (res.ok) {
        const data = await res.json()

        const territory = {
          territory: data.territory || "",
          industry: data.industry || "",
          marketMaturity: data.marketMaturity || "",
          competition: data.competition || "",
        }

        setTerritoryData({ ...territory })
        setSavedTerritoryData({ ...territory })
      }
    } catch (err) {
      console.error("Error fetching territory:", err)
    } finally {
      setLoadingTerritory(false)
    }
  }

  const saveTerritory = async () => {
    setSavingTerritory(true)
    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/territory`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            territory: territoryData.territory || null,
            industry: territoryData.industry || null,
            market_maturity: territoryData.marketMaturity || null,
            competition: territoryData.competition || null,
          })
        }
      )

      if (res.ok) {
        toast.success("Territory settings updated successfully")
        await fetchTerritory()
      } else {
        toast.error("Failed to update territory settings")
      }
    } catch (err) {
      console.error("Error saving territory:", err)
      toast.error("Failed to update territory settings")
    } finally {
      setSavingTerritory(false)
    }
  }

  // Products Functions
  const fetchProducts = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/products`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (err) {
      console.error("Error fetching products:", err)
    } finally {
      setLoadingProducts(false)
    }
  }

  const saveProduct = async () => {
    if (!newProduct.name.trim()) {
      toast.error("Please enter a product name")
      return
    }

    setSavingProduct(true)
    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/product`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newProduct.name,
            typical_cycle: newProduct.typicalCycle || null,
            price_range: newProduct.priceRange || null,
          })
        }
      )

      if (res.ok) {
        toast.success("Product added successfully")
        setNewProduct({ name: "", typicalCycle: "", priceRange: "" })
        fetchProducts()
      } else {
        const error = await res.json()
        toast.error(error.detail || "Failed to add product")
      }
    } catch (err) {
      toast.error("Failed to add product")
    } finally {
      setSavingProduct(false)
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/product/${productId}`,
        { method: "DELETE" }
      )

      if (res.ok) {
        toast.success("Product deleted")
        fetchProducts()
      } else {
        toast.error("Failed to delete product")
      }
    } catch (err) {
      toast.error("Failed to delete product")
    }
  }

  // Preferences Functions
  const fetchPreferences = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/preferences`)

      if (res.ok) {
        const data = await res.json()

        const preferences = {
          coachingStyle: data.coachingStyle || "",
          notificationFrequency: data.notificationFrequency || "",
          riskTolerance: data.riskTolerance || "",
          communicationTone: data.communicationTone || "",
        }

        setPreferencesData({ ...preferences })
        setSavedPreferencesData({ ...preferences })
      }
    } catch (err) {
      console.error("Error fetching preferences:", err)
    } finally {
      setLoadingPreferences(false)
    }
  }

  const savePreferences = async () => {
    setSavingPreferences(true)
    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/preferences`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coaching_style: preferencesData.coachingStyle || null,
            notification_frequency: preferencesData.notificationFrequency || null,
            risk_tolerance: preferencesData.riskTolerance || null,
            communication_tone: preferencesData.communicationTone || null,
          })
        }
      )

      if (res.ok) {
        toast.success("Preferences updated successfully")
        await fetchPreferences()
      } else {
        toast.error("Failed to update preferences")
      }
    } catch (err) {
      console.error("Error saving preferences:", err)
      toast.error("Failed to update preferences")
    } finally {
      setSavingPreferences(false)
    }
  }

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
          Manage your profile, performance targets, CRM connections, and subscription
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-9 gap-1">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="territory" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Territory</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
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

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Sales Profile
              </CardTitle>
              <CardDescription>
                Tell us about your role and sales process for personalized AI coaching
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProfile ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={profileData.role}
                        onValueChange={(value) => setProfileData({ ...profileData, role: value })}
                      >
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ic">Individual Contributor (AE/SDR)</SelectItem>
                          <SelectItem value="manager">Sales Manager</SelectItem>
                          <SelectItem value="director">Director of Sales</SelectItem>
                          <SelectItem value="vp">VP of Sales</SelectItem>
                          <SelectItem value="c_level">C-Level (CRO/CEO)</SelectItem>
                        </SelectContent>
                      </Select>
                      <SavedValueDisplay
                        value={savedProfileData.role}
                        onClear={() => setProfileData({ ...profileData, role: "" })}
                        getDisplayText={getRoleDisplayText}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sellingMotion">Selling Motion</Label>
                      <Select
                        value={profileData.sellingMotion}
                        onValueChange={(value) => setProfileData({ ...profileData, sellingMotion: value })}
                      >
                        <SelectTrigger id="sellingMotion">
                          <SelectValue placeholder="Select selling motion" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hunter">Hunter (New Logos)</SelectItem>
                          <SelectItem value="farmer">Farmer (Account Management)</SelectItem>
                          <SelectItem value="hybrid">Hybrid (Both)</SelectItem>
                        </SelectContent>
                      </Select>
                      <SavedValueDisplay
                        value={savedProfileData.sellingMotion}
                        onClear={() => setProfileData({ ...profileData, sellingMotion: "" })}
                        getDisplayText={getSellingMotionDisplayText}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="yearsInSales">Years in Sales</Label>
                      <Select
                        value={profileData.yearsInSales}
                        onValueChange={(value) => setProfileData({ ...profileData, yearsInSales: value })}
                      >
                        <SelectTrigger id="yearsInSales">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="<1">Less than 1 year</SelectItem>
                          <SelectItem value="1-3">1-3 years</SelectItem>
                          <SelectItem value="3-5">3-5 years</SelectItem>
                          <SelectItem value="5-10">5-10 years</SelectItem>
                          <SelectItem value="10+">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                      <SavedValueDisplay
                        value={savedProfileData.yearsInSales}
                        onClear={() => setProfileData({ ...profileData, yearsInSales: "" })}
                        getDisplayText={getYearsDisplayText}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="methodology">Sales Methodology</Label>
                      <Select
                        value={profileData.salesMethodology}
                        onValueChange={(value) => setProfileData({ ...profileData, salesMethodology: value })}
                      >
                        <SelectTrigger id="methodology">
                          <SelectValue placeholder="Select methodology" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meddic">MEDDIC</SelectItem>
                          <SelectItem value="bant">BANT</SelectItem>
                          <SelectItem value="sandler">Sandler</SelectItem>
                          <SelectItem value="solution_selling">Solution Selling</SelectItem>
                          <SelectItem value="challenger">Challenger Sale</SelectItem>
                          <SelectItem value="custom">Custom/Proprietary</SelectItem>
                          <SelectItem value="none">No formal methodology</SelectItem>
                        </SelectContent>
                      </Select>
                      <SavedValueDisplay
                        value={savedProfileData.salesMethodology}
                        onClear={() => setProfileData({ ...profileData, salesMethodology: "" })}
                        getDisplayText={getMethodologyDisplayText}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salesCycle">Typical Sales Cycle</Label>
                      <Select
                        value={profileData.typicalSalesCycle}
                        onValueChange={(value) => setProfileData({ ...profileData, typicalSalesCycle: value })}
                      >
                        <SelectTrigger id="salesCycle">
                          <SelectValue placeholder="Select typical cycle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="<30">Less than 30 days</SelectItem>
                          <SelectItem value="30-60">30-60 days</SelectItem>
                          <SelectItem value="60-90">60-90 days</SelectItem>
                          <SelectItem value="90-180">90-180 days</SelectItem>
                          <SelectItem value="180+">180+ days</SelectItem>
                        </SelectContent>
                      </Select>
                      <SavedValueDisplay
                        value={savedProfileData.typicalSalesCycle}
                        onClear={() => setProfileData({ ...profileData, typicalSalesCycle: "" })}
                        getDisplayText={getCycleDisplayText}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dealSize">Typical Deal Size</Label>
                      <Select
                        value={profileData.typicalDealSize}
                        onValueChange={(value) => setProfileData({ ...profileData, typicalDealSize: value })}
                      >
                        <SelectTrigger id="dealSize">
                          <SelectValue placeholder="Select deal size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="<10k">Less than $10K</SelectItem>
                          <SelectItem value="10k-50k">$10K - $50K</SelectItem>
                          <SelectItem value="50k-100k">$50K - $100K</SelectItem>
                          <SelectItem value="100k-500k">$100K - $500K</SelectItem>
                          <SelectItem value="500k+">$500K+</SelectItem>
                        </SelectContent>
                      </Select>
                      <SavedValueDisplay
                        value={savedProfileData.typicalDealSize}
                        onClear={() => setProfileData({ ...profileData, typicalDealSize: "" })}
                        getDisplayText={getDealSizeDisplayText}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="w-full"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Revenue Targets
              </CardTitle>
              <CardDescription>
                Set quarterly revenue targets for gap-to-quota tracking and AI coaching
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTargets ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Add New Target Form */}
                  <div className="space-y-4">
                    <Label className="text-base">Set Revenue Target</Label>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="targetYear">Year</Label>
                        <Select
                          value={newTarget.year.toString()}
                          onValueChange={(value) => setNewTarget({ ...newTarget, year: parseInt(value) })}
                        >
                          <SelectTrigger id="targetYear">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2026">2026</SelectItem>
                            <SelectItem value="2027">2027</SelectItem>
                            <SelectItem value="2028">2028</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="targetQuarter">Quarter</Label>
                        <Select
                          value={newTarget.quarter.toString()}
                          onValueChange={(value) => setNewTarget({ ...newTarget, quarter: parseInt(value) })}
                        >
                          <SelectTrigger id="targetQuarter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Q1</SelectItem>
                            <SelectItem value="2">Q2</SelectItem>
                            <SelectItem value="3">Q3</SelectItem>
                            <SelectItem value="4">Q4</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="targetAmount">Target (USD)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                          <Input
                            id="targetAmount"
                            type="number"
                            placeholder="500000"
                            value={newTarget.target}
                            onChange={(e) => setNewTarget({ ...newTarget, target: e.target.value })}
                            className="pl-8"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={saveRevenueTarget}
                      disabled={savingTarget}
                      className="w-full"
                    >
                      {savingTarget ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Revenue Target
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Saved Targets - shown below the button in blue boxes like Profile tab */}
                  {revenueTargets.length > 0 && (
                    <div className="space-y-2">
                      {revenueTargets
                        .sort((a, b) => {
                          // Sort by year descending, then quarter descending
                          if (a.year !== b.year) return b.year - a.year
                          return b.quarter - a.quarter
                        })
                        .map((target) => (
                          <div key={target.id} className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex-1">
                              <span className="font-medium text-blue-900">Current: </span>
                              <span className="text-blue-900">Q{target.quarter} {target.year} - </span>
                              <span className="font-bold text-blue-900">${target.target.toLocaleString()}</span>
                              <span className="text-xs text-blue-600 ml-2">(set by {target.setBy})</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteRevenueTarget(target.id)}
                              className="h-6 w-6 p-0 hover:bg-blue-100"
                            >
                              <X className="h-4 w-4 text-blue-600" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Info Alert */}
                  <Alert className="bg-blue-50 border-blue-200">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Revenue targets enable gap-to-quota tracking, deal prioritization, and quota-aware AI coaching on every analysis.
                      {revenueTargets.length === 0 && " Add your first target above to get started!"}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Territory Tab */}
        <TabsContent value="territory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Territory & Market Context
              </CardTitle>
              <CardDescription>
                Configure your market, industry, and competitive landscape for regional insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTerritory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="territory">Geographic Territory</Label>
                      <Input
                        id="territory"
                        type="text"
                        placeholder="e.g., Northeast US, EMEA, Asia-Pacific"
                        value={territoryData.territory}
                        onChange={(e) => setTerritoryData({ ...territoryData, territory: e.target.value })}
                      />
                      <SavedValueDisplay
                        value={savedTerritoryData.territory}
                        onClear={() => setTerritoryData({ ...territoryData, territory: "" })}
                        getDisplayText={(val) => val}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry/Vertical Focus</Label>
                      <Input
                        id="industry"
                        type="text"
                        placeholder="e.g., Healthcare, FinTech, Enterprise SaaS"
                        value={territoryData.industry}
                        onChange={(e) => setTerritoryData({ ...territoryData, industry: e.target.value })}
                      />
                      <SavedValueDisplay
                        value={savedTerritoryData.industry}
                        onClear={() => setTerritoryData({ ...territoryData, industry: "" })}
                        getDisplayText={(val) => val}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="marketMaturity">Market Maturity</Label>
                      <Select
                        value={territoryData.marketMaturity}
                        onValueChange={(value) => setTerritoryData({ ...territoryData, marketMaturity: value })}
                      >
                        <SelectTrigger id="marketMaturity">
                          <SelectValue placeholder="Select market maturity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="greenfield">Greenfield</SelectItem>
                          <SelectItem value="growing">Growing</SelectItem>
                          <SelectItem value="mature">Mature</SelectItem>
                          <SelectItem value="declining">Declining</SelectItem>
                        </SelectContent>
                      </Select>
                      <SavedValueDisplay
                        value={savedTerritoryData.marketMaturity}
                        onClear={() => setTerritoryData({ ...territoryData, marketMaturity: "" })}
                        getDisplayText={getMarketMaturityDisplayText}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="competition">Primary Competition</Label>
                      <Input
                        id="competition"
                        type="text"
                        placeholder="e.g., Competitor A, Competitor B"
                        value={territoryData.competition}
                        onChange={(e) => setTerritoryData({ ...territoryData, competition: e.target.value })}
                      />
                      <SavedValueDisplay
                        value={savedTerritoryData.competition}
                        onClear={() => setTerritoryData({ ...territoryData, competition: "" })}
                        getDisplayText={(val) => val}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={saveTerritory}
                    disabled={savingTerritory}
                    className="w-full"
                  >
                    {savingTerritory ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Territory Settings
                      </>
                    )}
                  </Button>

                  <Alert className="bg-blue-50 border-blue-200">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Territory context enables regional performance benchmarking, industry-specific coaching, and market-adjusted risk scoring.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Catalog
              </CardTitle>
              <CardDescription>
                Define your products or services to track product-specific performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Add New Product Form */}
                  <div className="space-y-4">
                    <Label className="text-base">Add Product</Label>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="productName">Product Name</Label>
                        <Input
                          id="productName"
                          type="text"
                          placeholder="e.g., Enterprise Suite"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="productCycle">Typical Sales Cycle</Label>
                        <Select
                          value={newProduct.typicalCycle}
                          onValueChange={(value) => setNewProduct({ ...newProduct, typicalCycle: value })}
                        >
                          <SelectTrigger id="productCycle">
                            <SelectValue placeholder="Select cycle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="<30">Less than 30 days</SelectItem>
                            <SelectItem value="30-60">30-60 days</SelectItem>
                            <SelectItem value="60-90">60-90 days</SelectItem>
                            <SelectItem value="90-180">90-180 days</SelectItem>
                            <SelectItem value="180+">180+ days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="productPrice">Price Range</Label>
                        <Select
                          value={newProduct.priceRange}
                          onValueChange={(value) => setNewProduct({ ...newProduct, priceRange: value })}
                        >
                          <SelectTrigger id="productPrice">
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="<10k">Less than $10K</SelectItem>
                            <SelectItem value="10k-50k">$10K - $50K</SelectItem>
                            <SelectItem value="50k-100k">$50K - $100K</SelectItem>
                            <SelectItem value="100k-500k">$100K - $500K</SelectItem>
                            <SelectItem value="500k+">$500K+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={saveProduct}
                      disabled={savingProduct}
                      className="w-full"
                    >
                      {savingProduct ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Product
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Saved Products */}
                  {products.length > 0 && (
                    <div className="space-y-2">
                      {products.map((product) => (
                        <div key={product.id} className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex-1">
                            <span className="font-medium text-blue-900">Current: </span>
                            <span className="font-bold text-blue-900">{product.name}</span>
                            {product.typicalCycle && (
                              <span className="text-sm text-blue-700 ml-2">
                                ({getProductCycleDisplayText(product.typicalCycle)})
                              </span>
                            )}
                            {product.priceRange && (
                              <span className="text-sm text-blue-700 ml-1">
                                - {getProductPriceDisplayText(product.priceRange)}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProduct(product.id)}
                            className="h-6 w-6 p-0 hover:bg-blue-100"
                          >
                            <X className="h-4 w-4 text-blue-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Alert className="bg-blue-50 border-blue-200">
                    <Package className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Product catalog enables product-specific win/loss patterns, cross-sell detection, and product mix analysis.
                      {products.length === 0 && " Add your first product above to get started!"}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Coaching Preferences
              </CardTitle>
              <CardDescription>
                Customize how RevTrust coaches you and delivers insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPreferences ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="coachingStyle">Coaching Style</Label>
                      <Select
                        value={preferencesData.coachingStyle}
                        onValueChange={(value) => setPreferencesData({ ...preferencesData, coachingStyle: value })}
                      >
                        <SelectTrigger id="coachingStyle">
                          <SelectValue placeholder="Select coaching style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aggressive">Aggressive</SelectItem>
                          <SelectItem value="balanced">Balanced</SelectItem>
                          <SelectItem value="conservative">Conservative</SelectItem>
                        </SelectContent>
                      </Select>
                      <SavedValueDisplay
                        value={savedPreferencesData.coachingStyle}
                        onClear={() => setPreferencesData({ ...preferencesData, coachingStyle: "" })}
                        getDisplayText={getCoachingStyleDisplayText}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notificationFrequency">Notification Frequency</Label>
                      <Select
                        value={preferencesData.notificationFrequency}
                        onValueChange={(value) => setPreferencesData({ ...preferencesData, notificationFrequency: value })}
                      >
                        <SelectTrigger id="notificationFrequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realtime">Real-time</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Summary</SelectItem>
                        </SelectContent>
                      </Select>
                      <SavedValueDisplay
                        value={savedPreferencesData.notificationFrequency}
                        onClear={() => setPreferencesData({ ...preferencesData, notificationFrequency: "" })}
                        getDisplayText={getNotificationFrequencyDisplayText}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                      <Select
                        value={preferencesData.riskTolerance}
                        onValueChange={(value) => setPreferencesData({ ...preferencesData, riskTolerance: value })}
                      >
                        <SelectTrigger id="riskTolerance">
                          <SelectValue placeholder="Select tolerance" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="show_all">Show Everything</SelectItem>
                          <SelectItem value="critical_only">Critical Only</SelectItem>
                          <SelectItem value="balanced">Balanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <SavedValueDisplay
                        value={savedPreferencesData.riskTolerance}
                        onClear={() => setPreferencesData({ ...preferencesData, riskTolerance: "" })}
                        getDisplayText={getRiskToleranceDisplayText}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="communicationTone">Communication Tone</Label>
                      <Select
                        value={preferencesData.communicationTone}
                        onValueChange={(value) => setPreferencesData({ ...preferencesData, communicationTone: value })}
                      >
                        <SelectTrigger id="communicationTone">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="direct">Direct/Blunt</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="encouraging">Encouraging</SelectItem>
                        </SelectContent>
                      </Select>
                      <SavedValueDisplay
                        value={savedPreferencesData.communicationTone}
                        onClear={() => setPreferencesData({ ...preferencesData, communicationTone: "" })}
                        getDisplayText={getCommunicationToneDisplayText}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={savePreferences}
                    disabled={savingPreferences}
                    className="w-full"
                  >
                    {savingPreferences ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>

                  <Alert className="bg-blue-50 border-blue-200">
                    <Settings className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Your preferences personalize coaching style, notification timing, and communication tone to match your work style.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
