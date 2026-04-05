"use client";

import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

import { MapContainer as LeafletMapContainer, TileLayer } from "react-leaflet";
import type { ReactNode } from "react";

// Fix Leaflet default marker icons broken by Next.js bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

const DELHI_CENTER: [number, number] = [28.6139, 77.209];
const DEFAULT_ZOOM = 12;

const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

interface MapContainerProps {
  children?: ReactNode;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export default function MapContainer({
  children,
  center = DELHI_CENTER,
  zoom = DEFAULT_ZOOM,
  className = "",
}: MapContainerProps) {
  return (
    <LeafletMapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={{ height: "100%", width: "100%", borderRadius: "12px" }}
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      {children}
    </LeafletMapContainer>
  );
}
