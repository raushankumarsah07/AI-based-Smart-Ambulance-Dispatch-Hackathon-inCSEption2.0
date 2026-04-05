"use client";

import MapContainer from "./MapContainer";
import AmbulanceMarker from "./AmbulanceMarker";
import HospitalMarker from "./HospitalMarker";
import EmergencyMarker from "./EmergencyMarker";
import RouteLayer from "./RouteLayer";
import type { Ambulance, Hospital, Emergency, Coordinates } from "@/lib/types";

interface DashboardMapProps {
  ambulances: Ambulance[];
  hospitals: Hospital[];
  emergencies: Emergency[];
  activeRoute?: Coordinates[];
}

export default function DashboardMap({
  ambulances,
  hospitals,
  emergencies,
  activeRoute,
}: DashboardMapProps) {
  return (
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
    </MapContainer>
  );
}
