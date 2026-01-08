/**
 * Hooks for business rules management
 */

import { useState, useEffect, useCallback } from "react";
import { useAuthenticatedFetch } from "./useAuthenticatedFetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ===========================================
// TYPES
// ===========================================

export type RuleCategory =
  | "DATA_QUALITY"
  | "SALES_HYGIENE"
  | "FORECASTING"
  | "PROGRESSION"
  | "ENGAGEMENT"
  | "COMPLIANCE";

export type RuleSeverity = "CRITICAL" | "WARNING" | "INFO";

export type RuleScope = "global" | "user" | "org";

export interface RuleCondition {
  field?: string;
  operator?: string;
  value?: string | number | string[];
  all?: RuleCondition[];
  any?: RuleCondition[];
}

export interface GlobalRule {
  ruleId: string;
  name: string;
  category: RuleCategory;
  severity: RuleSeverity;
  description: string;
  condition: RuleCondition;
  message: string;
  remediation: string | null;
  remediationOwner: string | null;
  automatable: boolean;
  applicableStages: string[];
  enabled: boolean;
  isOverridden: boolean;
  thresholdOverrides: Record<string, unknown> | null;
  effectiveCondition: RuleCondition | null;
}

export interface CustomRule {
  id: string;
  ruleId: string;
  name: string;
  category: RuleCategory;
  severity: RuleSeverity;
  description: string;
  condition: RuleCondition;
  message: string;
  remediation: string | null;
  remediationOwner: string | null;
  automatable: boolean;
  applicableStages: string[];
  priority: number;
  enabled: boolean;
  userId: string | null;
  orgId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RulesListResponse {
  globalRules: GlobalRule[];
  customRules: CustomRule[];
  totalGlobal: number;
  totalCustom: number;
  totalEnabled: number;
  totalDisabled: number;
}

export interface RulesSummary {
  totalRules: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byScope: Record<string, number>;
}

export interface OperatorInfo {
  name: string;
  description: string;
  requiresValue: boolean;
  valueType: string | null;
  example: string | null;
}

export interface FieldInfo {
  name: string;
  displayName: string;
  dataType: string;
  description: string | null;
  commonOperators: string[];
}

export interface RuleMetadata {
  operators: OperatorInfo[];
  fields: FieldInfo[];
  categories: string[];
  severities: string[];
  stages: string[];
}

export interface CreateCustomRuleData {
  ruleId: string;
  name: string;
  category: RuleCategory;
  severity: RuleSeverity;
  description: string;
  condition: RuleCondition;
  message: string;
  remediation?: string;
  remediationOwner?: string;
  automatable?: boolean;
  applicableStages?: string[];
  priority?: number;
  enabled?: boolean;
  orgId?: string;
}

export interface UpdateCustomRuleData {
  name?: string;
  category?: RuleCategory;
  severity?: RuleSeverity;
  description?: string;
  condition?: RuleCondition;
  message?: string;
  remediation?: string;
  remediationOwner?: string;
  automatable?: boolean;
  applicableStages?: string[];
  priority?: number;
  enabled?: boolean;
}

export interface GlobalRuleOverrideData {
  enabled: boolean;
  thresholdOverrides?: Record<string, unknown>;
  orgId?: string;
}

// ===========================================
// HOOKS
// ===========================================

/**
 * Hook to fetch all rules (global + custom)
 */
export function useRules(options?: {
  category?: RuleCategory;
  severity?: RuleSeverity;
  enabledOnly?: boolean;
}) {
  const [data, setData] = useState<RulesListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options?.category) params.append("category", options.category);
      if (options?.severity) params.append("severity", options.severity);
      if (options?.enabledOnly) params.append("enabled_only", "true");

      const url = `${API_URL}/api/rules${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await authenticatedFetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch rules");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch rules");
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, options?.category, options?.severity, options?.enabledOnly]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return { data, loading, error, refetch: fetchRules };
}

/**
 * Hook to fetch global rules only
 */
export function useGlobalRules(options?: {
  category?: RuleCategory;
  severity?: RuleSeverity;
}) {
  const [rules, setRules] = useState<GlobalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options?.category) params.append("category", options.category);
      if (options?.severity) params.append("severity", options.severity);

      const url = `${API_URL}/api/rules/global${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await authenticatedFetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch global rules");
      }

