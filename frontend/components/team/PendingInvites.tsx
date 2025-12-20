"use client"

/**
 * Displays list of pending invitations with cancel option
 */

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Mail, X, Clock, AlertCircle, Loader2 } from "lucide-react"
import { useInvitations, useCancelInvitation, Invitation } from "@/hooks/useOrganization"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { useState } from "react"

interface PendingInvitesProps {
  orgId: string
  onRefresh?: () => void
}

export function PendingInvites({ orgId, onRefresh }: PendingInvitesProps) {
  const { invitations, loading, error, refetch } = useInvitations(orgId, "pending")
  const { cancelInvitation, loading: cancelling } = useCancelInvitation(orgId)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const handleCancel = async (invitationId: string) => {
    setCancellingId(invitationId)
    const success = await cancelInvitation(invitationId)
    if (success) {
      refetch()
      onRefresh?.()
    }
    setCancellingId(null)
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      admin: "bg-purple-100 text-purple-700",
      manager: "bg-blue-100 text-blue-700",
      ae: "bg-slate-100 text-slate-700",
    }
    return variants[role] || variants.ae
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (invitations.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Pending Invitations
          <Badge variant="secondary" className="ml-1">
            {invitations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation: Invitation) => {
            const isExpired = isPast(new Date(invitation.expiresAt))

            return (
              <div
                key={invitation.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isExpired ? "bg-slate-50 opacity-60" : "bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <div className="font-medium">{invitation.email}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Badge
                        variant="secondary"
                        className={`capitalize text-xs ${getRoleBadge(invitation.role)}`}
                      >
                        {invitation.role}
                      </Badge>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      {isExpired ? (
                        <span className="text-red-500">Expired</span>
                      ) : (
                        <span>
                          Expires {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    {invitation.inviterName && (
                      <div className="text-xs text-slate-400 mt-0.5">
                        Invited by {invitation.inviterName}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-red-600"
                  onClick={() => handleCancel(invitation.id)}
                  disabled={cancelling && cancellingId === invitation.id}
                >
                  {cancelling && cancellingId === invitation.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
