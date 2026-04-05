"use client";

import MapContainer from "./MapContainer";
import AmbulanceMarker from "./AmbulanceMarker";
import HospitalMarker from "./HospitalMarker";
import EmergencyMarker from "./EmergencyMarker";
import RouteLayer from "./RouteLayer";
import type { Ambulance, Hospital, Emergency, Coordinates } from "@/lib/types";

interface ActiveRoute {
  id: string;
  coordinates: Coordinates[];
  color: string;
  label?: string;
}

interface DashboardMapProps {
  ambulances: Ambulance[];
  hospitals: Hospital[];
  emergencies: Emergency[];
  activeRoute?: Coordinates[];
  activeRoutes?: ActiveRoute[];
}

export default function DashboardMap({
  ambulances,
  hospitals,
  emergencies,
  activeRoute,
  activeRoutes,
}: DashboardMapProps) {
  return (
    <div className="relative h-full w-full">
      <MapContainer>
        {hospitals.map((hospital) => (
          <HospitalMarker key={hospital.id} hospital={hospital} />
        ))}

        {emergencies.map((emergency) => (
          <EmergencyMarker key={emergency.id} emergency={emergency} />
        ))}

        {ambulances.map((ambulance) => (
          <AmbulanceMarker key={ambulance.id} ambulance={ambulance} />
        ))}

        {activeRoute && activeRoute.length >= 2 && (
          <RouteLayer route={activeRoute} />
        )}

        {activeRoutes?.map((route) => (
          <RouteLayer
            key={route.id}
            route={route.coordinates}
            color={route.color}
          />
        ))}
      </MapContainer>

      {/* Map legend overlay */}
      <div
        className="absolute bottom-4 left-4 z-[1000] rounded-lg px-3 py-2.5 text-xs space-y-1.5 pointer-events-none select-none"
        style={{
          backgroundColor: "rgba(10, 12, 20, 0.82)",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-0.5 w-5 rounded-full"
            style={{ backgroundColor: "#06b6d4" }}
          />
          <span className="text-gray-300">En Route to Patient</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-0.5 w-5 rounded-full"
            style={{ backgroundColor: "#22c55e" }}
          />
          <span className="text-gray-300">Transporting to Hospital</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: "#ef4444", boxShadow: "0 0 6px #ef4444" }}
          />
          <span className="text-gray-300">Active Emergency</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "#22c55e" }}
          />
          <span className="text-gray-300">Available Ambulance</span>
        </div>
      </div>
    </div>
  );
}
