import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Coordinates } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Haversine distance between two coordinates in km
export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const calc =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(calc), Math.sqrt(1 - calc));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Estimate travel time in minutes given distance and average speed
export function estimateTravelTime(
  distanceKm: number,
  avgSpeedKmh: number = 40,
  trafficMultiplier: number = 1.0
): number {
  return (distanceKm / (avgSpeedKmh / trafficMultiplier)) * 60;
}

// Generate a random coordinate within a radius of a center point
export function randomCoordinate(
  center: Coordinates,
  radiusKm: number
): Coordinates {
  const radiusInDeg = radiusKm / 111.32;
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDeg * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  return {
    lat: center.lat + y,
    lng: center.lng + x / Math.cos(toRad(center.lat)),
  };
}

// Format time duration
export function formatDuration(minutes: number): string {
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs}h ${mins}m`;
}

// Severity color mapping
export function severityColor(severity: string): string {
  switch (severity) {
    case "P1": return "#ef4444"; // red
    case "P2": return "#f97316"; // orange
    case "P3": return "#eab308"; // yellow
    case "P4": return "#22c55e"; // green
    default: return "#6b7280";   // gray
  }
}

// Severity label
export function severityLabel(severity: string): string {
  switch (severity) {
    case "P1": return "Critical";
    case "P2": return "Urgent";
    case "P3": return "Moderate";
    case "P4": return "Minor";
    default: return "Unknown";
  }
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
