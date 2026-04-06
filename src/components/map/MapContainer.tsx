"use client";

import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

import { MapContainer as LeafletMapContainer, TileLayer } from "react-leaflet";
import type { ReactNode } from "react";

interface LeafletDefaultIconPrototype {
  _getIconUrl?: string;
}

function resolveIconAssetUrl(asset: unknown): string {
  if (typeof asset === "string") return asset;
  if (asset && typeof asset === "object" && "src" in asset) {
    const src = (asset as { src?: unknown }).src;
    if (typeof src === "string") return src;
  }

  return "";
}

// Fix Leaflet default marker icons broken by Next.js bundling
delete (L.Icon.Default.prototype as LeafletDefaultIconPrototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: resolveIconAssetUrl(markerIcon2x),
  iconUrl: resolveIconAssetUrl(markerIcon),
  shadowUrl: resolveIconAssetUrl(markerShadow),
});

const DELHI_CENTER: [number, number] = [28.6139, 77.209];
const DEFAULT_ZOOM = 12;

const DARK_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const DARK_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

const LIGHT_TILE_URL =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const LIGHT_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

interface MapContainerProps {
  children?: ReactNode;
  center?: [number, number];
  zoom?: number;
  className?: string;
  theme?: "dark" | "light";
}

export default function MapContainer({
  children,
  center = DELHI_CENTER,
  zoom = DEFAULT_ZOOM,
  className = "",
  theme = "dark",
}: MapContainerProps) {
  const isLight = theme === "light";

  return (
    <LeafletMapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={{ height: "100%", width: "100%", borderRadius: "12px" }}
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        url={isLight ? LIGHT_TILE_URL : DARK_TILE_URL}
        attribution={isLight ? LIGHT_TILE_ATTRIBUTION : DARK_TILE_ATTRIBUTION}
      />
      {children}
    </LeafletMapContainer>
  );
}
