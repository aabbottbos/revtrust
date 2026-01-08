"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { ConditionBuilder } from "./ConditionBuilder";
import type {
  CustomRule,
  CreateCustomRuleData,
  UpdateCustomRuleData,
  RuleCategory,
  RuleSeverity,
  RuleCondition,
  RuleMetadata,
} from "@/hooks/useRules";

interface RuleEditorProps {
  rule?: CustomRule | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateCustomRuleData | UpdateCustomRuleData) => void;
  saving?: boolean;
  metadata: RuleMetadata | null;
  orgId?: string;
}

export function RuleEditor({
  rule,
  open,
  onClose,
  onSave,
  saving,
  metadata,
  orgId,
}: RuleEditorProps) {
  const isEditing = !!rule;

  const [formData, setFormData] = useState<{
    ruleId: string;
    name: string;
    category: RuleCategory;
    severity: RuleSeverity;
    description: string;
    condition: RuleCondition;
    message: string;
    remediation: string;
    remediationOwner: string;
    automatable: boolean;
    applicableStages: string[];
    priority: number;
    enabled: boolean;
    isOrgRule: boolean;
  }>({
    ruleId: "",
    name: "",
    category: "DATA_QUALITY",
    severity: "WARNING",
    description: "",
    condition: { field: "", operator: "" },
    message: "",
    remediation: "",
    remediationOwner: "Rep",
    automatable: false,
    applicableStages: [],
    priority: 0,
    enabled: true,
    isOrgRule: false,
  });

  const [stageInput, setStageInput] = useState("");

  // Reset form when rule changes
  useEffect(() => {
    if (rule) {
      setFormData({
        ruleId: rule.ruleId,
        name: rule.name,
        category: rule.category,
        severity: rule.severity,
        description: rule.description,
        condition: rule.condition,
        message: rule.message,
        remediation: rule.remediation || "",
        remediationOwner: rule.remediationOwner || "Rep",
        automatable: rule.automatable,
        applicableStages: rule.applicableStages || [],
        priority: rule.priority,
        enabled: rule.enabled,
        isOrgRule: !!rule.orgId,
      });
    } else {
      // Reset for new rule
      setFormData({
        ruleId: "",
        name: "",
        category: "DATA_QUALITY",
        severity: "WARNING",
        description: "",
        condition: { field: metadata?.fields[0]?.name || "", operator: metadata?.operators[0]?.name || "" },
        message: "",
        remediation: "",
        remediationOwner: "Rep",
        automatable: false,
        applicableStages: [],
        priority: 0,
        enabled: true,
        isOrgRule: false,
      });
    }
  }, [rule, metadata]);

  const handleSubmit = () => {
    if (isEditing) {
      const updateData: UpdateCustomRuleData = {
        name: formData.name,
        category: formData.category,
        severity: formData.severity,
        description: formData.description,
        condition: formData.condition,
        message: formData.message,
        remediation: formData.remediation || undefined,
        remediationOwner: formData.remediationOwner,
        automatable: formData.automatable,
        applicableStages: formData.applicableStages,
        priority: formData.priority,
        enabled: formData.enabled,
      };
      onSave(updateData);
    } else {
      const createData: CreateCustomRuleData = {
        ruleId: formData.ruleId,
        name: formData.name,
        category: formData.category,
        severity: formData.severity,
        description: formData.description,
        condition: formData.condition,
        message: formData.message,
        remediation: formData.remediation || undefined,
        remediationOwner: formData.remediationOwner,
        automatable: formData.automatable,
        applicableStages: formData.applicableStages,
        priority: formData.priority,
        enabled: formData.enabled,
        orgId: formData.isOrgRule ? orgId : undefined,
      };
      onSave(createData);
    }
  };

  const addStage = () => {
    if (stageInput && !formData.applicableStages.includes(stageInput)) {
      setFormData({
        ...formData,
        applicableStages: [...formData.applicableStages, stageInput],
      });
      setStageInput("");
    }
  };

  const removeStage = (stage: string) => {
    setFormData({
      ...formData,
      applicableStages: formData.applicableStages.filter((s) => s !== stage),
    });
  };

  const isValid =
    formData.ruleId &&
    formData.name &&
    formData.description &&
    formData.message &&
    formData.condition.field &&
    formData.condition.operator;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Rule" : "Create Custom Rule"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the rule configuration below."
              : "Define a new custom rule that will be applied during analysis."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="condition">Condition</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            {/* Rule ID (only for new rules) */}
            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="ruleId">Rule ID</Label>
                <Input
                  id="ruleId"
                  value={formData.ruleId}
                  onChange={(e) =>
                    setFormData({ ...formData, ruleId: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })
                  }
                  placeholder="e.g., custom_001"
                  pattern="[a-zA-Z0-9_]+"
                />
                <p className="text-xs text-slate-500">
                  Unique identifier (letters, numbers, underscores only)
                </p>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Large Deal Missing Stakeholder"
              />
            </div>

            {/* Category & Severity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as RuleCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {metadata?.categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(v) => setFormData({ ...formData, severity: v as RuleSeverity })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {metadata?.severities.map((sev) => (
                      <SelectItem key={sev} value={sev}>
                        {sev}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this rule checks for..."
                rows={2}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Violation Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Message shown when this rule is violated..."
                rows={2}
              />
            </div>
          </TabsContent>

          <TabsContent value="condition" className="mt-4">
            {metadata && (
              <ConditionBuilder
                condition={formData.condition}
                onChange={(condition) => setFormData({ ...formData, condition })}
                operators={metadata.operators}
                fields={metadata.fields}
              />
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            {/* Remediation */}
            <div className="space-y-2">
              <Label htmlFor="remediation">Remediation (optional)</Label>
              <Textarea
                id="remediation"
                value={formData.remediation}
                onChange={(e) => setFormData({ ...formData, remediation: e.target.value })}
                placeholder="Suggested fix for this violation..."
                rows={2}
              />
            </div>

            {/* Remediation Owner */}
            <div className="space-y-2">
              <Label>Remediation Owner</Label>
              <Select
                value={formData.remediationOwner}
                onValueChange={(v) => setFormData({ ...formData, remediationOwner: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rep">Rep</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Applicable Stages */}
            <div className="space-y-2">
              <Label>Applicable Stages (leave empty for all)</Label>
              <div className="flex gap-2">
                <Select value={stageInput} onValueChange={setStageInput}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {metadata?.stages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                    <SelectItem value="all_except_closed">All except Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addStage} disabled={!stageInput}>
                  Add
                </Button>
              </div>
              {formData.applicableStages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.applicableStages.map((stage) => (
                    <Badge key={stage} variant="secondary" className="gap-1">
                      {stage}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeStage(stage)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority (0-100)</Label>
              <Input
                id="priority"
                type="number"
                min={0}
                max={100}
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-slate-500">
                Higher priority rules are evaluated first
              </p>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Automatable</Label>
                  <p className="text-xs text-slate-500">
                    Can this violation be fixed automatically?
                  </p>
                </div>
                <Switch
                  checked={formData.automatable}
                  onCheckedChange={(v) => setFormData({ ...formData, automatable: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enabled</Label>
                  <p className="text-xs text-slate-500">
                    Should this rule be active?
                  </p>
                </div>
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(v) => setFormData({ ...formData, enabled: v })}
                />
              </div>

              {!isEditing && orgId && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Team Rule</Label>
                    <p className="text-xs text-slate-500">
                      Apply this rule to all team members?
                    </p>
                  </div>
                  <Switch
                    checked={formData.isOrgRule}
                    onCheckedChange={(v) => setFormData({ ...formData, isOrgRule: v })}
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !isValid}>
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
