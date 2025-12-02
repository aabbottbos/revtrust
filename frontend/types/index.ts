export interface Deal {
  id: string
  name: string
  account?: string
  amount?: number
  closeDate?: string
  stage?: string
  owner?: string
  hasIssues: boolean
  criticalCount: number
  warningCount: number
  violations: Violation[]
}

export interface Violation {
  id: string
  ruleId: string
  ruleName: string
  category: string
  severity: "critical" | "warning" | "info"
  message: string
  remediationAction: string
  remediationOwner: string
}

export interface Analysis {
  id: string
  fileName: string
  uploadDate: string
  totalDeals: number
  dealsWithIssues: number
  healthScore: number
  processingStatus: "pending" | "processing" | "completed" | "failed"
}
