"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, X } from "lucide-react";
import type { RuleCondition, OperatorInfo, FieldInfo } from "@/hooks/useRules";

interface ConditionBuilderProps {
  condition: RuleCondition;
  onChange: (condition: RuleCondition) => void;
  operators: OperatorInfo[];
  fields: FieldInfo[];
}

export function ConditionBuilder({
  condition,
  onChange,
  operators,
  fields,
}: ConditionBuilderProps) {
  const isCompound = condition.all || condition.any;

  const handleTypeChange = (type: "simple" | "all" | "any") => {
    if (type === "simple") {
      onChange({
        field: fields[0]?.name || "",
        operator: operators[0]?.name || "",
      });
    } else if (type === "all") {
      onChange({
        all: [{ field: fields[0]?.name || "", operator: operators[0]?.name || "" }],
      });
    } else {
      onChange({
        any: [{ field: fields[0]?.name || "", operator: operators[0]?.name || "" }],
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label>Condition Type</Label>
        <Select
          value={condition.all ? "all" : condition.any ? "any" : "simple"}
          onValueChange={(v) => handleTypeChange(v as "simple" | "all" | "any")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="simple">Simple (one condition)</SelectItem>
            <SelectItem value="all">ALL must match</SelectItem>
            <SelectItem value="any">ANY must match</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isCompound ? (
        <CompoundConditionBuilder
          conditions={condition.all || condition.any || []}
          type={condition.all ? "all" : "any"}
          onChange={(conditions) => {
            if (condition.all) {
              onChange({ all: conditions });
            } else {
              onChange({ any: conditions });
            }
          }}
          operators={operators}
          fields={fields}
        />
      ) : (
        <SimpleConditionBuilder
          condition={condition}
          onChange={onChange}
          operators={operators}
          fields={fields}
        />
      )}
    </div>
  );
}

interface SimpleConditionBuilderProps {
  condition: RuleCondition;
  onChange: (condition: RuleCondition) => void;
  operators: OperatorInfo[];
  fields: FieldInfo[];
}

function SimpleConditionBuilder({
  condition,
  onChange,
  operators,
  fields,
}: SimpleConditionBuilderProps) {
  const selectedOperator = operators.find((op) => op.name === condition.operator);
  const selectedField = fields.find((f) => f.name === condition.field);

  return (
    <Card className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {/* Field */}
        <div className="space-y-2">
          <Label>Field</Label>
          <Select
            value={condition.field || ""}
            onValueChange={(v) => onChange({ ...condition, field: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {fields.map((field) => (
                <SelectItem key={field.name} value={field.name}>
                  {field.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedField && (
            <p className="text-xs text-slate-500">{selectedField.description}</p>
          )}
        </div>

        {/* Operator */}
        <div className="space-y-2">
          <Label>Operator</Label>
          <Select
            value={condition.operator || ""}
            onValueChange={(v) => {
              const op = operators.find((o) => o.name === v);
              onChange({
                ...condition,
                operator: v,
                value: op?.requiresValue ? condition.value : undefined,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op.name} value={op.name}>
                  {op.name.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedOperator && (
            <p className="text-xs text-slate-500">{selectedOperator.description}</p>
          )}
        </div>

        {/* Value */}
        {selectedOperator?.requiresValue && (
          <div className="space-y-2">
            <Label>Value</Label>
            {selectedOperator.valueType === "list" ? (
              <Input
                value={
                  Array.isArray(condition.value)
                    ? condition.value.join(", ")
                    : String(condition.value || "")
                }
                onChange={(e) => {
                  const values = e.target.value.split(",").map((v) => v.trim());
                  onChange({ ...condition, value: values });
                }}
                placeholder="value1, value2, ..."
              />
            ) : (
              <Input
                type={selectedOperator.valueType === "number" ? "number" : "text"}
                value={String(condition.value || "")}
                onChange={(e) =>
                  onChange({
                    ...condition,
                    value:
                      selectedOperator.valueType === "number"
                        ? parseFloat(e.target.value) || 0
                        : e.target.value,
                  })
                }
                placeholder={selectedOperator.example || "Enter value"}
              />
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

interface CompoundConditionBuilderProps {
  conditions: RuleCondition[];
  type: "all" | "any";
  onChange: (conditions: RuleCondition[]) => void;
  operators: OperatorInfo[];
  fields: FieldInfo[];
}

function CompoundConditionBuilder({
  conditions,
  type,
  onChange,
  operators,
  fields,
}: CompoundConditionBuilderProps) {
  const addCondition = () => {
    onChange([
      ...conditions,
      { field: fields[0]?.name || "", operator: operators[0]?.name || "" },
    ]);
  };

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      onChange(conditions.filter((_, i) => i !== index));
    }
  };

  const updateCondition = (index: number, updated: RuleCondition) => {
    onChange(conditions.map((c, i) => (i === index ? updated : c)));
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600 font-medium">
        {type === "all" ? "ALL of these must match:" : "ANY of these must match:"}
      </div>

      {conditions.map((cond, index) => (
        <div key={index} className="relative">
          <SimpleConditionBuilder
            condition={cond}
            onChange={(updated) => updateCondition(index, updated)}
            operators={operators}
            fields={fields}
          />
          {conditions.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-100 hover:bg-red-200"
              onClick={() => removeCondition(index)}
            >
              <X className="h-3 w-3 text-red-600" />
            </Button>
          )}
          {index < conditions.length - 1 && (
            <div className="text-center text-sm text-slate-400 py-1">
              {type === "all" ? "AND" : "OR"}
            </div>
          )}
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addCondition}>
        <Plus className="h-4 w-4 mr-1" />
        Add condition
      </Button>
    </div>
  );
}
