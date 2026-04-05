"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { severityColor } from "@/lib/utils";
import {
  ambulances,
  hospitals,
  emergencyHistory,
  getDashboardStats,
} from "@/lib/simulation-data";
import type { Coordinates } from "@/lib/types";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import AmbulanceList from "@/components/dashboard/AmbulanceList";
import EmergencyList from "@/components/dashboard/EmergencyList";
import HospitalList from "@/components/dashboard/HospitalList";
import {
  Activity,
  Ambulance,
  Building2,
  Clock,
  AlertTriangle,
} from "lucide-react";

const DashboardMap = dynamic(
  () => import("@/components/map/DashboardMap"),
  { ssr: false }
);

const TABS = ["Emergencies", "Ambulances", "Hospitals"] as const;
type Tab = (typeof TABS)[number];

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

function findNearestHospital(location: Coordinates) {
  let best = hospitals[0];
  let bestDist = Infinity;
  for (const h of hospitals) {
    const d =
      (h.location.lat - location.lat) ** 2 +
      (h.location.lng - location.lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = h;
    }
  }
  return best;
}

interface ActiveRoute {
  id: string;
  coordinates: Coordinates[];
  color: string;
  label?: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Emergencies");
  const [activeRoutes, setActiveRoutes] = useState<ActiveRoute[]>([]);
  const stats = getDashboardStats();

  const activeEmergencies = emergencyHistory.filter(
    (e) => e.status !== "completed"
  );

  const recentActivity = [...emergencyHistory]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  // Fetch real OSRM routes for active dispatches on mount
  useEffect(() => {
    async function fetchActiveRoutes() {
      const dispatchedAmbulances = ambulances.filter(
        (a) => a.status === "dispatched" || a.status === "en_route"
      );
      const ongoingEmergencies = emergencyHistory.filter(
        (e) => e.status === "in_progress" || e.status === "dispatched"
      );

      const limit = Math.min(3, dispatchedAmbulances.length, ongoingEmergencies.length);
      if (limit === 0) return;

      try {
        const { getRoute, generateFallbackRoute } = await import("@/lib/routing-service");
        const routes: ActiveRoute[] = [];

        for (let i = 0; i < limit; i++) {
          const amb = dispatchedAmbulances[i];
          const emg = ongoingEmergencies[i];
          const hosp = findNearestHospital(emg.location);

          try {
            // Fetch real road route: ambulance -> emergency
            const leg1 = await getRoute([amb.location, emg.location]);
            routes.push({
              id: `route-to-patient-${amb.id}`,
              coordinates: leg1.coordinates,
              color: "#06b6d4",
              label: `${amb.callSign} → Patient`,
            });

            // Fetch real road route: emergency -> hospital
            const leg2 = await getRoute([emg.location, hosp.location]);
            routes.push({
              id: `route-to-hospital-${amb.id}`,
              coordinates: leg2.coordinates,
              color: "#22c55e",
              label: `Patient → ${hosp.name.split(" ")[0]}`,
            });
          } catch {
            // Fallback for this pair if OSRM fails
            const fb1 = generateFallbackRoute([amb.location, emg.location]);
            routes.push({
              id: `route-to-patient-${amb.id}`,
              coordinates: fb1.coordinates,
              color: "#06b6d4",
            });
            const fb2 = generateFallbackRoute([emg.location, hosp.location]);
            routes.push({
              id: `route-to-hospital-${amb.id}`,
              coordinates: fb2.coordinates,
              color: "#22c55e",
            });
          }
        }

        setActiveRoutes(routes);
      } catch {
        // routing-service import failed — no routes shown
      }
    }

    fetchActiveRoutes();
  }, []);

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Command Center
          </h1>
          <p className="text-sm text-muted mt-1">
            Real-time emergency dispatch overview — Delhi NCR
          </p>
        </div>

        {/* Top row: Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard
            title="Active Emergencies"
            value={stats.activeEmergencies}
            subtitle={`${stats.totalEmergencies} total today`}
            icon={<AlertTriangle className="h-5 w-5" />}
            color="#ef4444"
          />
          <StatCard
            title="Avg Response Time"
            value={`${stats.avgResponseTime} min`}
            subtitle="12% faster than yesterday"
            icon={<Clock className="h-5 w-5" />}
            trend="down"
            color="#06b6d4"
          />
          <StatCard
            title="Available Ambulances"
            value={`${stats.ambulancesAvailable}/${stats.ambulancesTotal}`}
            subtitle={`${stats.ambulancesTotal - stats.ambulancesAvailable} on mission`}
            icon={<Ambulance className="h-5 w-5" />}
            color="#22c55e"
          />
          <StatCard
            title="Hospitals Online"
            value={stats.hospitalsActive}
            subtitle="All systems operational"
            icon={<Building2 className="h-5 w-5" />}
            color="#8b5cf6"
          />
        </div>

        {/* Main area: Map + Tabs */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 mb-6">
          {/* Map — 3/5 = 60% */}
          <div className="lg:col-span-3 rounded-xl border border-card-border bg-card overflow-hidden" style={{ minHeight: 480 }}>
            <DashboardMap
              ambulances={ambulances}
              hospitals={hospitals}
              emergencies={activeEmergencies}
              activeRoutes={activeRoutes}
            />
          </div>

          {/* Tabbed panel — 2/5 = 40% */}
          <div className="lg:col-span-2 flex flex-col rounded-xl border border-card-border bg-card overflow-hidden" style={{ minHeight: 480 }}>
            {/* Tab bar */}
            <div className="flex border-b border-card-border">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors relative",
                    activeTab === tab
                      ? "text-accent"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-3">
              {activeTab === "Emergencies" && (
                <EmergencyList emergencies={activeEmergencies} />
              )}
              {activeTab === "Ambulances" && (
                <AmbulanceList ambulances={ambulances} />
              )}
              {activeTab === "Hospitals" && (
                <HospitalList hospitals={hospitals} />
              )}
            </div>
          </div>
        </div>

        {/* Bottom: Recent Activity Timeline */}
        <div className="rounded-xl border border-card-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Recent Activity
            </h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-card-border" />

            <div className="flex flex-col gap-4">
              {recentActivity.map((emg) => {
                const sevColor = severityColor(emg.severity);
                return (
                  <div key={emg.id} className="flex items-start gap-4 pl-0">
                    {/* Dot */}
                    <div
                      className="relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-background"
                      style={{ backgroundColor: sevColor }}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={emg.severity} size="sm">
                          {emg.severity}
                        </Badge>
                        <span className="text-xs text-foreground font-medium truncate">
                          {emg.description.length > 60
                            ? emg.description.slice(0, 60) + "..."
                            : emg.description}
                        </span>
                        <span className="text-[10px] text-muted ml-auto shrink-0">
                          {getTimeSince(emg.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted mt-0.5">{emg.address}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
