/**
 * Hooks for admin LLM provider and prompt management
 */

import { useState, useEffect, useCallback } from "react";
import { useAuthenticatedFetch } from "./useAuthenticatedFetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ===========================================
// TYPES
// ===========================================

export type PromptCategory = "ANALYSIS" | "MAPPING" | "FORECASTING" | "RESEARCH";

export type ExperimentStatus = "DRAFT" | "RUNNING" | "COMPLETED" | "CANCELLED";

// LLM Provider types
export interface LLMProvider {
  id: string;
  name: string;
  displayName: string;
  apiKeyMasked: string;
  isActive: boolean;
  availableModels: string[];
  defaultModel: string | null;
  lastTestedAt: string | null;
  testStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderCreateInput {
  name: string;
  displayName: string;
  apiKey: string;
  defaultModel?: string;
}

export interface ProviderUpdateInput {
  displayName?: string;
  apiKey?: string;
  defaultModel?: string;
  isActive?: boolean;
}

export interface ProviderTestResult {
  success: boolean;
  message?: string;
  error?: string;
  response?: string;
}

// Prompt types
export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  content: string;
  providerId: string | null;
  model: string | null;
  changeNote: string | null;
  createdAt: string;
  createdBy: string;
}

export interface Prompt {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: PromptCategory;
  providerId: string;
  model: string;
  activeVersionId: string | null;
  maxTokens: number;
  temperature: number;
  isSystemPrompt: boolean;
  createdAt: string;
  updatedAt: string;
  versions?: PromptVersion[];
  activeVersion?: PromptVersion | null;
}

export interface VersionCreateInput {
  content: string;
  changeNote?: string;
  providerId?: string;
  model?: string;
}

export interface PromptUpdateInput {
  name?: string;
  description?: string;
  providerId?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  activeVersionId?: string;
}

export interface PromptTestInput {
  versionId?: string;
  sampleData: Record<string, unknown>;
}

export interface PromptTestResult {
  success: boolean;
  response?: string;
  error?: string;
  metrics?: {
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    model: string;
    provider: string;
  };
  renderedPrompt?: string;
}

// Experiment types
export interface Experiment {
  id: string;
  promptId: string;
  promptSlug: string | null;
  name: string;
  description: string | null;
  controlVersionId: string;
  controlVersion: number | null;
  treatmentVersionId: string;
  treatmentVersion: number | null;
  trafficSplit: number;
  status: ExperimentStatus;
  startedAt: string | null;
  endedAt: string | null;
  controlInvocations: number;
  treatmentInvocations: number;
  controlAvgLatencyMs: number | null;
  treatmentAvgLatencyMs: number | null;
  controlAvgTokens: number | null;
  treatmentAvgTokens: number | null;
  controlErrorRate: number | null;
  treatmentErrorRate: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ExperimentCreateInput {
  promptId: string;
  name: string;
  description?: string;
  controlVersionId: string;
  treatmentVersionId: string;
  trafficSplit?: number;
}

export interface ExperimentUpdateInput {
  name?: string;
  description?: string;
  trafficSplit?: number;
  status?: ExperimentStatus;
}

export interface ExperimentResults {
  experiment: Experiment;
  controlMetrics: Record<string, unknown>;
  treatmentMetrics: Record<string, unknown>;
  recommendation: string | null;
}

// ===========================================
// PROVIDER HOOKS
// ===========================================

export function useProviders() {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch(
        API_URL + "/api/admin/prompts/providers"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch providers: " + response.status);
      }

      const data = await response.json();
      setProviders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch providers");
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return { providers, loading, error, refetch: fetchProviders };
}

export function useCreateProvider() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const createProvider = useCallback(
    async (input: ProviderCreateInput): Promise<LLMProvider | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          API_URL + "/api/admin/prompts/providers",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Failed to create provider: " + response.status);
        }

        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create provider");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  return { createProvider, loading, error };
}

export function useUpdateProvider() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const updateProvider = useCallback(
    async (id: string, input: ProviderUpdateInput): Promise<LLMProvider | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          API_URL + "/api/admin/prompts/providers/" + id,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Failed to update provider: " + response.status);
        }

        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update provider");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  return { updateProvider, loading, error };
}

export function useDeleteProvider() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const deleteProvider = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          API_URL + "/api/admin/prompts/providers/" + id,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error("Failed to delete provider: " + response.status);
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete provider");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  return { deleteProvider, loading, error };
}

