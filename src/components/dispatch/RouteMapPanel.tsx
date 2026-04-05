"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import { Marker, Popup, useMap } from "react-leaflet";
import {
  Navigation,
  Clock,
  MapPin,
  Building2,
  Siren,
  Loader2,
} from "lucide-react";
import AmbulanceMarker from "@/components/map/AmbulanceMarker";
import HospitalMarker from "@/components/map/HospitalMarker";
import RouteLayer from "@/components/map/RouteLayer";
import type { Coordinates, Ambulance, Hospital } from "@/lib/types";

// Dynamically import MapContainer with SSR disabled (Leaflet needs window)
const MapContainer = dynamic(
  () => import("@/components/map/MapContainer"),
  { ssr: false }
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteLeg {
  from: string;
  to: string;
  distanceKm: number;
  durationMinutes: number;
}

interface RouteData {
  coordinates: Coordinates[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  legs: RouteLeg[];
}

interface RouteMapPanelProps {
  ambulanceLocation: Coordinates;
  emergencyLocation: Coordinates;
  hospitalLocation: Coordinates;
  ambulance: Ambulance;
  hospital: Hospital;
  routeData?: RouteData | null;
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// FitBounds helper — a child component that uses useMap() to auto-zoom
// ---------------------------------------------------------------------------

function FitBounds({ points }: { points: Coordinates[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, points]);

  return null;
}

// ---------------------------------------------------------------------------
// Emergency marker icon (red pulsing dot)
// ---------------------------------------------------------------------------

const emergencyIcon = L.divIcon({
  className: "",
  html: `
    <div style="position: relative; width: 28px; height: 28px;">
      <div class="emergency-marker" style="
        position: absolute;
        inset: 0;
        background: rgba(239, 68, 68, 0.3);
        border-radius: 50%;
      "></div>
      <div style="
        position: absolute;
        inset: 4px;
        background: #ef4444;
        border: 2px solid #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
      ">
        <span style="color: #fff; font-weight: 800; font-size: 12px; font-family: sans-serif;">!</span>
      </div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -18],
});

// ---------------------------------------------------------------------------
// Split route coordinates into two legs at the point nearest to emergency
// ---------------------------------------------------------------------------

function splitRouteAtEmergency(
  coordinates: Coordinates[],
  emergency: Coordinates
): { leg1: Coordinates[]; leg2: Coordinates[] } {
  if (coordinates.length < 2) {
    return { leg1: coordinates, leg2: [] };
  }

  // Find the coordinate closest to the emergency location
  let closestIdx = 0;
  let closestDist = Infinity;

  for (let i = 0; i < coordinates.length; i++) {
    const d =
      Math.pow(coordinates[i].lat - emergency.lat, 2) +
      Math.pow(coordinates[i].lng - emergency.lng, 2);
    if (d < closestDist) {
      closestDist = d;
      closestIdx = i;
    }
  }

  // Ensure each leg has at least 2 points
  const splitAt = Math.max(1, Math.min(closestIdx, coordinates.length - 2));

  return {
    leg1: coordinates.slice(0, splitAt + 1),
    leg2: coordinates.slice(splitAt),
  };
}

// ---------------------------------------------------------------------------
// RouteMapPanel
// ---------------------------------------------------------------------------

export default function RouteMapPanel({
  ambulanceLocation,
  emergencyLocation,
  hospitalLocation,
  ambulance,
  hospital,
  routeData,
  isLoading = false,
}: RouteMapPanelProps) {
  const allPoints = useMemo(
    () => [ambulanceLocation, emergencyLocation, hospitalLocation],
    [ambulanceLocation, emergencyLocation, hospitalLocation]
  );

  // Split the route polyline into two legs (cyan and green)
  const { leg1, leg2 } = useMemo(() => {
    if (!routeData?.coordinates || routeData.coordinates.length < 2) {
      return { leg1: [], leg2: [] };
    }
    return splitRouteAtEmergency(routeData.coordinates, emergencyLocation);
  }, [routeData, emergencyLocation]);

  // Leg data for the summary
  const leg1Data = routeData?.legs?.[0];
  const leg2Data = routeData?.legs?.[1];

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="relative overflow-hidden rounded-xl border border-gray-700 bg-gray-900">
        <div className="h-[300px] md:h-[400px]">
          <MapContainer className="h-full w-full">
            <FitBounds points={allPoints} />

            {/* Ambulance marker */}
            <AmbulanceMarker ambulance={ambulance} />

            {/* Hospital marker */}
            <HospitalMarker hospital={hospital} />

            {/* Emergency marker (red pulsing) */}
            <Marker
              position={[emergencyLocation.lat, emergencyLocation.lng]}
              icon={emergencyIcon}
            >
              <Popup>
                <div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 13 }}>
                  Emergency Location
                </div>
              </Popup>
            </Marker>

            {/* Route polylines */}
            {leg1.length >= 2 && (
              <RouteLayer route={leg1} color="#06b6d4" />
            )}
            {leg2.length >= 2 && (
              <RouteLayer route={leg2} color="#22c55e" />
            )}
          </MapContainer>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-gray-900/70 backdrop-blur-sm">
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-sm font-medium text-gray-300">
              Calculating fastest route...
            </p>
          </div>
        )}
      </div>

      {/* Route summary card */}
      {routeData && (
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
          {/* Total */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-semibold text-gray-200">
                Route Summary
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-sm font-bold text-cyan-300">
                  {routeData.totalDistanceKm.toFixed(1)} km
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-sm font-bold text-cyan-300">
                  {Math.round(routeData.totalDurationMinutes)} min
                </span>
              </div>
            </div>
          </div>

          {/* Legs */}
          <div className="space-y-3">
            {/* Leg 1: Ambulance -> Patient */}
            {leg1Data && (
              <div className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-800/40 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15">
                  <Siren className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-300">
                    Ambulance → Patient
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {ambulance.callSign} en route to emergency
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-right">
                  <div>
                    <p className="text-xs font-bold text-cyan-300">
                      {leg1Data.distanceKm.toFixed(1)} km
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-cyan-300">
                      {Math.round(leg1Data.durationMinutes)} min
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Leg 2: Patient -> Hospital */}
            {leg2Data && (
              <div className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-800/40 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/15">
                  <Building2 className="h-4 w-4 text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-300">
                    Patient → Hospital
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Transport to {hospital.name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-right">
                  <div>
                    <p className="text-xs font-bold text-green-300">
                      {leg2Data.distanceKm.toFixed(1)} km
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-green-300">
                      {Math.round(leg2Data.durationMinutes)} min
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 border-t border-gray-800 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded-full bg-cyan-500" />
              <span className="text-[10px] text-gray-500">Ambulance → Patient</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded-full bg-green-500" />
              <span className="text-[10px] text-gray-500">Patient → Hospital</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-red-400" />
              <span className="text-[10px] text-gray-500">Emergency</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
