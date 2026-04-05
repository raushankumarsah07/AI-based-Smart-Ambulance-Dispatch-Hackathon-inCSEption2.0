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
        weight: 4,
        opacity: 0.85,
        dashArray: "10 10",
        className: "animated-route",
      }}
    />
  );
}
