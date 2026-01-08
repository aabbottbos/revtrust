"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { RuleCard } from "./RuleCard";
import type {
  GlobalRule,
  CustomRule,
  RuleCategory,
  RuleSeverity,
} from "@/hooks/useRules";

interface RulesListProps {
  globalRules: GlobalRule[];
  customRules: CustomRule[];
  onToggleGlobal: (ruleId: string, enabled: boolean, isOverridden: boolean) => void;
  onToggleCustom: (ruleId: string, enabled: boolean) => void;
  onEditGlobal?: (rule: GlobalRule) => void;
  onEditCustom?: (rule: CustomRule) => void;
  onDeleteCustom?: (ruleId: string) => void;
  onResetOverride?: (ruleId: string) => void;
  isToggling?: boolean;
  showGlobal?: boolean;
  showCustom?: boolean;
}

export function RulesList({
  globalRules,
  customRules,
  onToggleGlobal,
  onToggleCustom,
  onEditGlobal,
  onEditCustom,
  onDeleteCustom,
  onResetOverride,
  isToggling,
  showGlobal = true,
  showCustom = true,
}: RulesListProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [enabledFilter, setEnabledFilter] = useState<string>("all");

  const filteredGlobalRules = useMemo(() => {
    if (!showGlobal) return [];

    return globalRules.filter((rule) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          rule.name.toLowerCase().includes(searchLower) ||
          rule.ruleId.toLowerCase().includes(searchLower) ||
          rule.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (categoryFilter !== "all" && rule.category !== categoryFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== "all" && rule.severity !== severityFilter) {
        return false;
      }

      // Enabled filter
      if (enabledFilter === "enabled" && !rule.enabled) return false;
      if (enabledFilter === "disabled" && rule.enabled) return false;
      if (enabledFilter === "modified" && !rule.isOverridden) return false;

      return true;
    });
  }, [globalRules, search, categoryFilter, severityFilter, enabledFilter, showGlobal]);

  const filteredCustomRules = useMemo(() => {
    if (!showCustom) return [];

    return customRules.filter((rule) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          rule.name.toLowerCase().includes(searchLower) ||
          rule.ruleId.toLowerCase().includes(searchLower) ||
          rule.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (categoryFilter !== "all" && rule.category !== categoryFilter) {
        return false;
      }

      // Severity filter
      if (severityFilter !== "all" && rule.severity !== severityFilter) {
        return false;
      }

      // Enabled filter
      if (enabledFilter === "enabled" && !rule.enabled) return false;
      if (enabledFilter === "disabled" && rule.enabled) return false;

      return true;
    });
  }, [customRules, search, categoryFilter, severityFilter, enabledFilter, showCustom]);

  const categories: RuleCategory[] = [
    "DATA_QUALITY",
    "SALES_HYGIENE",
    "FORECASTING",
    "PROGRESSION",
    "ENGAGEMENT",
    "COMPLIANCE",
  ];

  const severities: RuleSeverity[] = ["CRITICAL", "WARNING", "INFO"];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            {severities.map((sev) => (
              <SelectItem key={sev} value={sev}>
                {sev}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={enabledFilter} onValueChange={setEnabledFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
            {showGlobal && <SelectItem value="modified">Modified</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-slate-500">
        Showing {filteredGlobalRules.length + filteredCustomRules.length} rules
        {filteredGlobalRules.length > 0 && showGlobal && (
          <span> ({filteredGlobalRules.length} global)</span>
        )}
        {filteredCustomRules.length > 0 && showCustom && (
          <span> ({filteredCustomRules.length} custom)</span>
        )}
      </div>

      {/* Rules list */}
      <div className="space-y-3">
        {/* Custom rules first (higher priority) */}
        {filteredCustomRules.map((rule) => (
          <RuleCard
            key={`custom-${rule.id}`}
            rule={rule}
            type="custom"
            onToggle={(enabled) => onToggleCustom(rule.id, enabled)}
            onEdit={onEditCustom ? () => onEditCustom(rule) : undefined}
            onDelete={onDeleteCustom ? () => onDeleteCustom(rule.id) : undefined}
            isToggling={isToggling}
          />
        ))}

        {/* Global rules */}
        {filteredGlobalRules.map((rule) => (
          <RuleCard
            key={`global-${rule.ruleId}`}
            rule={rule}
            type="global"
            onToggle={(enabled) =>
              onToggleGlobal(rule.ruleId, enabled, rule.isOverridden)
            }
            onEdit={onEditGlobal ? () => onEditGlobal(rule) : undefined}
            onResetOverride={
              rule.isOverridden && onResetOverride
                ? () => onResetOverride(rule.ruleId)
                : undefined
            }
            isToggling={isToggling}
          />
        ))}

        {/* Empty state */}
        {filteredGlobalRules.length === 0 && filteredCustomRules.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No rules match your filters
          </div>
        )}
      </div>
    </div>
  );
}