      const result = await response.json();
      setRules(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch global rules");
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, options?.category, options?.severity]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return { rules, loading, error, refetch: fetchRules };
}

/**
 * Hook to fetch custom rules only
 */
export function useCustomRules(includeOrg: boolean = true) {
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_URL}/api/rules/custom?include_org=${includeOrg}`;
      const response = await authenticatedFetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch custom rules");
      }

      const result = await response.json();
      setRules(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch custom rules");
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, includeOrg]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return { rules, loading, error, refetch: fetchRules };
}

/**
 * Hook to fetch rule metadata (operators, fields, etc.)
 */
export function useRuleMetadata() {
  const [metadata, setMetadata] = useState<RuleMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await authenticatedFetch(`${API_URL}/api/rules/metadata`);

        if (!response.ok) {
          throw new Error("Failed to fetch rule metadata");
        }

        const result = await response.json();
        setMetadata(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch metadata");
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [authenticatedFetch]);

  return { metadata, loading, error };
}

/**
 * Hook to fetch rules summary
 */
export function useRulesSummary() {
  const [summary, setSummary] = useState<RulesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch(`${API_URL}/api/rules/summary`);

      if (!response.ok) {
        throw new Error("Failed to fetch rules summary");
      }

      const result = await response.json();
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch summary");
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}

/**
 * Hook to create a custom rule
 */
export function useCreateCustomRule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const createRule = useCallback(
    async (data: CreateCustomRuleData): Promise<CustomRule | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await authenticatedFetch(`${API_URL}/api/rules/custom`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to create rule");
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create rule";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  return { createRule, loading, error };
}

/**
 * Hook to update a custom rule
 */
export function useUpdateCustomRule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const updateRule = useCallback(
    async (ruleId: string, data: UpdateCustomRuleData): Promise<CustomRule | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await authenticatedFetch(`${API_URL}/api/rules/custom/${ruleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to update rule");
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update rule";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  return { updateRule, loading, error };
}

/**
 * Hook to delete a custom rule
 */
export function useDeleteCustomRule() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const deleteRule = useCallback(
    async (ruleId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await authenticatedFetch(`${API_URL}/api/rules/custom/${ruleId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to delete rule");
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete rule";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  return { deleteRule, loading, error };
}

/**
 * Hook to override a global rule
 */
export function useGlobalRuleOverride() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const createOverride = useCallback(
    async (globalRuleId: string, data: GlobalRuleOverrideData): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await authenticatedFetch(
          `${API_URL}/api/rules/global/${globalRuleId}/override`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to create override");
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create override";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  const removeOverride = useCallback(
    async (globalRuleId: string, orgId?: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const params = orgId ? `?org_id=${orgId}` : "";
        const response = await authenticatedFetch(
          `${API_URL}/api/rules/global/${globalRuleId}/override${params}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to remove override");
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to remove override";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  return { createOverride, removeOverride, loading, error };
}

/**
 * Hook to toggle a rule's enabled status
 */
export function useToggleRule() {
  const { createOverride, removeOverride, loading: overrideLoading, error: overrideError } = useGlobalRuleOverride();
  const { updateRule, loading: updateLoading, error: updateError } = useUpdateCustomRule();

  const toggleGlobalRule = useCallback(
    async (ruleId: string, currentEnabled: boolean, isOverridden: boolean): Promise<boolean> => {
      if (isOverridden && currentEnabled) {
        // Remove override to restore default (enabled)
        return removeOverride(ruleId);
      } else {
        // Create override to toggle
        return createOverride(ruleId, { enabled: !currentEnabled });
      }
    },
    [createOverride, removeOverride]
  );

  const toggleCustomRule = useCallback(
    async (ruleId: string, currentEnabled: boolean): Promise<boolean> => {
      const result = await updateRule(ruleId, { enabled: !currentEnabled });
      return result !== null;
    },
    [updateRule]
  );

  return {
    toggleGlobalRule,
    toggleCustomRule,
    loading: overrideLoading || updateLoading,
    error: overrideError || updateError,
  };
}
