"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { severityColor } from "@/lib/utils";
import { generateId, randomCoordinate } from "@/lib/utils";
import type {
  Coordinates,
  Ambulance as AmbulanceType,
  Hospital as HospitalType,
  Emergency,
  Specialization,
} from "@/lib/types";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import AmbulanceList from "@/components/dashboard/AmbulanceList";
import EmergencyList from "@/components/dashboard/EmergencyList";
import HospitalList from "@/components/dashboard/HospitalList";
import Chatbot from "@/components/ui/Chatbot";
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

function findNearestHospitalFromList(
  location: Coordinates,
  hospitalList: HospitalType[]
) {
  let best = hospitalList[0];
  let bestDist = Infinity;
  for (const h of hospitalList) {
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

function buildLocalHospitals(center: Coordinates): HospitalType[] {
  const templates = [
    { name: "City General Hospital", specializations: ["General", "Trauma", "Cardiac"] as Specialization[], rating: 4.4 },
    { name: "Metro Trauma Center", specializations: ["Trauma", "Neuro", "General"] as Specialization[], rating: 4.5 },
    { name: "Lifeline Cardiac Institute", specializations: ["Cardiac", "General", "Neuro"] as Specialization[], rating: 4.6 },
    { name: "Regional Medical Center", specializations: ["General", "Burns", "Pediatric"] as Specialization[], rating: 4.3 },
    { name: "Emergency Care Multispecialty", specializations: ["Trauma", "Cardiac", "Burns", "Pediatric", "General"] as Specialization[], rating: 4.7 },
    { name: "Community Health Hospital", specializations: ["General", "Pediatric", "Neuro"] as Specialization[], rating: 4.2 },
    { name: "St. Mary Emergency Hospital", specializations: ["General", "Trauma", "Pediatric"] as Specialization[], rating: 4.1 },
    { name: "Unity Medical Institute", specializations: ["Cardiac", "Neuro", "General"] as Specialization[], rating: 4.4 },
  ];

  return templates.map((t, idx) => ({
    id: `dash-h-${generateId()}-${idx}`,
    name: t.name,
    location: randomCoordinate(center, 10),
    specializations: t.specializations,
    totalBeds: 250 + idx * 60,
    availableBeds: 20 + Math.floor(Math.random() * 100),
    icuBeds: 20 + idx * 8,
    icuAvailable: 2 + Math.floor(Math.random() * 12),
    emergencyBeds: 20 + idx * 6,
    emergencyAvailable: 3 + Math.floor(Math.random() * 12),
    rating: t.rating,
    contactNumber: "+91-00000-00000",
    isActive: true,
  }));
}

function buildLocalAmbulances(center: Coordinates): AmbulanceType[] {
  const movingStatuses: AmbulanceType["status"][] = [
    "available",
    "available",
    "available",
    "available",
    "available",
    "available",
    "dispatched",
    "dispatched",
    "en_route",
    "at_scene",
    "available",
    "available",
  ];

  return movingStatuses.map((status, idx) => {
    const isAls = idx < 5;
    return {
      id: `dash-a-${generateId()}-${idx}`,
      callSign: `LOC-${String(idx + 1).padStart(2, "0")}`,
      type: isAls ? "ALS" : "BLS",
      status,
      location: randomCoordinate(center, 12),
      speed: status === "available" || status === "at_scene" ? 0 : 35 + Math.floor(Math.random() * 30),
      fuelLevel: 45 + Math.floor(Math.random() * 55),
      equipment: isAls
        ? ["Defibrillator", "Cardiac Monitor", "Trauma Kit", "IV Access Kit", "Oxygen Supply"]
        : ["First Aid Kit", "Oxygen Supply", "IV Access Kit", "Blood Pressure Monitor"],
      crew: isAls ? ["Paramedic Lead", "Driver"] : ["EMT", "Driver"],
    };
  });
}

function buildLocalEmergencies(center: Coordinates): Emergency[] {
  const templates: Array<{ description: string; severity: Emergency["severity"]; specialization: Specialization; status: Emergency["status"] }> = [
    {
      description: "Road traffic accident at major junction",
      severity: "P2",
      specialization: "Trauma",
      status: "in_progress",
    },
    {
      description: "Chest pain and breathing difficulty",
      severity: "P1",
      specialization: "Cardiac",
      status: "dispatched",
    },
    {
      description: "Fall injury with possible fracture",
      severity: "P3",
      specialization: "General",
      status: "in_progress",
    },
    {
      description: "Child with high fever and seizures",
      severity: "P2",
      specialization: "Pediatric",
      status: "completed",
    },
    {
      description: "Minor allergic reaction",
      severity: "P4",
      specialization: "General",
      status: "completed",
    },
    {
      description: "Head injury from bike accident",
      severity: "P2",
      specialization: "Neuro",
      status: "completed",
    },
  ];

  return templates.map((t, idx) => {
    const createdAt = new Date(Date.now() - (idx + 1) * 45 * 60 * 1000);
    return {
      id: `dash-e-${generateId()}-${idx}`,
      callerName: `Caller ${idx + 1}`,
      callerPhone: "+91-00000-00000",
      description: t.description,
      location: randomCoordinate(center, 9),
      address: "Current city region",
      severity: t.severity,
      specialization: t.specialization,
      status: t.status,
      createdAt,
    };
  });
}

async function resolveLocationLabel(coords: Coordinates): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}`,
      { headers: { Accept: "application/json" } }
    );
    if (!response.ok) {
      return `${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`;
    }

    const data = (await response.json()) as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
      };
    };

    const city =
      data.address?.city ||
      data.address?.town ||
      data.address?.village;
    const state = data.address?.state;

    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    return `${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`;
  } catch {
    return `${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`;
  }
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
  const [mapCenter, setMapCenter] = useState<Coordinates | null>(null);
  const [locationLabel, setLocationLabel] = useState("Detecting current location...");
  const [dashboardAmbulances, setDashboardAmbulances] =
    useState<AmbulanceType[]>([]);
  const [dashboardHospitals, setDashboardHospitals] =
    useState<HospitalType[]>([]);
  const [localEmergencies, setLocalEmergencies] =
    useState<Emergency[]>([]);
  const [confirmedDispatchEmergencies, setConfirmedDispatchEmergencies] =
    useState<Emergency[]>([]);

  const dashboardEmergencies = useMemo(
    () => [...localEmergencies, ...confirmedDispatchEmergencies],
    [localEmergencies, confirmedDispatchEmergencies]
  );

  const activeEmergencies = dashboardEmergencies.filter(
    (e) => e.status !== "completed"
  );

  const recentActivity = [...dashboardEmergencies]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const stats = {
    totalEmergencies: dashboardEmergencies.length,
    activeEmergencies: activeEmergencies.length,
    avgResponseTime:
      activeEmergencies.length > 0
        ? Math.max(
            6,
            Math.min(
              18,
              Math.round(
                activeEmergencies.reduce(
                  (sum, emergency) =>
                    sum + (emergency.severity === "P1" ? 8 : emergency.severity === "P2" ? 10 : 12),
                  0
                ) / activeEmergencies.length
              )
            )
          )
        : 10,
    ambulancesAvailable: dashboardAmbulances.filter((a) => a.status === "available").length,
    ambulancesTotal: dashboardAmbulances.length,
    hospitalsActive: dashboardHospitals.filter((h) => h.isActive).length,
  };

  // Set dashboard dataset around user's current location
  useEffect(() => {
    let cancelled = false;

    async function applyLocationDataset(center: Coordinates) {
      const label = await resolveLocationLabel(center);
      if (cancelled) return;

      setMapCenter(center);
      setLocationLabel(label);
      setDashboardHospitals(buildLocalHospitals(center));
      setDashboardAmbulances(buildLocalAmbulances(center));
      setLocalEmergencies(buildLocalEmergencies(center));
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      void applyLocationDataset({ lat: 12.9716, lng: 77.5946 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void applyLocationDataset({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
      },
      () => {
        void applyLocationDataset({ lat: 12.9716, lng: 77.5946 });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  // Load confirmed dispatches from MongoDB and keep the emergency section in sync.
  useEffect(() => {
    let cancelled = false;

    async function fetchConfirmedDispatches() {
      try {
        const response = await fetch("/api/dispatch/confirmed", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as {
          ok?: boolean;
          emergencies?: Emergency[];
        };

        if (!data.ok || !Array.isArray(data.emergencies)) return;
        if (!cancelled) {
          setConfirmedDispatchEmergencies(data.emergencies);
        }
      } catch {
        // Keep existing emergency list if confirmed dispatch fetch fails.
      }
    }

    void fetchConfirmedDispatches();
    const intervalId = setInterval(() => {
      void fetchConfirmedDispatches();
    }, 5000);

    const refreshHandler = () => {
      void fetchConfirmedDispatches();
    };

    window.addEventListener("storage", refreshHandler);
    window.addEventListener("smartresq:dispatch-confirmed", refreshHandler as EventListener);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      window.removeEventListener("storage", refreshHandler);
      window.removeEventListener("smartresq:dispatch-confirmed", refreshHandler as EventListener);
    };
  }, []);

  // Load live ambulances from MongoDB and refresh periodically.
  useEffect(() => {
    let cancelled = false;
    let seededOnce = false;

    if (!mapCenter) return;
    const center = mapCenter;

    async function fetchLiveAmbulances() {
      try {
        const response = await fetch(
          `/api/ambulances/live?lat=${center.lat}&lng=${center.lng}&radiusKm=30`,
          { cache: "no-store" }
        );
        if (!response.ok) return;

        const data = (await response.json()) as {
          ok?: boolean;
          ambulances?: AmbulanceType[];
        };

        if (!data.ok) return;

        const list = Array.isArray(data.ambulances) ? data.ambulances : [];

        if (!cancelled && list.length > 0) {
          setDashboardAmbulances(list);
          return;
        }

        if (!cancelled && list.length === 0 && !seededOnce) {
          seededOnce = true;
          await fetch("/api/ambulances/live/seed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: center.lat,
              lng: center.lng,
              count: 12,
            }),
          });
        }
      } catch {
        // Keep existing dashboard state if live fetch fails.
      }
    }

    void fetchLiveAmbulances();
    const intervalId = setInterval(() => {
      void fetchLiveAmbulances();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [mapCenter]);


  // Fetch real OSRM routes for active dispatches on mount
  useEffect(() => {
    async function fetchActiveRoutes() {
      const dispatchedAmbulances = dashboardAmbulances.filter(
        (a) => a.status === "dispatched" || a.status === "en_route"
      );
      const ongoingEmergencies = dashboardEmergencies.filter(
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
          const hosp = findNearestHospitalFromList(emg.location, dashboardHospitals);

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
  }, [dashboardAmbulances, dashboardEmergencies, dashboardHospitals]);

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Command Center
          </h1>
          <p className="text-sm text-muted mt-1">
            Real-time emergency dispatch overview — {locationLabel}
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
            {mapCenter ? (
              <DashboardMap
                ambulances={dashboardAmbulances}
                hospitals={dashboardHospitals}
                emergencies={activeEmergencies}
                activeRoutes={activeRoutes}
                center={mapCenter}
              />
            ) : (
              <div className="flex h-full min-h-[480px] items-center justify-center text-sm text-muted">
                Detecting current location and loading map...
              </div>
            )}
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
                <AmbulanceList ambulances={dashboardAmbulances} />
              )}
              {activeTab === "Hospitals" && (
                <HospitalList hospitals={dashboardHospitals} />
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

      {/* Chatbot */}
      <Chatbot />
    </main>
  );
}
