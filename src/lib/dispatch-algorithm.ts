// ============================================
// SmartAmbSys - AI Dispatch Algorithm
// Multi-factor weighted scoring for optimal
// ambulance-hospital dispatch pairing
// ============================================

import {
  Ambulance,
  Coordinates,
  DispatchScore,
  Emergency,
  Hospital,
  SeverityLevel,
  Specialization,
} from "@/lib/types";
import { haversineDistance, estimateTravelTime } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Score weights
// ---------------------------------------------------------------------------

const WEIGHTS = {
  distance: 0.3,
  traffic: 0.25,
  equipment: 0.2,
  hospitalMatch: 0.15,
  fuel: 0.1,
} as const;

// ---------------------------------------------------------------------------
// Traffic multiplier based on hour of day (simulation)
// ---------------------------------------------------------------------------

/**
 * Returns a traffic multiplier for the given hour (0-23).
 * 1.0 = free-flowing traffic, higher = more congested.
 *
 * Models typical urban traffic patterns:
 * - Early morning (0-5): light traffic
 * - Morning rush (7-9): heavy
 * - Midday (10-15): moderate
 * - Evening rush (16-19): heaviest
 * - Night (20-23): light
 */
export function getTrafficMultiplier(hour?: number): number {
  const h = hour ?? new Date().getHours();

  if (h >= 0 && h < 5) return 1.0; // Late night / early morning
  if (h >= 5 && h < 7) return 1.2; // Pre-rush
  if (h >= 7 && h < 10) return 1.8; // Morning rush
  if (h >= 10 && h < 12) return 1.3; // Late morning
  if (h >= 12 && h < 14) return 1.4; // Lunch hour
  if (h >= 14 && h < 16) return 1.2; // Early afternoon
  if (h >= 16 && h < 19) return 2.0; // Evening rush (heaviest)
  if (h >= 19 && h < 21) return 1.5; // Post-rush
  return 1.1; // Late evening
}

// ---------------------------------------------------------------------------
// Scoring functions
// ---------------------------------------------------------------------------

/**
 * Distance score: closer ambulances score higher.
 * 0 km = 100, 20 km = 0, linearly interpolated. Below 0 is clamped to 0.
 */
function scoreDistance(distanceKm: number): number {
  const MAX_DISTANCE = 20;
  const score = ((MAX_DISTANCE - distanceKm) / MAX_DISTANCE) * 100;
  return Math.max(0, Math.min(100, score));
}

/**
 * Traffic score: lower traffic multiplier = higher score.
 * Multiplier 1.0 (free) = 100, 2.0+ (gridlock) = 0.
 */
function scoreTraffic(trafficMultiplier: number): number {
  const score = ((2.0 - trafficMultiplier) / 1.0) * 100;
  return Math.max(0, Math.min(100, score));
}

/**
 * Equipment score based on ambulance type vs emergency severity.
 * ALS ambulances are better suited for critical cases.
 */
function scoreEquipment(
  ambulanceType: "ALS" | "BLS",
  severity: SeverityLevel,
  ambulanceEquipment: string[],
  neededEquipment: string[]
): number {
  let baseScore: number;

  if (severity === "P1" || severity === "P2") {
    // Critical / urgent: ALS strongly preferred
    baseScore = ambulanceType === "ALS" ? 100 : 60;
  } else {
    // Moderate / minor: either type is adequate
    baseScore = ambulanceType === "ALS" ? 90 : 80;
  }

  // Bonus for equipment overlap (up to +10)
  if (neededEquipment.length > 0) {
    const matchCount = neededEquipment.filter((eq) =>
      ambulanceEquipment.some(
        (aeq) => aeq.toLowerCase().includes(eq.toLowerCase())
      )
    ).length;
    const matchRatio = matchCount / neededEquipment.length;
    baseScore = Math.min(100, baseScore + matchRatio * 10);
  }

  return baseScore;
}

/**
 * Hospital match score based on specialization availability, bed count,
 * and hospital rating.
 */
function scoreHospitalMatch(
  hospital: Hospital,
  neededSpecialization: Specialization,
  severity: SeverityLevel
): number {
  let score = 0;

  // Specialization match (base)
  const hasSpecialization = hospital.specializations.includes(
    neededSpecialization
  );
  score = hasSpecialization ? 70 : 40;

  // Bed availability bonus (up to +15)
  if (severity === "P1" || severity === "P2") {
    // Critical cases need ICU/emergency beds
    if (hospital.icuAvailable > 0) {
      score += 10;
    }
    if (hospital.emergencyAvailable > 0) {
      score += 5;
    }
  } else {
    // Lower severity: general bed availability
    if (hospital.availableBeds > 0) {
      score += 10;
    }
    if (hospital.emergencyAvailable > 0) {
      score += 5;
    }
  }

  // Rating bonus (up to +15): rating 5 = +15, rating 1 = +3
  score += hospital.rating * 3;

  return Math.min(100, score);
}

