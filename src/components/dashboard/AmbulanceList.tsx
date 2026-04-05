"use client";

import { cn } from "@/lib/utils";
import type { Ambulance, AmbulanceStatus } from "@/lib/types";
import { Truck, Fuel, Radio, CircleDot } from "lucide-react";
import { useState } from "react";

interface AmbulanceListProps {
  ambulances: Ambulance[];
  onSelect?: (id: string) => void;
}

const STATUS_COLOR: Record<AmbulanceStatus, string> = {
  available: "#22c55e",
  dispatched: "#f97316",
  en_route: "#f97316",
  at_scene: "#ef4444",
  transporting: "#3b82f6",
  at_hospital: "#8b5cf6",
};

const STATUS_LABEL: Record<AmbulanceStatus, string> = {
  available: "Available",
  dispatched: "Dispatched",
  en_route: "En Route",
  at_scene: "At Scene",
  transporting: "Transporting",
  at_hospital: "At Hospital",
};

function fuelColor(level: number): string {
  if (level > 50) return "#22c55e";
  if (level > 20) return "#f97316";
  return "#ef4444";
}

export default function AmbulanceList({ ambulances, onSelect }: AmbulanceListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleSelect(id: string) {
    setSelectedId(id);
    onSelect?.(id);
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto pr-1" style={{ maxHeight: "100%" }}>
      {ambulances.map((amb) => {
        const isSelected = selectedId === amb.id;
        const statusColor = STATUS_COLOR[amb.status];

        return (
          <button
            key={amb.id}
            onClick={() => handleSelect(amb.id)}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-card-border bg-card/60 px-3 py-2.5 text-left transition-all",
              "hover:border-accent/40 hover:bg-card",
              isSelected && "border-accent bg-accent/5 shadow-[0_0_10px_var(--accent-glow)]"
            )}
          >
            {/* Ambulance icon */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
            >
              <Truck className="h-4.5 w-4.5" />
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col gap-1 overflow-hidden">
              {/* Row 1: call sign + type badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground truncate">
                  {amb.callSign}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    amb.type === "ALS"
                      ? "bg-cyan-500/15 text-cyan-400"
                      : "bg-gray-500/15 text-gray-400"
                  )}
                >
                  {amb.type}
                </span>
              </div>

              {/* Row 2: status + fuel */}
              <div className="flex items-center gap-3">
                {/* Status */}
                <div className="flex items-center gap-1.5">
                  <CircleDot className="h-3 w-3" style={{ color: statusColor }} />
                  <span className="text-xs text-muted" style={{ color: statusColor }}>
                    {STATUS_LABEL[amb.status]}
                  </span>
                </div>

                {/* Fuel bar */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <Fuel className="h-3 w-3 text-muted" />
                  <div className="h-1.5 w-14 rounded-full bg-card-border overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${amb.fuelLevel}%`,
                        backgroundColor: fuelColor(amb.fuelLevel),
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted w-7 text-right">
                    {amb.fuelLevel}%
                  </span>
                </div>
              </div>
            </div>

            {/* Radio icon if on mission */}
            {amb.currentEmergencyId && (
              <Radio className="h-3.5 w-3.5 shrink-0 text-warning animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}
