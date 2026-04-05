"use client";

import { cn } from "@/lib/utils";
import type { Hospital } from "@/lib/types";
import { Star, HeartPulse } from "lucide-react";

interface HospitalListProps {
  hospitals: Hospital[];
}

function availabilityColor(available: number, total: number): string {
  if (total === 0) return "#6b7280";
  const pct = (available / total) * 100;
  if (pct > 50) return "#22c55e";
  if (pct >= 20) return "#eab308";
  return "#ef4444";
}

function renderStars(rating: number) {
  const stars = [];
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.3;
  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      );
    } else if (i === full && hasHalf) {
      stars.push(
        <Star key={i} className="h-3 w-3 fill-yellow-400/50 text-yellow-400" />
      );
    } else {
      stars.push(
        <Star key={i} className="h-3 w-3 text-card-border" />
      );
    }
  }
  return stars;
}

export default function HospitalList({ hospitals }: HospitalListProps) {
  return (
    <div className="flex flex-col gap-2 overflow-y-auto pr-1" style={{ maxHeight: "100%" }}>
      {hospitals.map((hosp) => {
        const emergColor = availabilityColor(hosp.emergencyAvailable, hosp.emergencyBeds);
        const icuColor = availabilityColor(hosp.icuAvailable, hosp.icuBeds);
        const emergPct = hosp.emergencyBeds > 0 ? (hosp.emergencyAvailable / hosp.emergencyBeds) * 100 : 0;
        const icuPct = hosp.icuBeds > 0 ? (hosp.icuAvailable / hosp.icuBeds) * 100 : 0;

        return (
          <div
            key={hosp.id}
            className={cn(
              "rounded-lg border border-card-border bg-card/60 px-3 py-2.5 transition-all",
              "hover:border-accent/40 hover:bg-card"
            )}
          >
            {/* Name + rating */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <HeartPulse className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-sm font-semibold text-foreground truncate">
                  {hosp.name}
                </span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {renderStars(hosp.rating)}
                <span className="text-[10px] text-muted ml-1">{hosp.rating}</span>
              </div>
            </div>

            {/* Specializations */}
            <div className="flex flex-wrap gap-1 mb-2">
              {hosp.specializations.map((spec) => (
                <span
                  key={spec}
                  className="rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider bg-card-border/60 text-muted"
                >
                  {spec}
                </span>
              ))}
            </div>

            {/* Bed bars */}
            <div className="flex flex-col gap-1.5">
              {/* Emergency beds */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted w-16 shrink-0">ER Beds</span>
                <div className="flex-1 h-1.5 rounded-full bg-card-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${emergPct}%`,
                      backgroundColor: emergColor,
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium w-10 text-right" style={{ color: emergColor }}>
                  {hosp.emergencyAvailable}/{hosp.emergencyBeds}
                </span>
              </div>

              {/* ICU beds */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted w-16 shrink-0">ICU Beds</span>
                <div className="flex-1 h-1.5 rounded-full bg-card-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${icuPct}%`,
                      backgroundColor: icuColor,
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium w-10 text-right" style={{ color: icuColor }}>
                  {hosp.icuAvailable}/{hosp.icuBeds}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
