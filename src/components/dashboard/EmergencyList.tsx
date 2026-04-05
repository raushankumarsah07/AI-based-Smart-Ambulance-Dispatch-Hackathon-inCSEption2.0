"use client";

import { cn, severityColor, severityLabel } from "@/lib/utils";
import type { Emergency, SeverityLevel } from "@/lib/types";
import { MapPin, Clock, AlertTriangle } from "lucide-react";

interface EmergencyListProps {
  emergencies: Emergency[];
}

const SEVERITY_ORDER: Record<SeverityLevel, number> = {
  P1: 0,
  P2: 1,
  P3: 2,
  P4: 3,
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  dispatched: "bg-orange-500/15 text-orange-400",
  in_progress: "bg-blue-500/15 text-blue-400",
  completed: "bg-green-500/15 text-green-400",
};

function getTimeSince(date: Date): string {
  const now = new Date();
  const created = date instanceof Date ? date : new Date(date);
  const diffMs = now.getTime() - created.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ${diffMin % 60}m ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "..." : str;
}

export default function EmergencyList({ emergencies }: EmergencyListProps) {
  const sorted = [...emergencies].sort((a, b) => {
    const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="flex flex-col gap-2 overflow-y-auto pr-1" style={{ maxHeight: "100%" }}>
      {sorted.map((emg) => {
        const sevColor = severityColor(emg.severity);

        return (
          <div
            key={emg.id}
            className={cn(
              "relative rounded-lg border border-card-border bg-card/60 px-3 py-2.5 transition-all",
              "hover:border-accent/40 hover:bg-card"
            )}
          >
            {/* Left accent */}
            <div
              className="absolute left-0 top-0 h-full w-0.5 rounded-l-lg"
              style={{ backgroundColor: sevColor }}
            />

            {/* Top row: severity badge + status + time */}
            <div className="flex items-center gap-2 mb-1.5">
              {/* Severity badge */}
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border"
                style={{
                  backgroundColor: `${sevColor}15`,
                  color: sevColor,
                  borderColor: `${sevColor}30`,
                }}
              >
                <AlertTriangle className="h-2.5 w-2.5" />
                {emg.severity} {severityLabel(emg.severity)}
              </span>

              {/* Status pill */}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  STATUS_STYLE[emg.status] || "bg-gray-500/15 text-gray-400"
                )}
              >
                {emg.status.replace("_", " ")}
              </span>

              {/* Time */}
              <div className="ml-auto flex items-center gap-1 text-muted">
                <Clock className="h-3 w-3" />
                <span className="text-[10px]">{getTimeSince(emg.createdAt)}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-foreground mb-1 leading-relaxed">
              {truncate(emg.description, 80)}
            </p>

            {/* Address */}
            <div className="flex items-center gap-1 text-muted">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="text-[10px] truncate">{emg.address}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
