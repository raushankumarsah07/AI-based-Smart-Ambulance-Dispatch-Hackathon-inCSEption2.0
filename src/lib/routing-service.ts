// ============================================
// SmartResQ - OSRM Routing Service
// Real road-following routes via the free
// OSRM (Open Source Routing Machine) demo API
// ============================================

import { Coordinates } from "@/lib/types";
import { haversineDistance } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RouteStep {
  instruction: string;
  distanceKm: number;
  durationMinutes: number;
  name: string; // road name
}

export interface RouteLeg {
  from: string; // "Ambulance" / "Emergency" / "Hospital"
  to: string;
  distanceKm: number;
  durationMinutes: number;
  steps: RouteStep[];
}

export interface RouteResult {
  coordinates: Coordinates[]; // decoded route geometry as lat/lng array
  totalDistanceKm: number;
  totalDurationMinutes: number;
  legs: RouteLeg[];
}

// ---------------------------------------------------------------------------
// OSRM API response types (partial)
// ---------------------------------------------------------------------------

interface OSRMStep {
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number]; // [lng, lat]
  };
  distance: number; // meters
  duration: number; // seconds
  name: string;
}

interface OSRMLeg {
  distance: number; // meters
  duration: number; // seconds
  steps: OSRMStep[];
}

interface OSRMRoute {
  geometry: {
    type: "LineString";
    coordinates: [number, number][]; // [lng, lat] pairs
  };
  legs: OSRMLeg[];
  distance: number; // meters
  duration: number; // seconds
}

interface OSRMResponse {
  code: string;
  routes: OSRMRoute[];
  message?: string;
}

// ---------------------------------------------------------------------------
// Default leg labels for multi-stop routes
// ---------------------------------------------------------------------------

const DEFAULT_LEG_LABELS = ["Ambulance", "Emergency", "Hospital"];

function getLegLabel(index: number): string {
  return DEFAULT_LEG_LABELS[index] ?? `Waypoint ${index}`;
}

// ---------------------------------------------------------------------------
// OSRM maneuver type to human-readable instruction
// ---------------------------------------------------------------------------

function formatManeuverInstruction(
  type: string,
  modifier?: string,
  roadName?: string
): string {
  const road = roadName && roadName.trim() !== "" ? ` onto ${roadName}` : "";

  switch (type) {
    case "depart":
      return `Depart${road}`;
    case "arrive":
      return `Arrive at destination${road}`;
    case "turn":
      return `Turn ${modifier ?? ""}${road}`.trim();
    case "new name":
      return `Continue${road}`;
    case "merge":
      return `Merge ${modifier ?? ""}${road}`.trim();
    case "on ramp":
      return `Take the ramp${road}`;
    case "off ramp":
      return `Exit the ramp${road}`;
    case "fork":
      return `Take the ${modifier ?? ""} fork${road}`.trim();
    case "end of road":
      return `Turn ${modifier ?? ""} at end of road${road}`.trim();
    case "roundabout":
    case "rotary":
      return `Enter the roundabout and exit${road}`;
    case "continue":
      return `Continue${road}`;
    default:
      return `Continue ${modifier ?? ""}${road}`.trim();
  }
}

// ---------------------------------------------------------------------------
// Core routing function
// ---------------------------------------------------------------------------

const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

/**
 * Get a road-following route from the OSRM demo API.
 *
 * @param points - Array of waypoints (minimum 2)
 * @returns RouteResult with coordinates, distance, duration, and leg details
 * @throws Error if fewer than 2 points are provided or the API returns an error
 */
export async function getRoute(points: Coordinates[]): Promise<RouteResult> {
  if (points.length < 2) {
    throw new Error("At least 2 waypoints are required for routing");
  }

  // Build coordinate string: {lng},{lat};{lng},{lat};...
  const coordString = points
    .map((p) => `${p.lng},${p.lat}`)
    .join(";");

  const url = `${OSRM_BASE_URL}/${coordString}?overview=full&geometries=geojson&steps=true&annotations=duration,distance`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `OSRM API returned HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data: OSRMResponse = await response.json();

    if (data.code !== "Ok") {
      throw new Error(
        `OSRM routing failed: ${data.message ?? data.code}`
      );
    }

    if (!data.routes || data.routes.length === 0) {
      throw new Error("OSRM returned no routes");
    }

    const route = data.routes[0];

    // Parse geometry: OSRM returns [lng, lat] pairs -- flip to {lat, lng}
    const coordinates: Coordinates[] = route.geometry.coordinates.map(
      ([lng, lat]) => ({ lat, lng })
    );

    // Parse legs
    const legs: RouteLeg[] = route.legs.map((leg, index) => ({
      from: getLegLabel(index),
      to: getLegLabel(index + 1),
      distanceKm: Math.round((leg.distance / 1000) * 100) / 100,
      durationMinutes: Math.round((leg.duration / 60) * 100) / 100,
      steps: leg.steps.map((step) => ({
        instruction: formatManeuverInstruction(
          step.maneuver.type,
          step.maneuver.modifier,
          step.name
        ),
        distanceKm: Math.round((step.distance / 1000) * 100) / 100,
        durationMinutes: Math.round((step.duration / 60) * 100) / 100,
        name: step.name || "unnamed road",
      })),
    }));

    return {
      coordinates,
      totalDistanceKm: Math.round((route.distance / 1000) * 100) / 100,
      totalDurationMinutes: Math.round((route.duration / 60) * 100) / 100,
      legs,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Routing failed: ${error.message}`);
    }
    throw new Error("Routing failed: unknown error");
  }
}