/**
 * Fuel score: direct mapping of fuel percentage to score.
 */
function scoreFuel(fuelLevel: number): number {
  return Math.max(0, Math.min(100, fuelLevel));
}

// ---------------------------------------------------------------------------
// Best hospital finder
// ---------------------------------------------------------------------------

function findBestHospital(
  hospitals: Hospital[],
  specialization: Specialization,
  severity: SeverityLevel,
  emergencyLocation: Coordinates
): Hospital | null {
  if (hospitals.length === 0) return null;

  const activeHospitals = hospitals.filter((h) => h.isActive);
  if (activeHospitals.length === 0) return null;

  // Score each hospital and pick the best
  let bestHospital: Hospital = activeHospitals[0];
  let bestScore = -1;

  for (const hospital of activeHospitals) {
    const matchScore = scoreHospitalMatch(hospital, specialization, severity);
    const distKm = haversineDistance(emergencyLocation, hospital.location);
    const distScore = scoreDistance(distKm);

    // Combined: 60% match quality, 40% proximity
    const combinedScore = matchScore * 0.6 + distScore * 0.4;

    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      bestHospital = hospital;
    }
  }

  return bestHospital;
}

// ---------------------------------------------------------------------------
// Main dispatch scoring
// ---------------------------------------------------------------------------

/**
 * Calculate dispatch scores for all available ambulances against the
 * given emergency, pairing each with the best matching hospital.
 *
 * Returns results sorted by totalScore descending.
 */
export function calculateDispatchScores(
  emergency: Emergency,
  ambulances: Ambulance[],
  hospitals: Hospital[]
): DispatchScore[] {
  // 1. Filter to available ambulances only
  const availableAmbulances = ambulances.filter(
    (a) => a.status === "available"
  );

  if (availableAmbulances.length === 0) return [];

  const trafficMultiplier = getTrafficMultiplier();
  const scores: DispatchScore[] = [];

  for (const ambulance of availableAmbulances) {
    // 2. Find the best matching hospital for this emergency
    const hospital = findBestHospital(
      hospitals,
      emergency.specialization,
      emergency.severity,
      emergency.location
    );

    if (!hospital) continue;

    // 3. Calculate individual factor scores
    const distKm = haversineDistance(ambulance.location, emergency.location);
    const distScore = scoreDistance(distKm);
    const traffScore = scoreTraffic(trafficMultiplier);
    const equipScore = scoreEquipment(
      ambulance.type,
      emergency.severity,
      ambulance.equipment,
      [] // Equipment needs could be fed from triage; keeping simple here
    );
    const hospScore = scoreHospitalMatch(
      hospital,
      emergency.specialization,
      emergency.severity
    );
    const fuelSc = scoreFuel(ambulance.fuelLevel);

    // 4. Weighted total
    const totalScore =
      distScore * WEIGHTS.distance +
      traffScore * WEIGHTS.traffic +
      equipScore * WEIGHTS.equipment +
      hospScore * WEIGHTS.hospitalMatch +
      fuelSc * WEIGHTS.fuel;

    // 5. Estimate arrival time
    const estimatedArrivalMinutes = estimateTravelTime(
      distKm,
      ambulance.speed || 40,
      trafficMultiplier
    );

    scores.push({
      ambulanceId: ambulance.id,
      hospitalId: hospital.id,
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown: {
        distanceScore: Math.round(distScore * 100) / 100,
        trafficScore: Math.round(traffScore * 100) / 100,
        equipmentScore: Math.round(equipScore * 100) / 100,
        hospitalMatchScore: Math.round(hospScore * 100) / 100,
        fuelScore: Math.round(fuelSc * 100) / 100,
      },
      estimatedArrivalMinutes: Math.round(estimatedArrivalMinutes * 10) / 10,
      distanceKm: Math.round(distKm * 100) / 100,
    });
  }

  // 6. Sort by totalScore descending
  scores.sort((a, b) => b.totalScore - a.totalScore);

  // 7. Return all scored results
  return scores;
}

// ---------------------------------------------------------------------------
// Convenience: get the single best dispatch option
// ---------------------------------------------------------------------------

/**
 * Returns the top-scoring ambulance-hospital pair, or null if no
 * ambulances are available.
 */
export function getOptimalDispatch(
  emergency: Emergency,
  ambulances: Ambulance[],
  hospitals: Hospital[]
): DispatchScore | null {
  const scores = calculateDispatchScores(emergency, ambulances, hospitals);
  return scores.length > 0 ? scores[0] : null;
}
