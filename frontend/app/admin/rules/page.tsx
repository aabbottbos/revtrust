"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Globe,
  User,
  Building2,
  RefreshCw,
  AlertCircle,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  RulesList,
  RuleEditor,
  ThresholdEditor,
  RulesSummaryCard,
} from "@/components/rules";
import {
  useRules,
  useRuleMetadata,
  useRulesSummary,
  useCreateCustomRule,
  useUpdateCustomRule,
  useDeleteCustomRule,
  useGlobalRuleOverride,
  useToggleRule,
  type GlobalRule,
  type CustomRule,
  type CreateCustomRuleData,
  type UpdateCustomRuleData,
} from "@/hooks/useRules";
import { useMyOrganizations } from "@/hooks/useOrganization";

export default function RulesPage() {
  const router = useRouter();

  // Data fetching
  const { data: rulesData, loading: rulesLoading, error: rulesError, refetch: refetchRules } = useRules();
  const { metadata, loading: metadataLoading } = useRuleMetadata();
  const { summary, loading: summaryLoading, refetch: refetchSummary } = useRulesSummary();
  const { organizations } = useMyOrganizations();

  // Mutations
  const { createRule, loading: creating, error: createError } = useCreateCustomRule();
  const { updateRule, loading: updating, error: updateError } = useUpdateCustomRule();
  const { deleteRule, loading: deleting } = useDeleteCustomRule();
  const { createOverride, removeOverride, loading: overriding } = useGlobalRuleOverride();
  const { toggleGlobalRule, toggleCustomRule, loading: toggling } = useToggleRule();

  // UI state
  const [activeTab, setActiveTab] = useState("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [thresholdEditorOpen, setThresholdEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CustomRule | null>(null);
  const [editingGlobalRule, setEditingGlobalRule] = useState<GlobalRule | null>(null);

  // Get user's org (if any)
  const userOrg = organizations.length > 0 ? organizations[0] : null;

  // Handlers
  const handleToggleGlobal = useCallback(
    async (ruleId: string, enabled: boolean, isOverridden: boolean) => {
      await toggleGlobalRule(ruleId, !enabled, isOverridden);
      refetchRules();
      refetchSummary();
    },
    [toggleGlobalRule, refetchRules, refetchSummary]
  );

  const handleToggleCustom = useCallback(
    async (ruleId: string, enabled: boolean) => {
      await toggleCustomRule(ruleId, !enabled);
      refetchRules();
      refetchSummary();
    },
    [toggleCustomRule, refetchRules, refetchSummary]
  );

  const handleCreateRule = useCallback(
    async (data: CreateCustomRuleData | UpdateCustomRuleData) => {
      if (editingRule) {
        // Update existing rule
        const result = await updateRule(editingRule.id, data as UpdateCustomRuleData);
        if (result) {
          setEditorOpen(false);
          setEditingRule(null);
          refetchRules();
          refetchSummary();
        }
      } else {
        // Create new rule
        const result = await createRule(data as CreateCustomRuleData);
        if (result) {
          setEditorOpen(false);
          refetchRules();
          refetchSummary();
        }
      }
    },
    [editingRule, createRule, updateRule, refetchRules, refetchSummary]
  );

  const handleDeleteRule = useCallback(
    async (ruleId: string) => {
      if (confirm("Are you sure you want to delete this rule?")) {
        const success = await deleteRule(ruleId);
        if (success) {
          refetchRules();
          refetchSummary();
        }
      }
    },
    [deleteRule, refetchRules, refetchSummary]
  );

  const handleResetOverride = useCallback(
    async (ruleId: string) => {
      const success = await removeOverride(ruleId);
      if (success) {
        refetchRules();
        refetchSummary();
      }
    },
    [removeOverride, refetchRules, refetchSummary]
  );

  const handleSaveThreshold = useCallback(
    async (ruleId: string, thresholdOverrides: Record<string, unknown>) => {
      const success = await createOverride(ruleId, {
        enabled: true,
        thresholdOverrides,
      });
      if (success) {
        setThresholdEditorOpen(false);
        setEditingGlobalRule(null);
        refetchRules();
      }
    },
    [createOverride, refetchRules]
  );

  const handleEditGlobal = useCallback((rule: GlobalRule) => {
    setEditingGlobalRule(rule);
    setThresholdEditorOpen(true);
  }, []);

  const handleEditCustom = useCallback((rule: CustomRule) => {
    setEditingRule(rule);
    setEditorOpen(true);
  }, []);

  const handleNewRule = useCallback(() => {
    setEditingRule(null);
    setEditorOpen(true);
  }, []);

  // Loading state
  if (rulesLoading || metadataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="container mx-auto max-w-7xl">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Skeleton className="h-80" />
            </div>
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (rulesError) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="container mx-auto max-w-7xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load rules: {rulesError}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const globalRules = rulesData?.globalRules || [];
  const customRules = rulesData?.customRules || [];
  const userRules = customRules.filter((r) => r.userId && !r.orgId);
  const orgRules = customRules.filter((r) => r.orgId);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Shield className="h-6 w-6 text-revtrust-blue" />
                Business Rules Configuration
              </h1>
              <p className="text-slate-500 text-sm">
                Manage global rules and create custom rules for your analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                refetchRules();
                refetchSummary();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleNewRule}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </div>
        </div>

        {/* Error alerts */}
        {(createError || updateError) && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{createError || updateError}</AlertDescription>
          </Alert>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <RulesSummaryCard summary={summary} loading={summaryLoading} />
          </div>

          {/* Main area - Rules list */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all" className="flex items-center gap-1">
                  All Rules
                  <span className="ml-1 text-xs bg-slate-200 px-1.5 py-0.5 rounded">
                    {globalRules.length + customRules.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="global" className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  Global
                  <span className="ml-1 text-xs bg-slate-200 px-1.5 py-0.5 rounded">
                    {globalRules.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="personal" className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  My Rules
                  <span className="ml-1 text-xs bg-slate-200 px-1.5 py-0.5 rounded">
                    {userRules.length}
                  </span>
                </TabsTrigger>
                {userOrg && (
                  <TabsTrigger value="team" className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    Team Rules
                    <span className="ml-1 text-xs bg-slate-200 px-1.5 py-0.5 rounded">
                      {orgRules.length}
                    </span>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="all">
                <RulesList
                  globalRules={globalRules}
                  customRules={customRules}
                  onToggleGlobal={handleToggleGlobal}
                  onToggleCustom={handleToggleCustom}
                  onEditGlobal={handleEditGlobal}
                  onEditCustom={handleEditCustom}
                  onDeleteCustom={handleDeleteRule}
                  onResetOverride={handleResetOverride}
                  isToggling={toggling || overriding}
                />
              </TabsContent>

              <TabsContent value="global">
                <RulesList
                  globalRules={globalRules}
                  customRules={[]}
                  onToggleGlobal={handleToggleGlobal}
                  onToggleCustom={handleToggleCustom}
                  onEditGlobal={handleEditGlobal}
                  onResetOverride={handleResetOverride}
                  isToggling={toggling || overriding}
                  showCustom={false}
                />
              </TabsContent>

              <TabsContent value="personal">
                <RulesList
                  globalRules={[]}
                  customRules={userRules}
                  onToggleGlobal={handleToggleGlobal}
                  onToggleCustom={handleToggleCustom}
                  onEditCustom={handleEditCustom}
                  onDeleteCustom={handleDeleteRule}
                  isToggling={toggling}
                  showGlobal={false}
                />
                {userRules.length === 0 && (
                  <div className="text-center py-12">
                    <User className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">
                      No personal rules yet
                    </h3>
                    <p className="text-slate-500 mb-4">
                      Create custom rules that apply only to your analyses
                    </p>
                    <Button onClick={handleNewRule}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Rule
                    </Button>
                  </div>
                )}
              </TabsContent>

              {userOrg && (
                <TabsContent value="team">
                  <RulesList
                    globalRules={[]}
                    customRules={orgRules}
                    onToggleGlobal={handleToggleGlobal}
                    onToggleCustom={handleToggleCustom}
                    onEditCustom={handleEditCustom}
                    onDeleteCustom={handleDeleteRule}
                    isToggling={toggling}
                    showGlobal={false}
                  />
                  {orgRules.length === 0 && (
                    <div className="text-center py-12">
                      <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <h3 className="text-lg font-medium text-slate-700 mb-2">
                        No team rules yet
                      </h3>
                      <p className="text-slate-500 mb-4">
                        Create rules that apply to all {userOrg.name} members
                      </p>
                      <Button onClick={handleNewRule}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Team Rule
                      </Button>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>

        {/* Rule Editor Modal */}
        <RuleEditor
          rule={editingRule}
          open={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setEditingRule(null);
          }}
          onSave={handleCreateRule}
          saving={creating || updating}
          metadata={metadata}
          orgId={userOrg?.id}
        />

        {/* Threshold Editor Modal */}
        <ThresholdEditor
          rule={editingGlobalRule}
          open={thresholdEditorOpen}
          onClose={() => {
            setThresholdEditorOpen(false);
            setEditingGlobalRule(null);
          }}
          onSave={handleSaveThreshold}
          saving={overriding}
        />
      </div>
    </div>
  );
}
