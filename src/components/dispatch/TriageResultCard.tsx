"use client";

import { useEffect, useState } from "react";
import { Brain, Shield, Activity, Wrench } from "lucide-react";
import { cn, severityColor, severityLabel } from "@/lib/utils";
import type { TriageResult } from "@/lib/types";

interface TriageResultCardProps {
  result: TriageResult;
}

export default function TriageResultCard({ result }: TriageResultCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const color = severityColor(result.severity);
  const label = severityLabel(result.severity);

  return (
    <div
      className={cn(
        "rounded-xl border bg-[#111827] p-6 transition-all duration-500",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
      style={{
        borderColor: `${color}40`,
        boxShadow: `0 0 20px ${color}15, 0 0 40px ${color}08`,
      }}
    >
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <Brain className="h-5 w-5 text-cyan-400" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
          AI Triage Analysis
        </h3>
      </div>

      {/* Severity badge + Specialization */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {/* Large severity indicator */}
        <div
          className="flex items-center gap-2.5 rounded-lg px-4 py-2.5"
          style={{
            backgroundColor: `${color}15`,
            border: `1px solid ${color}40`,
          }}
        >
          <div
            className="h-4 w-4 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}80`,
            }}
          />
          <span
            className="text-lg font-bold"
            style={{ color }}
          >
            {result.severity}
          </span>
          <span className="text-sm font-medium text-gray-300">{label}</span>
        </div>

        {/* Specialization tag */}
        <div className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2">
          <Shield className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-sm font-medium text-cyan-300">
            {result.specialization}
          </span>
        </div>
      </div>

      {/* Urgency score */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Urgency Score
            </span>
          </div>
          <span
            className="text-sm font-bold"
            style={{ color }}
          >
            {result.urgencyScore}/100
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: visible ? `${result.urgencyScore}%` : "0%",
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}60`,
            }}
          />
        </div>
      </div>

      {/* AI Reasoning */}
      <div className="mb-5 rounded-lg border border-[#1e293b] bg-gray-900/60 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
            AI Reasoning
          </span>
        </div>
        <p className="text-sm leading-relaxed text-gray-300">
          {result.reasoning}
        </p>
      </div>

      {/* Recommended Equipment */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Wrench className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Recommended Equipment
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {result.recommendedEquipment.map((equip) => (
            <span
              key={equip}
              className="rounded-full border border-[#1e293b] bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300"
            >
              {equip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
