"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Ambulance, AmbulanceStatus } from "@/lib/types";

const STATUS_COLORS: Record<AmbulanceStatus, string> = {
  available: "#22c55e",
  dispatched: "#f97316",
  en_route: "#f97316",
  at_scene: "#ef4444",
  transporting: "#3b82f6",
  at_hospital: "#8b5cf6",
};

function createAmbulanceIcon(status: AmbulanceStatus) {
  const color = STATUS_COLORS[status];

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 2px solid #fff;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 15h13V5H3z"/>
          <path d="M16 15h2l3-3v-2h-5z"/>
          <circle cx="7" cy="18" r="2"/>
          <circle cx="18" cy="18" r="2"/>
          <path d="M8 10h2"/>
          <path d="M9 9v2"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

interface AmbulanceMarkerProps {
  ambulance: Ambulance;
  onClick?: (ambulance: Ambulance) => void;
}

export default function AmbulanceMarker({
  ambulance,
  onClick,
}: AmbulanceMarkerProps) {
  const icon = createAmbulanceIcon(ambulance.status);
  const statusColor = STATUS_COLORS[ambulance.status];

  return (
    <Marker
      position={[ambulance.location.lat, ambulance.location.lng]}
      icon={icon}
      eventHandlers={
        onClick
          ? {
              click: () => onClick(ambulance),
            }
          : undefined
      }
    >
      <Popup>
        <div style={{ minWidth: 180, fontFamily: "sans-serif" }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>{ambulance.callSign}</span>
            <span
              style={{
                fontSize: 11,
                padding: "1px 6px",
                borderRadius: 4,
                background: ambulance.type === "ALS" ? "#3b82f6" : "#6b7280",
                color: "#fff",
              }}
            >
              {ambulance.type}
            </span>
          </div>

          <div style={{ fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: "#94a3b8" }}>Status: </span>
            <span style={{ color: statusColor, fontWeight: 600 }}>
              {ambulance.status.replace("_", " ")}
            </span>
          </div>

          <div style={{ fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: "#94a3b8" }}>Speed: </span>
            <span>{ambulance.speed} km/h</span>
          </div>

          <div style={{ fontSize: 12 }}>
            <span style={{ color: "#94a3b8" }}>Fuel: </span>
            <span
              style={{
                color:
                  ambulance.fuelLevel > 50
                    ? "#22c55e"
                    : ambulance.fuelLevel > 20
                      ? "#f97316"
                      : "#ef4444",
                fontWeight: 600,
              }}
            >
              {ambulance.fuelLevel}%
            </span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
