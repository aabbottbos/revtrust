"use client";

import { useState } from "react";
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
import type { GlobalRule, RuleCondition } from "@/hooks/useRules";

interface ThresholdEditorProps {
  rule: GlobalRule | null;
  open: boolean;
  onClose: () => void;
  onSave: (ruleId: string, thresholdOverrides: Record<string, unknown>) => void;
  saving?: boolean;
}

export function ThresholdEditor({
  rule,
  open,
  onClose,
  onSave,
  saving,
}: ThresholdEditorProps) {
  const [value, setValue] = useState<string>("");

  // Reset value when rule changes
  const handleOpen = (isOpen: boolean) => {
    if (isOpen && rule) {
      const currentValue = findThresholdValue(rule.effectiveCondition || rule.condition);
      setValue(currentValue !== null ? String(currentValue) : "");
    }
    if (!isOpen) {
      onClose();
    }
  };

  const handleSave = () => {
    if (!rule) return;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    onSave(rule.ruleId, { value: numValue });
  };

  // Find the threshold value in a condition
  function findThresholdValue(condition: RuleCondition): number | null {
    if (condition.value !== undefined && typeof condition.value === "number") {
      return condition.value;
    }
    if (condition.all) {
      for (const c of condition.all) {
        const v = findThresholdValue(c);
        if (v !== null) return v;
      }
    }
    if (condition.any) {
      for (const c of condition.any) {
        const v = findThresholdValue(c);
        if (v !== null) return v;
      }
    }
    return null;
  }

  // Check if rule has a threshold that can be edited
  const hasThreshold = rule ? findThresholdValue(rule.condition) !== null : false;

  if (!rule) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Threshold</DialogTitle>
          <DialogDescription>
            Modify the threshold value for &quot;{rule.name}&quot;
          </DialogDescription>
        </DialogHeader>

        {hasThreshold ? (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Current condition</Label>
              <div className="bg-slate-50 p-3 rounded-md">
                <ConditionPreview condition={rule.condition} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">New threshold value</Label>
              <Input
                id="threshold"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter new value"
              />
              <p className="text-xs text-slate-500">
                Original value: {findThresholdValue(rule.condition)}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4 text-sm text-slate-500">
            This rule doesn&apos;t have an editable threshold value.
            You can only enable or disable this rule.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {hasThreshold && (
            <Button onClick={handleSave} disabled={saving || !value}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConditionPreview({ condition }: { condition: RuleCondition }) {
  if (condition.all) {
    return (
      <div className="text-sm">
        <span className="font-medium">ALL</span> of:
        <ul className="ml-4 list-disc">
          {condition.all.map((c, i) => (
            <li key={i}>
              <ConditionPreview condition={c} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (condition.any) {
    return (
      <div className="text-sm">
        <span className="font-medium">ANY</span> of:
        <ul className="ml-4 list-disc">
          {condition.any.map((c, i) => (
            <li key={i}>
              <ConditionPreview condition={c} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <code className="text-sm">
      {condition.field} {condition.operator}
      {condition.value !== undefined && (
        <span className="text-orange-600 font-medium">
          {" "}
          {typeof condition.value === "object"
            ? JSON.stringify(condition.value)
            : String(condition.value)}
        </span>
      )}
    </code>
  );
}
