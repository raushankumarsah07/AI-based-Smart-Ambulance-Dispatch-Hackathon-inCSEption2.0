"use client";

import { useEffect, useState } from "react";
import {
  Ambulance as AmbulanceIcon,
  Building2,
  Clock,
  Fuel,
  Zap,
  Bed,
  CheckCircle2,
  Loader2,
  MapPin,
  BadgeCheck,
} from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import type { Ambulance, Hospital, DispatchScore } from "@/lib/types";

interface DispatchResultCardProps {
  score: DispatchScore;
  ambulance: Ambulance;
  hospital: Hospital;
  rank: number;
  onConfirm?: () => void;
  isConfirming?: boolean;
}

interface ScoreBarProps {
  label: string;
  value: number;
  color?: string;
}

function ScoreBar({ label, value, color = "#06b6d4" }: ScoreBarProps) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const pct = Math.round(value * 100);

  return (
    <div className="mb-2.5 last:mb-0">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-400">{label}</span>
        <span className="text-[11px] font-bold text-gray-300">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: animated ? `${pct}%` : "0%",
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

export default function DispatchResultCard({
  score,
  ambulance,
  hospital,
  rank,
  onConfirm,
  isConfirming = false,
}: DispatchResultCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), rank * 150);
    return () => clearTimeout(timer);
  }, [rank]);

  const isTopPick = rank === 1;
  const borderColor = isTopPick ? "#06b6d4" : "#1e293b";

  const ambulanceTypeBadge =
    ambulance.type === "ALS"
      ? { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30" }
      : { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" };

  const statusColors: Record<string, string> = {
    available: "text-green-400",
    dispatched: "text-yellow-400",
    en_route: "text-orange-400",
    at_scene: "text-red-400",
    transporting: "text-orange-400",
    at_hospital: "text-blue-400",
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-[#111827] transition-all duration-500",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
      style={{
        borderColor,
        boxShadow: isTopPick ? "0 0 20px rgba(6, 182, 212, 0.12)" : "none",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          {isTopPick && (
            <span className="flex items-center gap-1 rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-400 border border-cyan-500/30">
              <Zap className="h-3 w-3" />
              Best Match
            </span>
          )}
          <span className="text-xs font-medium text-gray-500">
            Rank #{rank}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-400">Score</span>
          <span
            className={cn(
              "text-lg font-bold",
              isTopPick ? "text-cyan-400" : "text-gray-200"
            )}
          >
            {Math.round(score.totalScore * 100)}
          </span>
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
        {/* Left - Ambulance */}
        <div className="border-b border-[#1e293b] p-5 md:border-b-0 md:border-r">
          <div className="mb-3.5 flex items-center gap-2">
            <AmbulanceIcon className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Ambulance
            </h4>
          </div>

          {/* Call sign */}
          <p className="mb-2 text-base font-bold text-gray-100">
            {ambulance.callSign}
          </p>

          {/* Type badge + Status */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                ambulanceTypeBadge.bg,
                ambulanceTypeBadge.text,
                ambulanceTypeBadge.border
              )}
            >
              {ambulance.type}
            </span>
            <span
              className={cn(
                "text-xs font-medium capitalize",
                statusColors[ambulance.status] || "text-gray-400"
              )}
            >
              {ambulance.status.replace("_", " ")}
            </span>
          </div>

          {/* Fuel level */}
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Fuel className="h-3 w-3 text-gray-500" />
                <span className="text-[11px] text-gray-500">Fuel</span>
              </div>
              <span className="text-[11px] font-medium text-gray-400">
                {ambulance.fuelLevel}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${ambulance.fuelLevel}%`,
                  backgroundColor:
                    ambulance.fuelLevel > 50
                      ? "#22c55e"
                      : ambulance.fuelLevel > 25
                      ? "#eab308"
                      : "#ef4444",
                }}
              />
            </div>
          </div>

          {/* ETA */}
          <div className="flex items-center gap-2 rounded-lg border border-[#1e293b] bg-gray-900/60 px-3.5 py-2.5">
            <Clock className="h-4 w-4 text-cyan-400" />
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                ETA
              </span>
              <p className="text-lg font-bold text-cyan-300">
                {formatDuration(score.estimatedArrivalMinutes)}
              </p>
            </div>
            <div className="ml-auto text-right">
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                Distance
              </span>
              <p className="text-sm font-semibold text-gray-300">
                {score.distanceKm.toFixed(1)} km
              </p>
            </div>
          </div>
        </div>

        {/* Right - Hospital */}
        <div className="p-5">
          <div className="mb-3.5 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Hospital
            </h4>
          </div>

          {/* Hospital name */}
          <p className="mb-2 text-base font-bold text-gray-100">
            {hospital.name}
          </p>

          {/* Specializations */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {hospital.specializations.map((spec) => (
              <span
                key={spec}
                className="rounded-full border border-[#1e293b] bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-400"
              >
                {spec}
              </span>
            ))}
          </div>

          {/* Bed availability */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-[#1e293b] bg-gray-900/60 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Bed className="h-3 w-3 text-gray-500" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                  Emergency
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-gray-200">
                <span className="text-green-400">
                  {hospital.emergencyAvailable}
                </span>
                <span className="text-gray-500">/{hospital.emergencyBeds}</span>
              </p>
            </div>
            <div className="rounded-lg border border-[#1e293b] bg-gray-900/60 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Bed className="h-3 w-3 text-gray-500" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                  ICU
                </span>
              </div>
              <p className="mt-1 text-sm font-bold text-gray-200">
                <span className="text-green-400">
                  {hospital.icuAvailable}
                </span>
                <span className="text-gray-500">/{hospital.icuBeds}</span>
              </p>
            </div>
          </div>

          {/* Rating + contact */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <BadgeCheck className="h-3.5 w-3.5 text-yellow-500" />
              <span>{hospital.rating}/5</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                {hospital.location.lat.toFixed(3)}, {hospital.location.lng.toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="border-t border-[#1e293b] px-5 py-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Score Breakdown
        </h4>
        <ScoreBar label="Distance Score (30%)" value={score.breakdown.distanceScore} color="#06b6d4" />
        <ScoreBar label="Traffic Score (25%)" value={score.breakdown.trafficScore} color="#8b5cf6" />
        <ScoreBar label="Equipment Match (20%)" value={score.breakdown.equipmentScore} color="#f97316" />
        <ScoreBar label="Hospital Match (15%)" value={score.breakdown.hospitalMatchScore} color="#22c55e" />
        <ScoreBar label="Fuel Score (10%)" value={score.breakdown.fuelScore} color="#eab308" />
      </div>

      {/* Confirm Dispatch */}
      {onConfirm && (
        <div className="border-t border-[#1e293b] px-5 py-4">
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
              isTopPick
                ? "bg-cyan-600 text-white hover:bg-cyan-500"
                : "border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20",
              isConfirming && "cursor-not-allowed opacity-60"
            )}
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Dispatching...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm Dispatch
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