export function useTestProvider() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const testProvider = useCallback(
    async (id: string): Promise<ProviderTestResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          API_URL + "/api/admin/prompts/providers/" + id + "/test",
          { method: "POST" }
        );

        if (!response.ok) {
          throw new Error("Failed to test provider: " + response.status);
        }

        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to test provider");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  return { testProvider, loading, error };
}

// ===========================================
// PROMPT HOOKS
// ===========================================

export function usePrompts(category?: PromptCategory, includeVersions = false) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (includeVersions) params.append("include_versions", "true");

      const response = await authenticatedFetch(
        API_URL + "/api/admin/prompts/?" + params.toString()
      );

      if (!response.ok) {
        throw new Error("Failed to fetch prompts: " + response.status);
      }

      const data = await response.json();
      setPrompts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prompts");
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, category, includeVersions]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  return { prompts, loading, error, refetch: fetchPrompts };
}

export function usePrompt(slug: string) {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchPrompt = useCallback(async () => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch(
        API_URL + "/api/admin/prompts/" + slug
      );

      if (!response.ok) {
        throw new Error("Failed to fetch prompt: " + response.status);
      }

      const data = await response.json();
      setPrompt(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prompt");
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, slug]);

  useEffect(() => {
    fetchPrompt();
  }, [fetchPrompt]);

  return { prompt, loading, error, refetch: fetchPrompt };
}

export function useUpdatePrompt() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const updatePrompt = useCallback(
    async (slug: string, input: PromptUpdateInput): Promise<Prompt | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          API_URL + "/api/admin/prompts/" + slug,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Failed to update prompt: " + response.status);
        }

        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update prompt");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  return { updatePrompt, loading, error };
}

export function useCreateVersion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const createVersion = useCallback(
    async (slug: string, input: VersionCreateInput, setAsActive = true): Promise<PromptVersion | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          API_URL + "/api/admin/prompts/" + slug + "/versions?set_as_active=" + setAsActive,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Failed to create version: " + response.status);
        }

        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create version");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  return { createVersion, loading, error };
}

export function useTestPrompt() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const testPrompt = useCallback(
    async (slug: string, input: PromptTestInput): Promise<PromptTestResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          API_URL + "/api/admin/prompts/" + slug + "/test",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to test prompt: " + response.status);
        }

        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to test prompt");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  return { testPrompt, loading, error };
}

// ===========================================
// EXPERIMENT HOOKS
// ===========================================

export function useExperiments(promptId?: string, status?: ExperimentStatus) {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchExperiments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (promptId) params.append("prompt_id", promptId);
      if (status) params.append("status", status);

      const response = await authenticatedFetch(
        API_URL + "/api/admin/prompts/experiments?" + params.toString()
      );

      if (!response.ok) {
        throw new Error("Failed to fetch experiments: " + response.status);
      }

      const data = await response.json();
      setExperiments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch experiments");
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, promptId, status]);

  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  return { experiments, loading, error, refetch: fetchExperiments };
}

export function useCreateExperiment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const createExperiment = useCallback(
    async (input: ExperimentCreateInput): Promise<Experiment | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          API_URL + "/api/admin/prompts/experiments",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Failed to create experiment: " + response.status);
        }

        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create experiment");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  return { createExperiment, loading, error };
}

export function useStartExperiment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const startExperiment = useCallback(
    async (id: string): Promise<Experiment | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          API_URL + "/api/admin/prompts/experiments/" + id + "/start",
          { method: "POST" }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Failed to start experiment: " + response.status);
        }

        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start experiment");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  return { startExperiment, loading, error };
}

export function useStopExperiment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const stopExperiment = useCallback(
    async (id: string, markCompleted = true): Promise<Experiment | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          API_URL + "/api/admin/prompts/experiments/" + id + "/stop?mark_completed=" + markCompleted,
          { method: "POST" }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Failed to stop experiment: " + response.status);
        }

        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to stop experiment");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authenticatedFetch]
  );

  return { stopExperiment, loading, error };
}

export function useExperimentResults(id: string) {
  const [results, setResults] = useState<ExperimentResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchResults = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch(
        API_URL + "/api/admin/prompts/experiments/" + id + "/results"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch experiment results: " + response.status);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch experiment results");
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, id]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return { results, loading, error, refetch: fetchResults };
}
