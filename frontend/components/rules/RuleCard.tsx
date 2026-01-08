"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  Info,
  User,
  Building2,
  Globe,
} from "lucide-react";
import type { GlobalRule, CustomRule, RuleCondition } from "@/hooks/useRules";

interface RuleCardProps {
  rule: GlobalRule | CustomRule;
  type: "global" | "custom";
  onToggle?: (enabled: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onResetOverride?: () => void;
  isToggling?: boolean;
}

export function RuleCard({
  rule,
  type,
  onToggle,
  onEdit,
  onDelete,
  onResetOverride,
  isToggling,
}: RuleCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isGlobal = type === "global";
  const globalRule = isGlobal ? (rule as GlobalRule) : null;
  const customRule = !isGlobal ? (rule as CustomRule) : null;

  const severityColors: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-800 border-red-200",
    WARNING: "bg-amber-100 text-amber-800 border-amber-200",
    INFO: "bg-blue-100 text-blue-800 border-blue-200",
  };

  const categoryColors: Record<string, string> = {
    DATA_QUALITY: "bg-purple-100 text-purple-800",
    SALES_HYGIENE: "bg-green-100 text-green-800",
    FORECASTING: "bg-blue-100 text-blue-800",
    PROGRESSION: "bg-orange-100 text-orange-800",
    ENGAGEMENT: "bg-pink-100 text-pink-800",
    COMPLIANCE: "bg-slate-100 text-slate-800",
  };

  const SeverityIcon = {
    CRITICAL: AlertCircle,
    WARNING: AlertTriangle,
    INFO: Info,
  }[rule.severity];

  const ScopeIcon = isGlobal
    ? Globe
    : customRule?.orgId
    ? Building2
    : User;

  const scopeLabel = isGlobal
    ? "Global"
    : customRule?.orgId
    ? "Team"
    : "Personal";

  return (
    <Card
      className={`p-4 transition-all ${
        rule.enabled ? "bg-white" : "bg-slate-50 opacity-75"
      }`}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-start gap-4">
          {/* Toggle */}
          <div className="pt-1">
            <Switch
              checked={rule.enabled}
              onCheckedChange={onToggle}
              disabled={isToggling}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <code className="text-xs text-slate-500 font-mono">
                {isGlobal ? globalRule?.ruleId : customRule?.ruleId}
              </code>

              <span className="font-medium text-slate-900 truncate">
                {rule.name}
              </span>

              <Badge
                variant="outline"
                className={severityColors[rule.severity]}
              >
                <SeverityIcon className="h-3 w-3 mr-1" />
                {rule.severity}
              </Badge>

              <Badge variant="secondary" className={categoryColors[rule.category]}>
                {rule.category.replace("_", " ")}
              </Badge>

              <Badge variant="outline" className="text-xs">
                <ScopeIcon className="h-3 w-3 mr-1" />
                {scopeLabel}
              </Badge>

              {globalRule?.isOverridden && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Modified
                </Badge>
              )}
            </div>

            <CollapsibleContent className="mt-3 space-y-3">
              {/* Description */}
              <p className="text-sm text-slate-600">{rule.description}</p>

              {/* Condition display */}
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs font-medium text-slate-500 mb-1">
                  Condition
                </div>
                <ConditionDisplay
                  condition={
                    globalRule?.effectiveCondition || rule.condition
                  }
                />
                {globalRule?.thresholdOverrides && (
                  <div className="mt-2 text-xs text-amber-600">
                    Threshold modified:{" "}
                    {JSON.stringify(globalRule.thresholdOverrides)}
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">
                  Message shown when violated
                </div>
                <p className="text-sm text-slate-700">{rule.message}</p>
              </div>

              {/* Remediation */}
              {rule.remediation && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    Remediation
                  </div>
                  <p className="text-sm text-slate-700">{rule.remediation}</p>
                </div>
              )}

              {/* Applicable stages */}
              {rule.applicableStages && rule.applicableStages.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    Applies to stages
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {rule.applicableStages.map((stage) => (
                      <Badge key={stage} variant="outline" className="text-xs">
                        {stage}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom rule metadata */}
              {customRule && (
                <div className="text-xs text-slate-500">
                  Created: {new Date(customRule.createdAt).toLocaleDateString()}
                  {" | "}
                  Priority: {customRule.priority}
                </div>
              )}
            </CollapsibleContent>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {globalRule?.isOverridden && onResetOverride && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onResetOverride}
                title="Reset to default"
              >
                <RotateCcw className="h-4 w-4 text-slate-500" />
              </Button>
            )}

            {(isGlobal || customRule) && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                title={isGlobal ? "Edit threshold" : "Edit rule"}
              >
                <Edit className="h-4 w-4 text-slate-500" />
              </Button>
            )}

            {!isGlobal && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                title="Delete rule"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      </Collapsible>
    </Card>
  );
}

function ConditionDisplay({ condition }: { condition: RuleCondition }) {
  if (condition.all) {
    return (
      <div className="text-sm font-mono">
        <span className="text-purple-600">ALL</span> of:
        <ul className="ml-4 list-disc">
          {condition.all.map((c, i) => (
            <li key={i}>
              <ConditionDisplay condition={c} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (condition.any) {
    return (
      <div className="text-sm font-mono">
        <span className="text-blue-600">ANY</span> of:
        <ul className="ml-4 list-disc">
          {condition.any.map((c, i) => (
            <li key={i}>
              <ConditionDisplay condition={c} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <code className="text-sm text-slate-700">
      <span className="text-green-700">{condition.field}</span>{" "}
      <span className="text-blue-600">{condition.operator}</span>
      {condition.value !== undefined && (
        <>
          {" "}
          <span className="text-orange-600">
            {typeof condition.value === "object"
              ? JSON.stringify(condition.value)
              : String(condition.value)}
          </span>
        </>
      )}
    </code>
  );
}
