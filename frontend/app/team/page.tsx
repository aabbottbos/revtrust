"use client"

/**
 * Team selection page - lists user's teams and allows creating new ones
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, ChevronRight, AlertCircle } from "lucide-react"
import { useMyOrganizations } from "@/hooks/useOrganization"
import { CreateTeamModal } from "@/components/team"

export default function TeamSelectionPage() {
  const router = useRouter()
  const { organizations, loading, error } = useMyOrganizations()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleTeamSelect = (orgId: string) => {
    router.push(`/team/${orgId}`)
  }

  const handleTeamCreated = (orgId: string) => {
    router.push(`/team/${orgId}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Your Teams</h1>
          <p className="text-slate-500">Select a team to view the dashboard or create a new one</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {organizations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">No Teams Yet</h3>
            <p className="text-slate-500 mb-4 max-w-md mx-auto">
              Create your first team to start collaborating with colleagues on pipeline health.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className="cursor-pointer hover:border-slate-300 transition-colors"
              onClick={() => handleTeamSelect(org.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{org.name}</CardTitle>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {org.memberCount} member{org.memberCount !== 1 ? "s" : ""}
                  <Badge variant="secondary" className="ml-2 capitalize">
                    {org.planTier}
                  </Badge>
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <CreateTeamModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleTeamCreated}
      />
    </div>
  )
}
