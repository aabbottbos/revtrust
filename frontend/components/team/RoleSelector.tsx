"use client"

/**
 * Inline role selector dropdown for changing member roles
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface RoleSelectorProps {
  currentRole: string
  onSelect: (role: string) => void
  onCancel: () => void
}

const roles = [
  { value: "admin", label: "Admin", description: "Full access to all team features" },
  { value: "manager", label: "Manager", description: "Can view team members' pipelines" },
  { value: "ae", label: "AE", description: "Account Executive - individual contributor" },
]

export function RoleSelector({ currentRole, onSelect, onCancel }: RoleSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      <Select defaultValue={currentRole} onValueChange={onSelect}>
        <SelectTrigger className="h-7 w-[100px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              <div className="flex flex-col">
                <span className="font-medium">{role.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
