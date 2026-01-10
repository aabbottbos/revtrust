"use client"

import { useState } from "react"
import { NavBar } from "@/components/layout/NavBar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mail, CheckCircle2, XCircle, AlertCircle, Settings, RefreshCw } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface EmailTestResponse {
  success: boolean
  message: string
  details: Record<string, unknown>
}

interface ConfigResponse {
  resend_api_key_configured: boolean
  from_email: string
  api_key_length: number
  api_key_starts_with: string | null
}

export default function EmailTestPage() {
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<EmailTestResponse | null>(null)
  const [config, setConfig] = useState<ConfigResponse | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const clearLogs = () => {
    setLogs([])
    setResult(null)
  }

  const checkConfig = async () => {
    setLoadingConfig(true)
    addLog("Checking email configuration...")

    try {
      const response = await fetch(`${API_URL}/api/email-test/config`)
      const data: ConfigResponse = await response.json()
      setConfig(data)
      addLog(`Config loaded: API key configured = ${data.resend_api_key_configured}`)
      addLog(`From email: ${data.from_email}`)
      if (data.api_key_starts_with) {
        addLog(`API key starts with: ${data.api_key_starts_with}`)
      }
    } catch (error) {
      addLog(`Error checking config: ${error}`)
    } finally {
      setLoadingConfig(false)
    }
  }

  const sendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setResult(null)
    addLog(`Starting email test to: ${email}`)
    addLog(`API URL: ${API_URL}/api/email-test`)

    try {
      addLog("Sending POST request...")
      const response = await fetch(`${API_URL}/api/email-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to_email: email }),
      })

      addLog(`Response status: ${response.status}`)

      const data: EmailTestResponse = await response.json()
      setResult(data)

      if (data.success) {
        addLog("Email sent successfully!")
      } else {
        addLog(`Email failed: ${data.message}`)
      }

      addLog(`Full response: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      addLog(`Request error: ${errorMessage}`)
      setResult({
        success: false,
        message: `Request failed: ${errorMessage}`,
        details: { error: errorMessage }
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Info Banner */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Email Configuration Test Page</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Use this page to test that your Resend email service is configured correctly.
                  Check the backend console logs for detailed debugging information.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Configuration Check */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-slate-600" />
                  Configuration
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkConfig}
                  disabled={loadingConfig}
                >
                  {loadingConfig ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    "Check Config"
                  )}
                </Button>
              </div>

              {config ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-600">API Key Configured</span>
                    {config.resend_api_key_configured ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Yes
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600">
                        <XCircle className="h-4 w-4 mr-1" /> No
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-600">From Email</span>
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                      {config.from_email}
                    </code>
                  </div>
                  {config.api_key_starts_with && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-slate-600">API Key Preview</span>
                      <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                        {config.api_key_starts_with}
                      </code>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-600">API Key Length</span>
                    <span>{config.api_key_length} characters</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Click &quot;Check Config&quot; to view email configuration status
                </p>
              )}
            </Card>

            {/* Send Test Email */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-slate-600" />
                Send Test Email
              </h2>

              <form onSubmit={sendTestEmail} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Recipient Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={sending || !email}
                  className="w-full"
                  style={{ backgroundColor: '#2563EB' }}
                >
                  {sending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Test Email
                    </>
                  )}
                </Button>
              </form>

              {/* Result Display */}
              {result && (
                <div className={`mt-4 p-4 rounded-lg ${
                  result.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}>
                  <div className="flex items-center mb-2">
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <span className={`font-semibold ${
                      result.success ? "text-green-900" : "text-red-900"
                    }`}>
                      {result.success ? "Success!" : "Failed"}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    result.success ? "text-green-700" : "text-red-700"
                  }`}>
                    {result.message}
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Logs Panel */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Client-Side Logs</h2>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                Clear Logs
              </Button>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <span className="text-slate-500">
                  Logs will appear here when you test the email...
                </span>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-green-400 mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>

            <p className="text-sm text-slate-500 mt-3">
              For detailed server-side logs, check your backend terminal/console.
            </p>
          </Card>

          {/* Troubleshooting Guide */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Troubleshooting Guide</h2>

            <div className="space-y-4 text-sm">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">401 Unauthorized</h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>Check that RESEND_API_KEY is set in your .env file</li>
                  <li>Verify the API key is correct (copy from Resend dashboard)</li>
                  <li>Ensure the API key hasn&apos;t been revoked</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">403 Forbidden</h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>Verify your domain is configured in Resend</li>
                  <li>Check FROM_EMAIL uses a verified domain</li>
                  <li>Ensure DNS records (SPF, DKIM) are properly set</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">422 Validation Error</h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>FROM_EMAIL may be using an unverified domain</li>
                  <li>Email addresses must be valid format</li>
                  <li>Check Resend dashboard for domain verification status</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">Network Error</h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>Check your internet connection</li>
                  <li>Verify the backend server is running</li>
                  <li>Check CORS configuration if using different domains</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
