"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Emergency, SeverityLevel } from "@/lib/types";

const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  P1: "#ef4444",
  P2: "#f97316",
  P3: "#eab308",
  P4: "#22c55e",
};

const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  P1: "Critical",
  P2: "Urgent",
  P3: "Moderate",
  P4: "Low",
};

function createEmergencyIcon() {
  return L.divIcon({
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
}

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

interface EmergencyMarkerProps {
  emergency: Emergency;
}

export default function EmergencyMarker({ emergency }: EmergencyMarkerProps) {
  const icon = createEmergencyIcon();
  const sevColor = SEVERITY_COLORS[emergency.severity];

  return (
    <Marker
      position={[emergency.location.lat, emergency.location.lng]}
      icon={icon}
    >
      <Popup>
        <div style={{ minWidth: 200, fontFamily: "sans-serif" }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 13,
              marginBottom: 6,
              lineHeight: 1.3,
            }}
          >
            {emergency.description}
          </div>

          <div style={{ marginBottom: 6 }}>
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 4,
                background: sevColor,
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {emergency.severity} — {SEVERITY_LABELS[emergency.severity]}
            </span>
          </div>

          <div style={{ fontSize: 12, marginBottom: 3 }}>
            <span style={{ color: "#94a3b8" }}>Address: </span>
            <span>{emergency.address}</span>
          </div>

          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            {getTimeSince(emergency.createdAt)}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
