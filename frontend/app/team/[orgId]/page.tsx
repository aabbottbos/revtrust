"use client"

/**
 * Team dashboard page - shows aggregate team health and member list
 */

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Settings, AlertCircle, ArrowLeft, RefreshCw, Target } from "lucide-react"
import { useTeamDashboard, useUpdateMember, useRemoveMember } from "@/hooks/useOrganization"
import {
  useQuarterlyTarget,
  useSetTarget,
  useForecastAnalysis,
  useForecastCoaching,
  useTeamForecast,
  getCurrentQuarter,
} from "@/hooks/useForecast"
import {
  TeamHealthCard,
  MemberList,
  PipelineByStage,
  TopIssuesCard,
  InviteModal,
  PendingInvites,
} from "@/components/team"
import {
  TargetSetup,
  ForecastGauge,
  AICoachingCard,
  TeamForecastTable,
} from "@/components/forecast"

export default function TeamDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const { dashboard, loading, error, refetch } = useTeamDashboard(orgId)
  const { updateMember } = useUpdateMember(orgId)
  const { removeMember } = useRemoveMember(orgId)
  const [showInviteModal, setShowInviteModal] = useState(false)

  // Forecast state
  const { quarter, year } = getCurrentQuarter()
  const { target, refetch: refetchTarget } = useQuarterlyTarget(orgId, quarter, year)
  const { setTarget, loading: savingTarget } = useSetTarget()
  const { analysis, loading: analysisLoading, refetch: refetchAnalysis } = useForecastAnalysis(orgId, quarter, year)
  const { coaching, loading: coachingLoading, error: coachingError, getCoaching } = useForecastCoaching(orgId)
  const { rollup, loading: rollupLoading } = useTeamForecast(orgId, quarter, year)

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

  const handleSetTarget = async (amount: number) => {
    const result = await setTarget({
      target_amount: amount,
      quarter,
      year,
      org_id: orgId,
    })
    if (result) {
      refetchTarget()
      refetchAnalysis()
      return true
    }
    return false
  }

  const handleGetCoaching = () => {
    getCoaching(quarter, year)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
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

  // Determine current user's role (would come from context in real app)
  // TODO: Get from auth context
  const currentUserRole = "admin" as "admin" | "manager" | "ae"

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/team")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{dashboard.organization.name}</h1>
            <p className="text-slate-500">Team Pipeline Health Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setShowInviteModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite
          </Button>
          <Button variant="outline" onClick={() => router.push(`/team/${orgId}/settings`)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Health Summary Cards */}
      <div className="mb-6">
        <TeamHealthCard summary={dashboard.summary} />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            Forecast
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <MemberList
            members={dashboard.members}
            orgId={orgId}
            currentUserRole={currentUserRole}
            onRoleChange={handleRoleChange}
            onRemove={handleRemoveMember}
          />
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          {/* My Forecast Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">My Forecast</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <TargetSetup
                target={target}
                quarter={quarter}
                year={year}
                onSave={handleSetTarget}
                saving={savingTarget}
              />
              {analysis && <ForecastGauge analysis={analysis} />}
            </div>
          </div>

          {/* AI Coaching Section */}
          {analysis && analysis.target_amount > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">AI Coaching</h2>
              <AICoachingCard
                coaching={coaching?.coaching || null}
                loading={coachingLoading}
                error={coachingError}
                onGetCoaching={handleGetCoaching}
              />
            </div>
          )}

          {/* Team Forecast Section (for managers/admins) */}
          {currentUserRole !== "ae" && rollup && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Team Forecast</h2>
              <TeamForecastTable rollup={rollup} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <PipelineByStage data={dashboard.pipelineByStage} />
            <TopIssuesCard issues={dashboard.topIssues} />
          </div>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <PendingInvites orgId={orgId} onRefresh={refetch} />
        </TabsContent>
      </Tabs>

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
