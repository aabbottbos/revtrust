"use client"

/**
 * Team settings page
 */

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, AlertCircle, Users, Calendar, Shield } from "lucide-react"
import { useOrganization } from "@/hooks/useOrganization"
import { format } from "date-fns"

export default function TeamSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const { organization, loading, error } = useOrganization(orgId)

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!organization) {
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/team/${orgId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Team Settings</h1>
          <p className="text-slate-500">{organization.name}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Basic team information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input id="name" defaultValue={organization.name} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Team URL</Label>
              <Input id="slug" defaultValue={organization.slug} disabled />
              <p className="text-xs text-slate-500">
                Used in URLs to identify your team
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Plan Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Plan
            </CardTitle>
            <CardDescription>Your current subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="secondary" className="capitalize text-base px-3 py-1">
                  {organization.planTier}
                </Badge>
              </div>
              <Button variant="outline" disabled>
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Users className="h-5 w-5 text-slate-500" />
                <div>
                  <div className="text-sm text-slate-500">Members</div>
                  <div className="font-medium">{organization.memberCount}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Calendar className="h-5 w-5 text-slate-500" />
                <div>
                  <div className="text-sm text-slate-500">Created</div>
                  <div className="font-medium">
                    {format(new Date(organization.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Delete Team</div>
                <div className="text-sm text-slate-500">
                  Permanently delete this team and all associated data
                </div>
              </div>
              <Button variant="destructive" disabled>
                Delete Team
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
