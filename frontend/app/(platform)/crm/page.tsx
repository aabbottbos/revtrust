"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Check, X, RefreshCw } from "lucide-react"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"

interface Connection {
  id: string
  provider: string
  account_name: string
  is_active: boolean
  last_sync_at: string | null
  created_at: string
}

function CRMConnectionsContent() {
  const searchParams = useSearchParams()
  const authenticatedFetch = useAuthenticatedFetch()
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const returnTo = searchParams.get("returnTo")

  useEffect(() => {
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    try {
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/oauth/connections`)
      const data = await res.json()
      setConnections(data.connections)
    } catch (err) {
      console.error("Error fetching connections:", err)
    } finally {
      setLoading(false)
    }
  }

  const connectSalesforce = async () => {
    setConnecting("salesforce")
    try {
      // Store returnTo in sessionStorage to preserve through OAuth redirect
      if (returnTo) {
        sessionStorage.setItem("oauth_return_to", returnTo)
      }
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/oauth/salesforce/authorize`)
      const data = await res.json()
      window.location.href = data.authorization_url
    } catch (err) {
      console.error("Error:", err)
      setConnecting(null)
    }
  }

  const connectHubSpot = async () => {
    setConnecting("hubspot")
    try {
      // Store returnTo in sessionStorage to preserve through OAuth redirect
      if (returnTo) {
        sessionStorage.setItem("oauth_return_to", returnTo)
      }
      const res = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/oauth/hubspot/authorize`)
      const data = await res.json()
      window.location.href = data.authorization_url
    } catch (err) {
      console.error("Error:", err)
      setConnecting(null)
    }
  }

  const testConnection = async (connectionId: string) => {
    try {
      const res = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/oauth/connections/${connectionId}/test`,
        { method: "POST" }
      )
      const data = await res.json()

      if (data.status === "success") {
        alert("Connection test successful!")
        fetchConnections()
      } else {
        alert("Connection test failed")
      }
    } catch (err) {
      alert("Connection test failed")
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
    } catch (err) {
      alert("Failed to delete connection")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">CRM Connections</h1>

      {/* Connected CRMs */}
      {connections.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Connected</h2>
          <div className="space-y-4">
            {connections.map((conn) => (
              <Card key={conn.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      {conn.provider === "salesforce" ? "SF" : "HS"}
                    </div>
                    <div>
                      <div className="font-bold">{conn.account_name}</div>
                      <div className="text-sm text-slate-600">
                        {conn.provider === "salesforce" ? "Salesforce" : "HubSpot"}
                      </div>
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
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Test
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
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Connect New CRM */}
      <div>
        <h2 className="text-xl font-bold mb-4">Connect New CRM</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl font-bold">
                SF
              </div>
              <div>
                <div className="font-bold">Salesforce</div>
                <div className="text-sm text-slate-600">
                  Connect your Salesforce org
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
                "Connect Salesforce"
              )}
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-xl font-bold">
                HS
              </div>
              <div>
                <div className="font-bold">HubSpot</div>
                <div className="text-sm text-slate-600">
                  Connect your HubSpot portal
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
                "Connect HubSpot"
              )}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function CRMConnectionsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 max-w-4xl text-center">Loading...</div>}>
      <CRMConnectionsContent />
    </Suspense>
  )
}
