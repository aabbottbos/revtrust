"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  AlertCircle,
  AlertTriangle,
  Info,
  Globe,
  User,
  Building2,
} from "lucide-react";
import type { RulesSummary } from "@/hooks/useRules";

interface RulesSummaryCardProps {
  summary: RulesSummary | null;
  loading?: boolean;
}

export function RulesSummaryCard({ summary, loading }: RulesSummaryCardProps) {
  if (loading || !summary) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-slate-200 rounded" />
            <div className="h-20 bg-slate-200 rounded" />
            <div className="h-20 bg-slate-200 rounded" />
          </div>
        </div>
      </Card>
    );
  }

  const severityData = [
    {
      label: "Critical",
      count: summary.bySeverity.CRITICAL || 0,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      label: "Warning",
      count: summary.bySeverity.WARNING || 0,
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      label: "Info",
      count: summary.bySeverity.INFO || 0,
      icon: Info,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  const scopeData = [
    {
      label: "Global",
      count: summary.byScope.global || 0,
      icon: Globe,
      color: "text-slate-600",
    },
    {
      label: "Team",
      count: summary.byScope.org || 0,
      icon: Building2,
      color: "text-purple-600",
    },
    {
      label: "Personal",
      count: summary.byScope.user || 0,
      icon: User,
      color: "text-green-600",
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-revtrust-blue" />
        <h3 className="font-semibold text-lg">Rules Overview</h3>
      </div>

      <div className="text-3xl font-bold text-slate-900 mb-6">
        {summary.totalRules} <span className="text-lg font-normal text-slate-500">active rules</span>
      </div>

      {/* By Severity */}
      <div className="mb-6">
        <div className="text-sm font-medium text-slate-500 mb-3">By Severity</div>
        <div className="grid grid-cols-3 gap-3">
          {severityData.map(({ label, count, icon: Icon, color, bgColor }) => (
            <div
              key={label}
              className={`${bgColor} rounded-lg p-3 text-center`}
            >
              <Icon className={`h-5 w-5 mx-auto ${color}`} />
              <div className={`text-2xl font-bold ${color}`}>{count}</div>
              <div className="text-xs text-slate-600">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* By Scope */}
      <div className="mb-6">
        <div className="text-sm font-medium text-slate-500 mb-3">By Scope</div>
        <div className="space-y-2">
          {scopeData.map(({ label, count, icon: Icon, color }) => {
            const percentage = summary.totalRules > 0
              ? (count / summary.totalRules) * 100
              : 0;
            return (
              <div key={label} className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-sm text-slate-600 w-16">{label}</span>
                <div className="flex-1">
                  <Progress value={percentage} className="h-2" />
                </div>
                <span className="text-sm font-medium text-slate-700 w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* By Category */}
      <div>
        <div className="text-sm font-medium text-slate-500 mb-3">By Category</div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(summary.byCategory).map(([category, count]) => (
            <div
              key={category}
              className="flex items-center justify-between text-sm px-2 py-1 bg-slate-50 rounded"
            >
              <span className="text-slate-600 truncate">
                {category.replace("_", " ")}
              </span>
              <span className="font-medium text-slate-900">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
