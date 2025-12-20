"use client"

/**
 * Team members management page
 */

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { UserPlus, ArrowLeft, AlertCircle, RefreshCw } from "lucide-react"
import { useTeamDashboard, useUpdateMember, useRemoveMember } from "@/hooks/useOrganization"
import { MemberList, InviteModal, PendingInvites } from "@/components/team"

export default function TeamMembersPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const { dashboard, loading, error, refetch } = useTeamDashboard(orgId)
  const { updateMember } = useUpdateMember(orgId)
  const { removeMember } = useRemoveMember(orgId)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const handleRoleChange = async (userId: string, newRole: string) => {
    const success = await updateMember(userId, { role: newRole })
    if (success) {
      refetch()
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (confirm("Are you sure you want to remove this member from the team?")) {
      const success = await removeMember(userId)
      if (success) {
        refetch()
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return null
  }

  const currentUserRole = "admin" // TODO: Get from auth context

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/team/${orgId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Team Members</h1>
            <p className="text-slate-500">{dashboard.organization.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Pending Invitations */}
      <div className="mb-6">
        <PendingInvites orgId={orgId} onRefresh={refetch} />
      </div>

      {/* Member List */}
      <MemberList
        members={dashboard.members}
        orgId={orgId}
        currentUserRole={currentUserRole}
        onRoleChange={handleRoleChange}
        onRemove={handleRemoveMember}
      />

      {/* Invite Modal */}
      <InviteModal
        orgId={orgId}
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={refetch}
      />
    </div>
  )
}
