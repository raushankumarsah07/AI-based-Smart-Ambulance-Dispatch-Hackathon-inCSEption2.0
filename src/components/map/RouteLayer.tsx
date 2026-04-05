"use client";

import { Polyline } from "react-leaflet";
import type { Coordinates } from "@/lib/types";

interface RouteLayerProps {
  route: Coordinates[];
  color?: string;
}

export default function RouteLayer({
  route,
  color = "#06b6d4",
}: RouteLayerProps) {
  if (route.length < 2) return null;

  const positions: [number, number][] = route.map((coord) => [
    coord.lat,
    coord.lng,
  ]);

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight: 5,
        opacity: 0.9,
        dashArray: "12 8",
        className: "animated-route",
      }}
    />
  );
}
