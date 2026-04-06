"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Brain,
  Activity,
  Loader2,
  CheckCircle2,
  Siren,
  Navigation,
} from "lucide-react";
import EmergencyForm from "@/components/dispatch/EmergencyForm";
import TriageResultCard from "@/components/dispatch/TriageResultCard";
import DispatchResultCard from "@/components/dispatch/DispatchResultCard";
import { triageEmergency } from "@/lib/triage-engine";
import { generateId, haversineDistance, randomCoordinate } from "@/lib/utils";
import type {
  TriageResult,
  DispatchScore,
  Ambulance,
  Hospital,
  Emergency,
  Coordinates,
  SeverityLevel,
  Specialization,
} from "@/lib/types";

const RouteMapPanel = dynamic(
  () => import("@/components/dispatch/RouteMapPanel"),
  { ssr: false }
);

const DISPATCH_LOCALIZATION_THRESHOLD_KM = 120;

// ─────────────────────────────────────────────────────────────────────────────
// Fallback demo data — used when simulation-data / dispatch-algorithm are not
// yet available. These will be replaced by the real modules later.
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_AMBULANCES: Ambulance[] = [
  {
    id: "amb-001",
    callSign: "DELHI-ALS-07",
    type: "ALS",
    status: "available",
    location: { lat: 28.6280, lng: 77.2189 },
    speed: 45,
    fuelLevel: 82,
    equipment: [
      "Defibrillator (AED)",
      "12-Lead ECG Monitor",
      "Trauma Kit",
      "IV Access Kit",
      "Oxygen Supply",
      "Cervical Collar",
      "Spinal Board",
    ],
    crew: ["Dr. Sharma", "Paramedic Raj"],
  },
  {
    id: "amb-002",
    callSign: "DELHI-BLS-12",
    type: "BLS",
    status: "available",
    location: { lat: 28.6453, lng: 77.2312 },
    speed: 40,
    fuelLevel: 65,
    equipment: ["First Aid Kit", "IV Access Kit", "Oxygen Supply", "Blood Pressure Monitor"],
    crew: ["Paramedic Meena", "Driver Ashok"],
  },
  {
    id: "amb-003",
    callSign: "DELHI-ALS-03",
    type: "ALS",
    status: "available",
    location: { lat: 28.6105, lng: 77.2301 },
    speed: 50,
    fuelLevel: 91,
    equipment: [
      "Defibrillator (AED)",
      "Trauma Kit",
      "Burn Dressing Kit",
      "IV Access Kit",
      "Oxygen Supply",
      "Pediatric Airway Kit",
    ],
    crew: ["Dr. Patel", "Paramedic Sunita"],
  },
];

