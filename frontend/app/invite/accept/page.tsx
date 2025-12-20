"use client"

/**
 * Invitation acceptance page - handles email invitation links
 */

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle, Users } from "lucide-react"
import { useAcceptInvitation } from "@/hooks/useOrganization"

function AcceptInvitationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { acceptInvitation, loading, error, result } = useAcceptInvitation()
  const [processed, setProcessed] = useState(false)

  useEffect(() => {
    if (token && !processed) {
      setProcessed(true)
      acceptInvitation(token)
    }
  }, [token, processed, acceptInvitation])

  const handleGoToTeam = () => {
    if (result?.organizationId) {
      router.push(`/team/${result.organizationId}`)
    } else {
      router.push("/team")
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <CardTitle>Invalid Invitation</CardTitle>
          <CardDescription>
            This invitation link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push("/team")}>Go to Teams</Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-slate-400" />
          <p className="text-lg font-medium">Accepting invitation...</p>
          <p className="text-slate-500 mt-2">Please wait while we process your request</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <CardTitle>Unable to Accept Invitation</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-slate-500">
            The invitation may have expired, been revoked, or you may already be a member of this team.
          </p>
          <Button onClick={() => router.push("/team")}>Go to Teams</Button>
        </CardContent>
      </Card>
    )
  }

  if (result?.success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <CardTitle>Welcome to the Team!</CardTitle>
          <CardDescription>
            You've successfully joined {result.organizationName}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-slate-500">
            You now have access to the team dashboard and can collaborate with your teammates.
          </p>
          <Button onClick={handleGoToTeam} className="w-full">
            <Users className="h-4 w-4 mr-2" />
            Go to Team Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}

function LoadingFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="py-12 text-center">
        <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-slate-400" />
        <p className="text-lg font-medium">Loading...</p>
      </CardContent>
    </Card>
  )
}

export default function AcceptInvitationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<LoadingFallback />}>
        <AcceptInvitationContent />
      </Suspense>
    </div>
  )
}
