"use client";

import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import MapContainer from "@/components/map/MapContainer";

interface LocationValue {
  lat: number;
  lng: number;
}

interface LocationMapPickerProps {
  value: LocationValue;
  selectedLabel?: string;
  onChange: (next: { lat: number; lng: number; address?: string }) => void;
  onDropHospital?: (hospital: { id: string; hospitalName: string; latitude: number; longitude: number; city: string; state: string }) => void;
}

const pickerMarkerIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 18px;
      height: 18px;
      border-radius: 9999px;
      background: #06b6d4;
      border: 2px solid #ffffff;
      box-shadow: 0 0 0 6px rgba(6, 182, 212, 0.25), 0 2px 8px rgba(0,0,0,0.35);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

function RecenterMap({ position }: { position: LocationValue }) {
  const map = useMap();

  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom(), { animate: true });
  }, [map, position.lat, position.lng]);

  return null;
}

function MapClickHandler({
  onPick,
}: {
  onPick: (next: { lat: number; lng: number; address?: string }) => void;
}) {
  useMapEvents({
    click: async (event) => {
      const lat = Number(event.latlng.lat.toFixed(6));
      const lng = Number(event.latlng.lng.toFixed(6));

      // Keep reverse geocoding best-effort; selection should still work even if this fails.
      let address: string | undefined;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (response.ok) {
          const data = (await response.json()) as { display_name?: string };
          address = data.display_name;
        }
      } catch {
        address = undefined;
      }

      onPick({ lat, lng, address });
    },
  });

  return null;
}

export default function LocationMapPicker({ value, selectedLabel, onChange, onDropHospital }: LocationMapPickerProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const markerPosition = useMemo<[number, number]>(
    () => [value.lat, value.lng],
    [value.lat, value.lng]
  );

  async function resolveAddress(lat: number, lng: number) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: { Accept: "application/json" },
        }
      );
      if (!response.ok) return undefined;

      const data = (await response.json()) as { display_name?: string };
      return data.display_name;
    } catch {
      return undefined;
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (mapContainerRef.current) {
      mapContainerRef.current.style.borderColor = "#06b6d4";
      mapContainerRef.current.style.backgroundColor = "rgba(6, 182, 212, 0.05)";
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (mapContainerRef.current === e.currentTarget) {
      if (mapContainerRef.current) {
        mapContainerRef.current.style.borderColor = "";
        mapContainerRef.current.style.backgroundColor = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (mapContainerRef.current) {
      mapContainerRef.current.style.borderColor = "";
      mapContainerRef.current.style.backgroundColor = "";
    }

    try {
      const data = e.dataTransfer.getData("application/json");
      const hospital = JSON.parse(data);
      
      if (hospital.hospitalName && hospital.latitude && hospital.longitude) {
        onDropHospital?.(hospital);
        onChange({
          lat: hospital.latitude,
          lng: hospital.longitude,
          address: `${hospital.hospitalName}, ${hospital.city}`,
        });
      }
    } catch {
      // Invalid drop data, ignore
    }
  };

  return (
    <div className="space-y-2 p-2">
      <div
        ref={mapContainerRef}
        className="h-56 overflow-hidden rounded-md border border-gray-800 md:h-64 transition-colors"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <MapContainer
          center={markerPosition}
          zoom={14}
          className="h-full w-full location-picker-map"
          theme="light"
        >
          <RecenterMap position={value} />

          <MapClickHandler
            onPick={(next) => {
              onChange(next);
            }}
          />

          <Marker
            position={markerPosition}
            icon={pickerMarkerIcon}
            draggable
            ref={(instance) => {
              markerRef.current = instance;
            }}
            eventHandlers={{
              dragend: async () => {
                const marker = markerRef.current;
                if (!marker) return;

                const position = marker.getLatLng();
                const lat = Number(position.lat.toFixed(6));
                const lng = Number(position.lng.toFixed(6));
                const address = await resolveAddress(lat, lng);
                onChange({ lat, lng, address });
              },
            }}
          >
            <Popup>
              <div style={{ minWidth: 170, fontFamily: "sans-serif" }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {selectedLabel ? `Selected: ${selectedLabel}` : "Selected Location"}
                </div>
                <div style={{ fontSize: 12 }}>Lat: {value.lat.toFixed(6)}</div>
                <div style={{ fontSize: 12 }}>Lng: {value.lng.toFixed(6)}</div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <p className="px-1 text-[11px] text-gray-500">
        Drag hospital names above or drag the marker / click map to update coordinates.
      </p>
    </div>
  );
}