const DEMO_HOSPITALS: Hospital[] = [
  {
    id: "hosp-001",
    name: "AIIMS New Delhi",
    location: { lat: 28.5672, lng: 77.2100 },
    specializations: ["Trauma", "Cardiac", "Neuro", "Pediatric"],
    totalBeds: 2400,
    availableBeds: 312,
    icuBeds: 120,
    icuAvailable: 14,
    emergencyBeds: 80,
    emergencyAvailable: 23,
    rating: 4.8,
    contactNumber: "+91-11-2658-8500",
    isActive: true,
  },
  {
    id: "hosp-002",
    name: "Safdarjung Hospital",
    location: { lat: 28.5681, lng: 77.2066 },
    specializations: ["Trauma", "Burns", "General"],
    totalBeds: 1600,
    availableBeds: 198,
    icuBeds: 60,
    icuAvailable: 8,
    emergencyBeds: 50,
    emergencyAvailable: 15,
    rating: 4.2,
    contactNumber: "+91-11-2616-4032",
    isActive: true,
  },
  {
    id: "hosp-003",
    name: "Max Super Speciality, Saket",
    location: { lat: 28.5275, lng: 77.2137 },
    specializations: ["Cardiac", "Neuro", "Pediatric"],
    totalBeds: 500,
    availableBeds: 67,
    icuBeds: 40,
    icuAvailable: 6,
    emergencyBeds: 30,
    emergencyAvailable: 11,
    rating: 4.6,
    contactNumber: "+91-11-2651-5050",
    isActive: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Fallback dispatch score generator (used until dispatch-algorithm is built)
// ─────────────────────────────────────────────────────────────────────────────

function generateFallbackScores(
  _triage: TriageResult,
  ambulances: Ambulance[],
  hospitals: Hospital[]
): DispatchScore[] {
  return ambulances.map((amb, i) => {
    const hosp = hospitals[i % hospitals.length];
    const distScore = 60 + Math.random() * 40;
    const trafficScore = 50 + Math.random() * 50;
    const equipScore = 60 + Math.random() * 40;
    const hospMatchScore = 55 + Math.random() * 45;
    const fuelScore = amb.fuelLevel;

    const total =
      distScore * 0.3 +
      trafficScore * 0.25 +
      equipScore * 0.2 +
      hospMatchScore * 0.15 +
      fuelScore * 0.1;

    const distKm = 2 + Math.random() * 10;
    const eta = (distKm / (amb.speed || 40)) * 60 * (1 + Math.random() * 0.5);

    return {
      ambulanceId: amb.id,
      hospitalId: hosp.id,
      totalScore: total,
      breakdown: {
        distanceScore: distScore,
        trafficScore,
        equipmentScore: equipScore,
        hospitalMatchScore: hospMatchScore,
        fuelScore,
      },
      estimatedArrivalMinutes: eta,
      distanceKm: distKm,
    };
  });
}

function nearestDistanceKm(from: Coordinates, candidates: Coordinates[]): number {
  if (candidates.length === 0) return Number.POSITIVE_INFINITY;
  return candidates.reduce((best, c) => Math.min(best, haversineDistance(from, c)), Number.POSITIVE_INFINITY);
}

function buildLocalizedHospitals(center: Coordinates): Hospital[] {
  const templates = [
    { name: "City General Hospital", specializations: ["General", "Trauma", "Cardiac"] as Specialization[], rating: 4.4 },
    { name: "Metro Trauma Center", specializations: ["Trauma", "Neuro", "General"] as Specialization[], rating: 4.5 },
    { name: "Lifeline Cardiac Institute", specializations: ["Cardiac", "General", "Neuro"] as Specialization[], rating: 4.6 },
    { name: "Regional Medical Center", specializations: ["General", "Burns", "Pediatric"] as Specialization[], rating: 4.3 },
    { name: "Emergency Care Multispecialty", specializations: ["Trauma", "Cardiac", "Burns", "Pediatric", "General"] as Specialization[], rating: 4.7 },
    { name: "Community Health Hospital", specializations: ["General", "Pediatric", "Neuro"] as Specialization[], rating: 4.2 },
  ];

  return templates.map((t, idx) => ({
    id: `local-h-${generateId()}-${idx}`,
    name: t.name,
    location: randomCoordinate(center, 8),
    specializations: t.specializations,
    totalBeds: 300 + idx * 80,
    availableBeds: 30 + Math.floor(Math.random() * 90),
    icuBeds: 20 + idx * 10,
    icuAvailable: 3 + Math.floor(Math.random() * 12),
    emergencyBeds: 20 + idx * 8,
    emergencyAvailable: 4 + Math.floor(Math.random() * 10),
    rating: t.rating,
    contactNumber: "+91-00000-00000",
    isActive: true,
  }));
}

function buildLocalizedAmbulances(center: Coordinates): Ambulance[] {
  return Array.from({ length: 10 }, (_, idx) => {
    const isAls = idx < 4;
    return {
      id: `local-a-${generateId()}-${idx}`,
      callSign: `LOC-${String(idx + 1).padStart(2, "0")}`,
      type: isAls ? "ALS" : "BLS",
      status: "available",
      location: randomCoordinate(center, 6),
      speed: 42 + Math.floor(Math.random() * 18),
      fuelLevel: 55 + Math.floor(Math.random() * 45),
      equipment: isAls
        ? ["Defibrillator (AED)", "Trauma Kit", "IV Access Kit", "Oxygen Supply", "Cardiac Monitor"]
        : ["First Aid Kit", "Oxygen Supply", "IV Access Kit", "Blood Pressure Monitor"],
      crew: isAls ? ["Paramedic Lead", "Driver"] : ["EMT", "Driver"],
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Page state types
// ─────────────────────────────────────────────────────────────────────────────

type Phase = "idle" | "triaging" | "triage_done" | "dispatching" | "dispatch_done" | "confirmed";

interface FormData {
  callerName: string;
  callerPhone: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  manualSeverity?: SeverityLevel;
  manualSpecialization?: Specialization;
}

interface RecommendationPayload {
  rank: number;
  ambulanceId: string;
  ambulanceCallSign: string;
  hospitalId: string;
  hospitalName: string;
  totalScore: number;
  estimatedArrivalMinutes: number;
  distanceKm: number;
}

interface PersistEmergencyContext {
  emergencyId: string;
  callerName: string;
  callerPhone: string;
  description: string;
  address: string;
  location: Coordinates;
  triage: TriageResult;
  recommendations: RecommendationPayload[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Dispatch Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DispatchPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [dispatchResults, setDispatchResults] = useState<DispatchScore[]>([]);
  const [confirmedIndex, setConfirmedIndex] = useState<number | null>(null);
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null);
  const [activeEmergencyId, setActiveEmergencyId] = useState<string | null>(null);
  const [persistContext, setPersistContext] = useState<PersistEmergencyContext | null>(null);

  // Route map state
  const [routeData, setRouteData] = useState<{
    coordinates: Coordinates[];
    totalDistanceKm: number;
    totalDurationMinutes: number;
    legs: Array<{
      from: string;
      to: string;
      distanceKm: number;
      durationMinutes: number;
    }>;
  } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [emergencyCoords, setEmergencyCoords] = useState<Coordinates | null>(null);

  // Data maps for looking up ambulance/hospital by ID
  const [ambulances, setAmbulances] = useState<Ambulance[]>(DEMO_AMBULANCES);
  const [hospitals, setHospitals] = useState<Hospital[]>(DEMO_HOSPITALS);

  function findAmbulance(id: string): Ambulance {
    return ambulances.find((a) => a.id === id) || ambulances[0];
  }
  function findHospital(id: string): Hospital {
    return hospitals.find((h) => h.id === id) || hospitals[0];
  }

  async function persistAnalyzeRecord(payload: {
    emergencyId: string;
    callerName: string;
    callerPhone: string;
    description: string;
    address: string;
    location: Coordinates;
    triage: TriageResult;
    recommendations: Array<{
      rank: number;
      ambulanceId: string;
      ambulanceCallSign: string;
      hospitalId: string;
      hospitalName: string;
      totalScore: number;
      estimatedArrivalMinutes: number;
      distanceKm: number;
    }>;
  }) {
    try {
      await fetch("/api/dispatch/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Keep UI functional even if local DB is down.
    }
  }

  async function persistConfirmedDispatch(payload: {
    emergencyId: string;
    selectedRank: number;
    ambulanceId: string;
    ambulanceCallSign: string;
    hospitalId: string;
    hospitalName: string;
    estimatedArrivalMinutes: number;
    distanceKm: number;
    callerName?: string;
    callerPhone?: string;
    description?: string;
    address?: string;
    location?: Coordinates;
    triage?: TriageResult;
    recommendations?: RecommendationPayload[];
  }) {
    try {
      await fetch("/api/dispatch/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Keep UI functional even if local DB is down.
    }
  }

  // ─── Submit handler ────────────────────────────────────────────────────────
  async function handleSubmit(data: FormData) {
    const emergencyId = `em-${Date.now()}`;

    // Phase 1: Triage
    setPhase("triaging");
    setTriageResult(null);
    setDispatchResults([]);
    setConfirmedIndex(null);
    setRouteData(null);
    setRouteLoading(false);
    setActiveEmergencyId(emergencyId);
    setPersistContext(null);
    setEmergencyCoords({ lat: data.lat, lng: data.lng });

    // Artificial delay for demo
    await new Promise((r) => setTimeout(r, 1500));

    let triage: TriageResult;

    try {
      triage = triageEmergency(data.description);

      // Apply manual overrides if set
      if (data.manualSeverity) {
        triage = { ...triage, severity: data.manualSeverity };
      }
      if (data.manualSpecialization) {
        triage = { ...triage, specialization: data.manualSpecialization };
      }
    } catch {
      // Fallback triage if engine throws
      triage = {
        severity: data.manualSeverity || "P3",
        specialization: data.manualSpecialization || "General",
        reasoning: "Triage engine unavailable — using fallback classification.",
        urgencyScore: 50,
        recommendedEquipment: ["First Aid Kit", "Oxygen Supply", "IV Access Kit"],
      };
    }

    setTriageResult(triage);
    setPhase("triage_done");

    // Phase 2: Dispatch scoring
    await new Promise((r) => setTimeout(r, 1000));
    setPhase("dispatching");

    await new Promise((r) => setTimeout(r, 1500));

    let scores: DispatchScore[];
    let usedAmbulances = ambulances;
    let usedHospitals = hospitals;

    try {
      // Try to import the real modules dynamically
      const [dispatchMod, dataMod] = await Promise.all([
        import("@/lib/dispatch-algorithm"),
        import("@/lib/simulation-data"),
      ]);

      usedAmbulances = dataMod.ambulances || DEMO_AMBULANCES;
      usedHospitals = dataMod.hospitals || DEMO_HOSPITALS;

      const nearestHospitalKm = nearestDistanceKm(
        { lat: data.lat, lng: data.lng },
        usedHospitals.map((h) => h.location)
      );

      // If configured data is from another city (e.g., Delhi) and emergency is far away,
      // create localized resources around the emergency to keep dispatch practical.
      if (nearestHospitalKm > DISPATCH_LOCALIZATION_THRESHOLD_KM) {
        usedHospitals = buildLocalizedHospitals({ lat: data.lat, lng: data.lng });
        usedAmbulances = buildLocalizedAmbulances({ lat: data.lat, lng: data.lng });
      }

      setAmbulances(usedAmbulances);
      setHospitals(usedHospitals);

      const emergencyObj: Emergency = {
        id: emergencyId,
        callerName: data.callerName,
        callerPhone: data.callerPhone,
        description: data.description,
        location: { lat: data.lat, lng: data.lng },
        address: data.address,
        severity: triage.severity,
        specialization: triage.specialization,
        status: "pending",
        createdAt: new Date(),
      };
      scores = dispatchMod.calculateDispatchScores(
        emergencyObj,
        usedAmbulances,
        usedHospitals
      );
    } catch {
      // Modules not yet available — use fallback
      scores = generateFallbackScores(triage, usedAmbulances, usedHospitals);
    }

    // Sort by total score descending, pick top 3
    scores.sort((a, b) => b.totalScore - a.totalScore);
    const topRecommendations = scores.slice(0, 3);
    setDispatchResults(topRecommendations);
    setPhase("dispatch_done");

    const recommendationsPayload: RecommendationPayload[] = topRecommendations.map((rec, idx) => {
      const recAmb = usedAmbulances.find((a) => a.id === rec.ambulanceId) || usedAmbulances[0];
      const recHosp = usedHospitals.find((h) => h.id === rec.hospitalId) || usedHospitals[0];

      return {
        rank: idx + 1,
        ambulanceId: rec.ambulanceId,
        ambulanceCallSign: recAmb?.callSign || "Unknown",
        hospitalId: rec.hospitalId,
        hospitalName: recHosp?.name || "Unknown",
        totalScore: rec.totalScore,
        estimatedArrivalMinutes: rec.estimatedArrivalMinutes,
        distanceKm: rec.distanceKm,
      };
    });

    const contextPayload: PersistEmergencyContext = {
      emergencyId,
      callerName: data.callerName,
      callerPhone: data.callerPhone,
      description: data.description,
      address: data.address,
      location: { lat: data.lat, lng: data.lng },
      triage,
      recommendations: recommendationsPayload,
    };

    setPersistContext(contextPayload);
    void persistAnalyzeRecord(contextPayload);
  }

  // ─── Confirm dispatch ──────────────────────────────────────────────────────
  function handleConfirm(index: number) {
    setConfirmingIndex(index);
    setTimeout(async () => {
      setConfirmingIndex(null);
      setConfirmedIndex(index);
      setPhase("confirmed");

      // Fetch the route after confirming dispatch
      const selectedScore = dispatchResults[index];
      if (!selectedScore || !emergencyCoords) return;

      const selectedAmbulance = findAmbulance(selectedScore.ambulanceId);
      const selectedHospital = findHospital(selectedScore.hospitalId);

      if (activeEmergencyId) {
        void persistConfirmedDispatch({
          emergencyId: activeEmergencyId,
          selectedRank: index + 1,
          ambulanceId: selectedScore.ambulanceId,
          ambulanceCallSign: selectedAmbulance.callSign,
          hospitalId: selectedScore.hospitalId,
          hospitalName: selectedHospital.name,
          estimatedArrivalMinutes: selectedScore.estimatedArrivalMinutes,
          distanceKm: selectedScore.distanceKm,
          callerName: persistContext?.callerName,
          callerPhone: persistContext?.callerPhone,
          description: persistContext?.description,
          address: persistContext?.address,
          location: persistContext?.location,
          triage: persistContext?.triage,
          recommendations: persistContext?.recommendations,
        });

        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "smartresq:dispatch-confirmed",
            JSON.stringify({ emergencyId: activeEmergencyId, timestamp: Date.now() })
          );
          window.dispatchEvent(new Event("smartresq:dispatch-confirmed"));
        }
      }

      setRouteLoading(true);
      try {
        const routingMod = await import("@/lib/routing-service");
        const result = await routingMod.getDispatchRoute(
          selectedAmbulance.location,
          emergencyCoords,
          selectedHospital.location
        );
        setRouteData(result);
      } catch {
        // OSRM failed — use fallback straight-line route
        try {
          const routingMod = await import("@/lib/routing-service");
          const fallback = routingMod.generateFallbackRoute([
            selectedAmbulance.location,
            emergencyCoords,
            selectedHospital.location,
          ]);
          setRouteData(fallback);
        } catch {
          setRouteData(null);
        }
      } finally {
        setRouteLoading(false);
      }
    }, 1200);
  }

  // ─── Right panel content ───────────────────────────────────────────────────
  function renderRightPanel() {
    if (phase === "idle") {
      return (
        <div className="flex h-full flex-col items-center justify-center py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#1e293b] bg-gray-800/50">
            <Brain className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-400">
            AI Dispatch Ready
          </h3>
          <p className="max-w-xs text-sm text-gray-600">
            Enter emergency details on the left to get AI-powered triage
            analysis and optimal ambulance dispatch recommendations.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {/* Triaging spinner */}
        {phase === "triaging" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-5">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
              <div className="absolute inset-0 animate-ping rounded-full bg-cyan-500/20" />
            </div>
            <h3 className="mb-1 text-base font-semibold text-gray-200">
              AI Analyzing Emergency...
            </h3>
            <p className="text-sm text-gray-500">
              Classifying severity, specialization, and urgency
            </p>
          </div>
        )}

        {/* Triage result */}
        {triageResult && phase !== "triaging" && (
          <TriageResultCard result={triageResult} />
        )}

        {/* Dispatching spinner */}
        {phase === "dispatching" && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="relative mb-5">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
            <h3 className="mb-1 text-base font-semibold text-gray-200">
              Calculating Optimal Dispatch...
            </h3>
            <p className="text-sm text-gray-500">
              Scoring ambulances by distance, traffic, equipment, and hospital
              match
            </p>
          </div>
        )}

        {/* Dispatch results */}
        {dispatchResults.length > 0 && phase !== "dispatching" && (
          <>
            <div className="flex items-center gap-2.5 pt-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
                Dispatch Recommendations
              </h3>
            </div>

            {dispatchResults.map((score, idx) => (
              <DispatchResultCard
                key={score.ambulanceId + score.hospitalId}
                score={score}
                ambulance={findAmbulance(score.ambulanceId)}
                hospital={findHospital(score.hospitalId)}
                rank={idx + 1}
                onConfirm={
                  confirmedIndex === null
                    ? () => handleConfirm(idx)
                    : undefined
                }
                isConfirming={confirmingIndex === idx}
              />
            ))}
          </>
        )}

        {/* Success toast */}
        {phase === "confirmed" && confirmedIndex !== null && (
          <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-green-400" />
            <div>
              <p className="text-sm font-semibold text-green-300">
                Dispatch Confirmed!
              </p>
              <p className="text-xs text-green-400/70">
                {findAmbulance(dispatchResults[confirmedIndex].ambulanceId).callSign}{" "}
                dispatched to the emergency. ETA:{" "}
                {Math.round(dispatchResults[confirmedIndex].estimatedArrivalMinutes)} min.
                Destination:{" "}
                {findHospital(dispatchResults[confirmedIndex].hospitalId).name}.
              </p>
            </div>
          </div>
        )}

        {/* Route Map — shown after dispatch confirmation */}
        {phase === "confirmed" && confirmedIndex !== null && emergencyCoords && (
          <div
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animation: "fadeSlideIn 0.5s ease-out forwards" }}
          >
            <div className="flex items-center gap-2.5 pt-2 pb-3">
              <Navigation className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
                Fastest Route
              </h3>
            </div>
            <RouteMapPanel
              ambulanceLocation={findAmbulance(dispatchResults[confirmedIndex].ambulanceId).location}
              emergencyLocation={emergencyCoords}
              hospitalLocation={findHospital(dispatchResults[confirmedIndex].hospitalId).location}
              ambulance={findAmbulance(dispatchResults[confirmedIndex].ambulanceId)}
              hospital={findHospital(dispatchResults[confirmedIndex].hospitalId)}
              routeData={routeData}
              isLoading={routeLoading}
            />
          </div>
        )}
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0f1c]">
      {/* Page header */}
      <header className="border-b border-[#1e293b] bg-[#111827]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15">
            <Siren className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-100">
              Emergency Dispatch
            </h1>
            <p className="text-xs text-gray-500">
              AI-powered triage and optimal ambulance routing
            </p>
          </div>

          {phase !== "idle" && phase !== "confirmed" && (
            <div className="ml-auto flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500" />
              </span>
              <span className="text-xs font-medium text-cyan-400">
                Processing
              </span>
            </div>
          )}

          {phase === "confirmed" && (
            <div className="ml-auto flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-xs font-medium text-green-400">
                Dispatched
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Two-column layout */}
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Left — Form */}
        <div>
          <EmergencyForm
            onSubmit={handleSubmit}
            isLoading={phase === "triaging" || phase === "dispatching"}
          />
        </div>

        {/* Right — Results */}
        <div>{renderRightPanel()}</div>
      </main>
    </div>
  );
}