// ---------------------------------------------------------------------------
// Convenience wrappers
// ---------------------------------------------------------------------------

/**
 * Get a full dispatch route: Ambulance -> Emergency -> Hospital.
 *
 * Labels the legs as "Ambulance -> Emergency" and "Emergency -> Hospital".
 */
export async function getDispatchRoute(
  ambulanceLocation: Coordinates,
  emergencyLocation: Coordinates,
  hospitalLocation: Coordinates
): Promise<RouteResult> {
  const result = await getRoute([
    ambulanceLocation,
    emergencyLocation,
    hospitalLocation,
  ]);

  // Override leg labels to be more descriptive
  if (result.legs.length >= 1) {
    result.legs[0].from = "Ambulance";
    result.legs[0].to = "Emergency";
  }
  if (result.legs.length >= 2) {
    result.legs[1].from = "Emergency";
    result.legs[1].to = "Hospital";
  }

  return result;
}

/**
 * Get a simple two-point route.
 */
export async function getSimpleRoute(
  from: Coordinates,
  to: Coordinates
): Promise<RouteResult> {
  return getRoute([from, to]);
}

// ---------------------------------------------------------------------------
// Fallback route generation (straight-line with interpolation)
// ---------------------------------------------------------------------------

/**
 * Interpolate intermediate points between two coordinates for smoother rendering.
 */
function interpolatePoints(
  a: Coordinates,
  b: Coordinates,
  numPoints: number
): Coordinates[] {
  const points: Coordinates[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    points.push({
      lat: a.lat + (b.lat - a.lat) * t,
      lng: a.lng + (b.lng - a.lng) * t,
    });
  }

  return points;
}

/**
 * Generate a straight-line fallback route when the OSRM API is unavailable.
 *
 * Uses haversine distance for accuracy and estimates duration at 30 km/h.
 * Interpolates intermediate points between each waypoint pair for smoother
 * line rendering on the map.
 */
export function generateFallbackRoute(points: Coordinates[]): RouteResult {
  if (points.length < 2) {
    return {
      coordinates: points,
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
      legs: [],
    };
  }

  const FALLBACK_SPEED_KMH = 30;
  const INTERPOLATION_POINTS = 20; // points per segment

  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;
  const allCoordinates: Coordinates[] = [];
  const legs: RouteLeg[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];

    const distKm = haversineDistance(from, to);
    const durationMin = (distKm / FALLBACK_SPEED_KMH) * 60;

    totalDistanceKm += distKm;
    totalDurationMinutes += durationMin;

    // Interpolate points for a smoother polyline
    const segmentPoints = interpolatePoints(from, to, INTERPOLATION_POINTS);

    // Avoid duplicate points at segment boundaries
    if (i === 0) {
      allCoordinates.push(...segmentPoints);
    } else {
      allCoordinates.push(...segmentPoints.slice(1));
    }

    legs.push({
      from: getLegLabel(i),
      to: getLegLabel(i + 1),
      distanceKm: Math.round(distKm * 100) / 100,
      durationMinutes: Math.round(durationMin * 100) / 100,
      steps: [
        {
          instruction: `Head straight toward ${getLegLabel(i + 1)} (fallback route)`,
          distanceKm: Math.round(distKm * 100) / 100,
          durationMinutes: Math.round(durationMin * 100) / 100,
          name: "straight line (API unavailable)",
        },
      ],
    });
  }

  return {
    coordinates: allCoordinates,
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    totalDurationMinutes: Math.round(totalDurationMinutes * 100) / 100,
    legs,
  };
}
