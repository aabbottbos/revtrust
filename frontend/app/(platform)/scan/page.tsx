"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Database,
  BookmarkCheck,
  Lock,
  Play,
  Loader2,
  Plus,
  ArrowLeft,
  Sparkles
} from "lucide-react"
import { UploadValidator } from "@/lib/upload-validator"
import { handleAPIResponse, getErrorMessage } from "@/lib/api-errors"
import { analytics } from "@/lib/analytics"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"
import { toast } from "sonner"

interface CRMConnection {
  id: string
  provider: string
  account_name: string
  is_active: boolean
  last_sync_at: string | null
}

interface SavedScan {
  id: string
  name: string
  description: string | null
  crm_provider: string
  crm_account: string
  last_used_at: string | null
}

interface UserSubscription {
  tier: string
  hasScheduledReviews: boolean
}

export default function ScanPage() {
  const router = useRouter()
  const authenticatedFetch = useAuthenticatedFetch()

  // File upload state
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // CRM state
  const [connections, setConnections] = useState<CRMConnection[]>([])
  const [loadingConnections, setLoadingConnections] = useState(true)
  const [scanningCRM, setScanningCRM] = useState<string | null>(null)

  // Saved scans state
  const [savedScans, setSavedScans] = useState<SavedScan[]>([])
  const [loadingSavedScans, setLoadingSavedScans] = useState(true)

  // Subscription state
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)

  const isPaidUser = subscription?.tier && ["pro", "team", "enterprise"].includes(subscription.tier)

  useEffect(() => {
    fetchConnections()
    fetchSavedScans()
    fetchSubscription()
  }, [])

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

  const fetchSavedScans = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saved-scans`)
      if (res.ok) {
        const data = await res.json()
        setSavedScans(data.saved_scans || [])
      }
    } catch (err) {
      console.error("Error fetching saved scans:", err)
    } finally {
      setLoadingSavedScans(false)
    }
  }

  const fetchSubscription = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/subscription`)
      if (res.ok) {
        const data = await res.json()
        setSubscription(data)
      }
    } catch (err) {
      console.error("Error fetching subscription:", err)
    }
  }

  // File upload handlers (from upload page)
  const handleDownloadTemplate = () => {
    const csvContent = `Deal Name,Deal Amount,Close Date,Stage,Owner,Next Step,Last Activity Date
Acme Corp - Enterprise License,125000,2024-03-15,Negotiation,John Smith,Send proposal,2024-02-28
TechStart Inc - Annual Subscription,45000,2024-02-20,Discovery,Sarah Johnson,Schedule demo,2024-02-25
Global Solutions - Professional Services,89000,2024-04-10,Qualification,Mike Davis,Identify decision makers,2024-02-22
Innovation Labs - Product Bundle,156000,2024-03-25,Proposal,Emily Chen,Follow up on pricing,2024-02-27
Enterprise Co - Multi-Year Deal,280000,2024-05-01,Discovery,John Smith,Technical requirements call,2024-02-26`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'revtrust-sample-pipeline.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      await validateAndSetFile(droppedFile)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      await validateAndSetFile(selectedFile)
    }
  }

  const validateAndSetFile = async (selectedFile: File) => {
    setError(null)
    setValidationError(null)

    const basicValidation = UploadValidator.validateFile(selectedFile)
    if (!basicValidation.valid) {
      setValidationError(basicValidation.error!)
      return
    }

    const contentValidation = await UploadValidator.validateFileContent(selectedFile)
    if (!contentValidation.valid) {
      setValidationError(contentValidation.error!)
      return
    }

    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append("file", file)

      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analyze`,
        {
          method: "POST",
          body: formData,
        }
      )

      const data = await handleAPIResponse(response)

      analytics.csvUploaded(file.size, data.deal_count || 0)
      analytics.analysisStarted(data.analysis_id)

      router.push(`/processing?id=${data.analysis_id}`)
    } catch (err) {
      console.error("Upload error:", err)
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  // CRM Scan handler
  const handleCRMScan = async (connectionId: string) => {
    setScanningCRM(connectionId)
    try {
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/scan/crm/${connectionId}`,
        { method: "POST" }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to start CRM scan")
      }

      const data = await response.json()
      toast.success("CRM scan started!")
      router.push(`/processing?id=${data.analysis_id}`)
    } catch (err) {
      console.error("CRM scan error:", err)
      toast.error(getErrorMessage(err))
    } finally {
      setScanningCRM(null)
    }
  }

  // Saved scan handler
  const handleRunSavedScan = async (scanId: string) => {
    if (!isPaidUser) {
      router.push("/pricing")
      return
    }

    try {
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/saved-scans/${scanId}/run`,
        { method: "POST" }
      )

      if (!response.ok) {
        throw new Error("Failed to run saved scan")
      }

      const data = await response.json()
      toast.success("Scan started!")
      router.push(`/processing?id=${data.analysis_id}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const activeConnections = connections.filter(c => c.is_active)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Start a Scan
          </h1>
          <p className="text-slate-600">
            Choose how you want to analyze your pipeline data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - File Upload */}
          <div className="space-y-6">
            {/* File Upload Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Upload className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Upload File</CardTitle>
                      <CardDescription>
                        CSV or Excel from any CRM
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Sample
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}

                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center transition-all
                    ${isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
                    }
                    ${file ? "border-green-500 bg-green-50" : ""}
                  `}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />

                  {!file ? (
                    <>
                      <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        Drag and drop your file here
                      </p>
                      <p className="text-xs text-slate-500 mb-3">or</p>
                      <Button
                        onClick={() => document.getElementById("file-upload")?.click()}
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                      >
                        Browse Files
                      </Button>
                      <p className="text-xs text-slate-400 mt-3">
                        CSV, XLSX, XLS (max 25MB)
                      </p>
                    </>
                  ) : (
                    <div className="flex items-center justify-center space-x-3">
                      <FileSpreadsheet className="h-8 w-8 text-green-600" />
                      <div className="text-left">
                        <p className="font-medium text-slate-900">{file.name}</p>
                        <p className="text-sm text-slate-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex space-x-3">
                  <Button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start Analysis
                      </>
                    )}
                  </Button>

                  {file && !uploading && (
                    <Button
                      onClick={() => {
                        setFile(null)
                        setError(null)
                      }}
                      variant="outline"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* CRM Connections Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Database className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Scan from CRM</CardTitle>
                      <CardDescription>
                        Pull live data from your connected CRM
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingConnections ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : activeConnections.length > 0 ? (
                  <div className="space-y-3">
                    {activeConnections.map((conn) => (
                      <div
                        key={conn.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                            conn.provider === "salesforce"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-orange-100 text-orange-700"
                          }`}>
                            {conn.provider === "salesforce" ? "SF" : "HS"}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{conn.account_name}</p>
                            <p className="text-xs text-slate-500 capitalize">{conn.provider}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCRMScan(conn.id)}
                          disabled={scanningCRM === conn.id}
                        >
                          {scanningCRM === conn.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Scan
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push("/settings?tab=crm")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Connect Another CRM
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Database className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500 mb-4">
                      No CRMs connected yet
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/settings?tab=crm")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Connect CRM
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Saved Scans */}
          <div>
            <Card className={`shadow-lg h-full ${!isPaidUser ? "relative overflow-hidden" : ""}`}>
              {!isPaidUser && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                    <Lock className="h-3 w-3 mr-1" />
                    Pro
                  </Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isPaidUser ? "bg-purple-100" : "bg-slate-100"}`}>
                    <BookmarkCheck className={`h-5 w-5 ${isPaidUser ? "text-purple-600" : "text-slate-400"}`} />
                  </div>
                  <div>
                    <CardTitle>Saved Scans</CardTitle>
                    <CardDescription>
                      {isPaidUser
                        ? "Your saved scan configurations"
                        : "Quick access to your favorite configurations"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!isPaidUser ? (
                  <div className="text-center py-8">
                    <BookmarkCheck className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="font-semibold text-slate-700 mb-2">
                      Save Your Favorite Configurations
                    </h3>
                    <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                      Pro users can save CRM + filter combinations and run them with one click.
                    </p>
                    <Button
                      onClick={() => router.push("/pricing")}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </div>
                ) : loadingSavedScans ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : savedScans.length > 0 ? (
                  <div className="space-y-3">
                    {savedScans.map((scan) => (
                      <div
                        key={scan.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{scan.name}</p>
                          {scan.description && (
                            <p className="text-xs text-slate-500 truncate">{scan.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {scan.crm_provider === "salesforce" ? "Salesforce" : "HubSpot"}
                            </Badge>
                            <span className="text-xs text-slate-400">{scan.crm_account}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleRunSavedScan(scan.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Run
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookmarkCheck className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500 mb-4">
                      No saved scans yet
                    </p>
                    <p className="text-xs text-slate-400">
                      After running a CRM scan, you can save it for quick access later.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Secure Upload</h3>
                <p className="text-xs text-slate-600">
                  Your data is encrypted and never shared
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Instant Analysis</h3>
                <p className="text-xs text-slate-600">
                  Get results in under a minute
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <AlertCircle className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Actionable Insights</h3>
                <p className="text-xs text-slate-600">
                  Clear recommendations for every issue
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
