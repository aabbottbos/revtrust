"use client"

/**
 * Modal for inviting new team members
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2, Mail, UserPlus } from "lucide-react"
import { useSendInvitation } from "@/hooks/useOrganization"

interface InviteModalProps {
  orgId: string
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const roles = [
  { value: "ae", label: "AE", description: "Account Executive - individual contributor" },
  { value: "manager", label: "Manager", description: "Can view team members' pipelines" },
  { value: "admin", label: "Admin", description: "Full access to all team features" },
]

export function InviteModal({ orgId, open, onClose, onSuccess }: InviteModalProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("ae")
  const { sendInvitation, loading, error } = useSendInvitation(orgId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await sendInvitation({ email, role })
    if (result) {
      setEmail("")
      setRole("ae")
      onSuccess?.()
      onClose()
    }
  }

  const handleClose = () => {
    setEmail("")
    setRole("ae")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join your team. They'll receive an email with a link to accept.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{r.label}</span>
                        <span className="text-xs text-slate-500">{r.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button type="submit" disabled={loading || !email}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
