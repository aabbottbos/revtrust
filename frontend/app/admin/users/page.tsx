"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Users,
  Search,
  Shield,
  ShieldOff,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  clerkId: string
  email: string
  firstName: string | null
  lastName: string | null
  isAdmin: boolean
  subscriptionTier: string
  subscriptionStatus: string
  createdAt: string
  updatedAt: string
}

interface UserListResponse {
  users: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface AuditLog {
  id: string
  performedBy: string
  performedByEmail: string | null
  action: string
  actionCategory: string
  resourceType: string
  resourceId: string | null
  resourceName: string | null
  changeDetails: any
  ipAddress: string | null
  success: boolean
  errorMessage: string | null
  createdAt: string
}

interface AuditLogsResponse {
  logs: AuditLog[]
  total: number
  page: number
  pageSize: number
}

export default function AdminUsersPage() {
  const { getToken } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filter state
  const [search, setSearch] = useState("")
  const [adminOnly, setAdminOnly] = useState<boolean | null>(null)

  // Audit logs state
  const [showAuditLogs, setShowAuditLogs] = useState(false)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLogsLoading, setAuditLogsLoading] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = await getToken()

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: "20",
      })

      if (search) {
        params.append("search", search)
      }

      if (adminOnly !== null) {
        params.append("admin_only", adminOnly.toString())
      }

      const res = await fetch(`${apiUrl}/api/admin/users?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!res.ok) {
        throw new Error("Failed to fetch users")
      }

      const data: UserListResponse = await res.json()
      setUsers(data.users)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      setAuditLogsLoading(true)
      const token = await getToken()

      const res = await fetch(
        `${apiUrl}/api/admin/users/audit-logs/all?page=1&page_size=50`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )

      if (!res.ok) {
        throw new Error("Failed to fetch audit logs")
      }

      const data: AuditLogsResponse = await res.json()
      setAuditLogs(data.logs)
    } catch (err) {
      console.error("Failed to load audit logs:", err)
    } finally {
      setAuditLogsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, search, adminOnly])

  useEffect(() => {
    if (showAuditLogs) {
      fetchAuditLogs()
    }
  }, [showAuditLogs])

  const handleToggleAdmin = async (user: User) => {
    if (
      !confirm(
        user.isAdmin
          ? `Revoke admin access for ${user.email}?`
          : `Grant admin access to ${user.email}?`
      )
    ) {
      return
    }

    try {
      setUpdating(user.id)
      const token = await getToken()

      const res = await fetch(`${apiUrl}/api/admin/users/${user.id}/admin-status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isAdmin: !user.isAdmin }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || "Failed to update admin status")
      }

      // Refresh users
      await fetchUsers()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update admin status")
    } finally {
      setUpdating(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getActionColor = (action: string) => {
    if (action.includes("grant_admin")) return "text-green-600"
    if (action.includes("revoke_admin")) return "text-red-600"
    return "text-slate-600"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-7xl p-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"
          >
            ← Back to Admin Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage user accounts and admin access
              </p>
            </div>
            <Button
              variant={showAuditLogs ? "default" : "outline"}
              onClick={() => setShowAuditLogs(!showAuditLogs)}
            >
              <Clock className="w-4 h-4 mr-2" />
              {showAuditLogs ? "Hide" : "View"} Audit Log
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="p-4 mb-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Audit Logs Panel */}
        {showAuditLogs && (
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Recent Admin Actions
            </h2>
            {auditLogsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : auditLogs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No audit logs found
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    {log.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, " ")}
                        </span>
                        {log.resourceName && (
                          <span className="text-sm text-slate-600">
                            → {log.resourceName}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        By {log.performedByEmail || log.performedBy} •{" "}
                        {formatDate(log.createdAt)}
                        {log.ipAddress && ` • ${log.ipAddress}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={adminOnly === null ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setAdminOnly(null)
                  setPage(1)
                }}
              >
                All Users
              </Button>
              <Button
                variant={adminOnly === true ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setAdminOnly(true)
                  setPage(1)
                }}
              >
                Admins Only
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                Total Users
              </span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{total}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                Admins
              </span>
              <Shield className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {users.filter((u) => u.isAdmin).length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                Pro Users
              </span>
              <Users className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {users.filter((u) => u.subscriptionTier === "pro").length}
            </div>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {user.firstName || user.lastName
                            ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                            : "—"}
                        </div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={
                          user.subscriptionTier === "pro"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }
                      >
                        {user.subscriptionTier}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isAdmin ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200"
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-50 text-slate-600">
                          User
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        size="sm"
                        variant={user.isAdmin ? "destructive" : "default"}
                        onClick={() => handleToggleAdmin(user)}
                        disabled={updating === user.id}
                      >
                        {updating === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : user.isAdmin ? (
                          <>
                            <ShieldOff className="w-4 h-4 mr-2" />
                            Revoke Admin
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Grant Admin
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
