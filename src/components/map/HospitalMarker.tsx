"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Hospital } from "@/lib/types";

const hospitalIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 30px;
      height: 30px;
      background: #0e1629;
      border: 2px solid #06b6d4;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 10px rgba(6, 182, 212, 0.4);
      color: #06b6d4;
      font-weight: 800;
      font-size: 16px;
      font-family: sans-serif;
    ">H</div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -18],
});

function renderStars(rating: number) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let stars = "";
  for (let i = 0; i < full; i++) stars += "★";
  if (half) stars += "½";
  for (let i = full + (half ? 1 : 0); i < 5; i++) stars += "☆";
  return stars;
}

interface HospitalMarkerProps {
  hospital: Hospital;
}

export default function HospitalMarker({ hospital }: HospitalMarkerProps) {
  return (
    <Marker
      position={[hospital.location.lat, hospital.location.lng]}
      icon={hospitalIcon}
    >
      <Popup>
        <div style={{ minWidth: 200, fontFamily: "sans-serif" }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 6,
              color: "#06b6d4",
            }}
          >
            {hospital.name}
          </div>

          <div style={{ fontSize: 11, marginBottom: 6, display: "flex", flexWrap: "wrap", gap: 3 }}>
            {hospital.specializations.map((spec) => (
              <span
                key={spec}
                style={{
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "#1e293b",
                  color: "#94a3b8",
                  fontSize: 10,
                }}
              >
                {spec}
              </span>
            ))}
          </div>

          <div style={{ fontSize: 12, marginBottom: 3 }}>
            <span style={{ color: "#94a3b8" }}>Emergency Beds: </span>
            <span style={{ fontWeight: 600 }}>
              {hospital.emergencyAvailable}/{hospital.emergencyBeds}
            </span>
          </div>

          <div style={{ fontSize: 12, marginBottom: 3 }}>
            <span style={{ color: "#94a3b8" }}>ICU Beds: </span>
            <span style={{ fontWeight: 600 }}>
              {hospital.icuAvailable}/{hospital.icuBeds}
            </span>
          </div>

          <div style={{ fontSize: 12, marginBottom: 3 }}>
            <span style={{ color: "#94a3b8" }}>Total Beds: </span>
            <span style={{ fontWeight: 600 }}>
              {hospital.availableBeds}/{hospital.totalBeds}
            </span>
          </div>

          <div style={{ fontSize: 12, color: "#eab308" }}>
            {renderStars(hospital.rating)}{" "}
            <span style={{ color: "#94a3b8" }}>({hospital.rating})</span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
