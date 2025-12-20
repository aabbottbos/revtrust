/**
 * Hooks for organization/team data fetching
 */

import { useState, useEffect, useCallback } from "react";
import { useAuthenticatedFetch } from "./useAuthenticatedFetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ===========================================
// TYPES
// ===========================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  planTier: string;
  memberCount: number;
  createdAt: string;
  settings?: Record<string, unknown>;
}

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  role: "admin" | "manager" | "ae";
  reportsTo: string | null;
  isActive: boolean;
  joinedAt: string;
  pipelineHealth: number | null;
  totalDeals: number | null;
  totalValue: number | null;
  criticalIssues: number | null;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "declined" | "expired";
  invitedBy: string;
  inviterName: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface TeamHealthSummary {
  totalMembers: number;
  activeMembers: number;
  totalDeals: number;
  totalPipelineValue: number;
  averageHealthScore: number;
  totalCriticalIssues: number;
  totalMajorIssues: number;
  totalMinorIssues: number;
  healthScoreChange?: number;
  valueChange?: number;
}

export interface TeamMemberSummary {
  userId: string;
  name: string | null;
  email: string;
  role: string;
  healthScore: number;
  totalDeals: number;
  totalValue: number;
  criticalIssues: number;
  majorIssues: number;
  healthScoreTrend: "up" | "down" | "stable" | null;
}

export interface TeamDashboard {
  organization: Organization;
  summary: TeamHealthSummary;
  members: TeamMemberSummary[];
  pipelineByStage: Record<string, number>;
  topIssues: Array<{ type: string; count: number }>;
}

export interface MemberPipelineDetail {
  member: {
    userId: string;
    email: string;
    name: string | null;
    role: string;
  };
  currentAnalysis: {
    id: string;
    fileName: string;
    healthScore: number;
    totalDeals: number;
    dealsWithIssues: number;
    totalAmount: number | null;
    totalCritical: number;
    totalWarnings: number;
    createdAt: string;
  } | null;
  analysisHistory: Array<{
    id: string;
    fileName: string;
    healthScore: number;
    totalDeals: number;
    createdAt: string;
  }>;
}

// ===========================================
// ORGANIZATION HOOKS
// ===========================================

export function useMyOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(`${API_URL}/api/organizations`);
      if (!response.ok) throw new Error("Failed to fetch organizations");
      const data = await response.json();
      setOrganizations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return { organizations, loading, error, refetch: fetchOrganizations };
}

export function useOrganization(orgId: string | undefined) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchOrganization = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(`${API_URL}/api/organizations/${orgId}`);
      if (!response.ok) throw new Error("Failed to fetch organization");
      const data = await response.json();
      setOrganization(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch organization");
    } finally {
      setLoading(false);
    }
  }, [orgId, authenticatedFetch]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  return { organization, loading, error, refetch: fetchOrganization };
}

export function useCreateOrganization() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const createOrganization = useCallback(
    async (name: string): Promise<Organization | null> => {
      try {
        setLoading(true);
        setError(null);
        const response = await authenticatedFetch(`${API_URL}/api/organizations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Failed to create organization");
        }
        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create organization";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  return { createOrganization, loading, error };
}

// ===========================================
// DASHBOARD HOOK
// ===========================================

export function useTeamDashboard(orgId: string | undefined) {
  const [dashboard, setDashboard] = useState<TeamDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchDashboard = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(`${API_URL}/api/organizations/${orgId}/dashboard`);
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      const data = await response.json();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch dashboard");
    } finally {
      setLoading(false);
    }
  }, [orgId, authenticatedFetch]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { dashboard, loading, error, refetch: fetchDashboard };
}

// ===========================================
// MEMBER HOOKS
// ===========================================

export function useTeamMembers(orgId: string | undefined) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchMembers = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(`${API_URL}/api/organizations/${orgId}/members`);
      if (!response.ok) throw new Error("Failed to fetch members");
      const data = await response.json();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  }, [orgId, authenticatedFetch]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, loading, error, refetch: fetchMembers };
}

export function useUpdateMember(orgId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const updateMember = useCallback(
    async (
      userId: string,
      data: Partial<{ role: string; reportsTo: string | null; isActive: boolean }>
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        const response = await authenticatedFetch(
          `${API_URL}/api/organizations/${orgId}/members/${userId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to update member");
        }
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update member";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [orgId, authenticatedFetch]
  );

  return { updateMember, loading, error };
}

export function useRemoveMember(orgId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const removeMember = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        const response = await authenticatedFetch(
          `${API_URL}/api/organizations/${orgId}/members/${userId}`,
          { method: "DELETE" }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to remove member");
        }
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to remove member";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [orgId, authenticatedFetch]
  );

  return { removeMember, loading, error };
}

export function useMemberPipeline(orgId: string | undefined, userId: string | undefined) {
  const [data, setData] = useState<MemberPipelineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchPipeline = useCallback(async () => {
    if (!orgId || !userId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(
        `${API_URL}/api/organizations/${orgId}/members/${userId}/pipeline`
      );
      if (!response.ok) throw new Error("Failed to fetch pipeline data");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch pipeline");
    } finally {
      setLoading(false);
    }
  }, [orgId, userId, authenticatedFetch]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  return { data, loading, error, refetch: fetchPipeline };
}

// ===========================================
// INVITATION HOOKS
// ===========================================

export function useInvitations(orgId: string | undefined, status?: string) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchInvitations = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError(null);
      const url = status
        ? `${API_URL}/api/organizations/${orgId}/invitations?status_filter=${status}`
        : `${API_URL}/api/organizations/${orgId}/invitations`;
      const response = await authenticatedFetch(url);
      if (!response.ok) throw new Error("Failed to fetch invitations");
      const data = await response.json();
      setInvitations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch invitations");
    } finally {
      setLoading(false);
    }
  }, [orgId, status, authenticatedFetch]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return { invitations, loading, error, refetch: fetchInvitations };
}

export function useSendInvitation(orgId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const sendInvitation = useCallback(
    async (data: { email: string; role: string; reportsTo?: string }): Promise<Invitation | null> => {
      try {
        setLoading(true);
        setError(null);
        const response = await authenticatedFetch(
          `${API_URL}/api/organizations/${orgId}/invitations`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to send invitation");
        }
        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send invitation";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [orgId, authenticatedFetch]
  );

  return { sendInvitation, loading, error };
}

export function useCancelInvitation(orgId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const cancelInvitation = useCallback(
    async (invitationId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        const response = await authenticatedFetch(
          `${API_URL}/api/organizations/${orgId}/invitations/${invitationId}`,
          { method: "DELETE" }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to cancel invitation");
        }
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to cancel invitation";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [orgId, authenticatedFetch]
  );

  return { cancelInvitation, loading, error };
}

export function useAcceptInvitation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    organizationId: string;
    organizationName: string;
  } | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const acceptInvitation = useCallback(
    async (token: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        const response = await authenticatedFetch(
          `${API_URL}/api/organizations/invitations/accept`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to accept invitation");
        }
        const data = await response.json();
        setResult(data);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to accept invitation";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  return { acceptInvitation, loading, error, result };
}
