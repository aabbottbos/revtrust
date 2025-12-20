"use client"

/**
 * Modal for creating a new team/organization
 */

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, Users } from "lucide-react"
import { useCreateOrganization } from "@/hooks/useOrganization"

interface CreateTeamModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (orgId: string) => void
}

export function CreateTeamModal({ open, onClose, onSuccess }: CreateTeamModalProps) {
  const [name, setName] = useState("")
  const { createOrganization, loading, error } = useCreateOrganization()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await createOrganization(name)
    if (result) {
      setName("")
      onSuccess?.(result.id)
      onClose()
    }
  }

  const handleClose = () => {
    setName("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Team
          </DialogTitle>
          <DialogDescription>
            Create a new team to collaborate with your colleagues on pipeline health.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Sales Team, Enterprise"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
              />
              <p className="text-xs text-slate-500">
                This will be the name of your team visible to all members.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || name.length < 2}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Create Team
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
