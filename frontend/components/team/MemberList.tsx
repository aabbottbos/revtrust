"use client"

/**
 * Displays team members with health scores and actions
 */

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TrendingUp, TrendingDown, Minus, MoreHorizontal, Eye, UserCog, UserMinus, AlertCircle } from "lucide-react"
import { TeamMemberSummary } from "@/hooks/useOrganization"
import { MemberDrilldown } from "./MemberDrilldown"
import { RoleSelector } from "./RoleSelector"

interface MemberListProps {
  members: TeamMemberSummary[]
  orgId: string
  currentUserRole: string
  onRoleChange?: (userId: string, newRole: string) => void
  onRemove?: (userId: string) => void
}

export function MemberList({ members, orgId, currentUserRole, onRoleChange, onRemove }: MemberListProps) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<string | null>(null)

  const canManageMembers = currentUserRole === "admin"

  if (!members || members.length === 0) {
    return (
      <div className="rounded-md border bg-white p-8 text-center text-slate-500">
        No team members found.
      </div>
    )
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50"
    if (score >= 60) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  const getTrendIcon = (trend: string | null) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600" />
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-slate-400" />
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      admin: "bg-purple-100 text-purple-700",
      manager: "bg-blue-100 text-blue-700",
      ae: "bg-slate-100 text-slate-700",
    }
    return variants[role] || variants.ae
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center">Health</TableHead>
              <TableHead className="text-center">Deals</TableHead>
              <TableHead className="text-right">Pipeline</TableHead>
              <TableHead className="text-center">Issues</TableHead>
              <TableHead className="text-center">Trend</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow
                key={member.userId}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => setSelectedMember(member.userId)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-slate-100">
                        {getInitials(member.name, member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name || member.email.split("@")[0]}</div>
                      <div className="text-xs text-slate-500">{member.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {editingRole === member.userId && canManageMembers ? (
                    <RoleSelector
                      currentRole={member.role}
                      onSelect={(role) => {
                        onRoleChange?.(member.userId, role)
                        setEditingRole(null)
                      }}
                      onCancel={() => setEditingRole(null)}
                    />
                  ) : (
                    <Badge
                      variant="secondary"
                      className={`capitalize cursor-pointer ${getRoleBadge(member.role)}`}
                      onClick={() => canManageMembers && setEditingRole(member.userId)}
                    >
                      {member.role}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getHealthColor(
                      member.healthScore
                    )}`}
                  >
                    {member.healthScore.toFixed(0)}%
                  </span>
                </TableCell>
                <TableCell className="text-center">{member.totalDeals}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(member.totalValue)}</TableCell>
                <TableCell className="text-center">
                  {member.criticalIssues > 0 ? (
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      {member.criticalIssues}
                    </span>
                  ) : (
                    <span className="text-slate-400">0</span>
                  )}
                </TableCell>
                <TableCell className="text-center">{getTrendIcon(member.healthScoreTrend)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedMember(member.userId)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Pipeline
                      </DropdownMenuItem>
                      {canManageMembers && (
                        <>
                          <DropdownMenuItem onClick={() => setEditingRole(member.userId)}>
                            <UserCog className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => onRemove?.(member.userId)}>
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Member Drilldown Modal */}
      {selectedMember && (
        <MemberDrilldown
          orgId={orgId}
          userId={selectedMember}
          open={!!selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </>
  )
}
