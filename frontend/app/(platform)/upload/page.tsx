"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from "lucide-react"
import { UploadValidator } from "@/lib/upload-validator"
import { handleAPIResponse, getErrorMessage } from "@/lib/api-errors"
import { analytics } from "@/lib/analytics"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"

export default function UploadPage() {
  const router = useRouter()
  const authenticatedFetch = useAuthenticatedFetch()
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

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

    // Basic validation
    const basicValidation = UploadValidator.validateFile(selectedFile)
    if (!basicValidation.valid) {
      setValidationError(basicValidation.error!)
      return
    }

    // Content validation
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

      // Track successful upload
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Upload Pipeline Data
          </h1>
          <p className="text-slate-600">
            Upload your sales pipeline CSV or Excel file to get instant insights
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Select Your File</CardTitle>
                <CardDescription>
                  Upload a CSV or Excel file containing your pipeline data
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Sample CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sample Template Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>New to RevTrust?</strong> Download our sample CSV template to see the format we expect.
                Supported CRMs: Salesforce, HubSpot, Pipedrive, or any CRM that exports to CSV.
              </p>
            </div>

            {/* Validation Error Alert */}
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-12 text-center transition-all
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
                  <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-lg font-medium text-slate-700 mb-2">
                    Drag and drop your file here
                  </p>
                  <p className="text-sm text-slate-500 mb-4">or</p>
                  <Button
                    onClick={() => document.getElementById("file-upload")?.click()}
                    variant="outline"
                    disabled={uploading}
                  >
                    Browse Files
                  </Button>
                  <p className="text-xs text-slate-400 mt-4">
                    Supported formats: CSV, XLSX, XLS (max 25MB)
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

            {/* Error Message */}
            {error && (
              <div className="flex items-start space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Upload Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* File Info */}
            {file && !error && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ We'll analyze your pipeline data</li>
                  <li>✓ Identify critical issues and opportunities</li>
                  <li>✓ Provide actionable recommendations</li>
                  <li>✓ Results ready in under a minute</li>
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1"
                size="lg"
              >
                {uploading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
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
                  size="lg"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Information Section */}
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
