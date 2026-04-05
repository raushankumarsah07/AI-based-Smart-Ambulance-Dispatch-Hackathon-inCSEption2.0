"use client";

import { useState } from "react";
import {
  Brain,
  Activity,
  Loader2,
  CheckCircle2,
  Siren,
} from "lucide-react";
import EmergencyForm from "@/components/dispatch/EmergencyForm";
import TriageResultCard from "@/components/dispatch/TriageResultCard";
import DispatchResultCard from "@/components/dispatch/DispatchResultCard";
import { triageEmergency } from "@/lib/triage-engine";
import type {
  TriageResult,
  DispatchScore,
  Ambulance,
  Hospital,
  SeverityLevel,
  Specialization,
} from "@/lib/types";

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
    const distScore = 0.6 + Math.random() * 0.4;
    const trafficScore = 0.5 + Math.random() * 0.5;
    const equipScore = 0.5 + Math.random() * 0.5;
    const hospMatchScore = 0.4 + Math.random() * 0.6;
    const fuelScore = amb.fuelLevel / 100;

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

// ─────────────────────────────────────────────────────────────────────────────
// Dispatch Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DispatchPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [dispatchResults, setDispatchResults] = useState<DispatchScore[]>([]);
  const [confirmedIndex, setConfirmedIndex] = useState<number | null>(null);
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null);

  // Data maps for looking up ambulance/hospital by ID
  const [ambulances, setAmbulances] = useState<Ambulance[]>(DEMO_AMBULANCES);
  const [hospitals, setHospitals] = useState<Hospital[]>(DEMO_HOSPITALS);

  function findAmbulance(id: string): Ambulance {
    return ambulances.find((a) => a.id === id) || ambulances[0];
  }
  function findHospital(id: string): Hospital {
    return hospitals.find((h) => h.id === id) || hospitals[0];
  }

  // ─── Submit handler ────────────────────────────────────────────────────────
  async function handleSubmit(data: FormData) {
    // Phase 1: Triage
    setPhase("triaging");
    setTriageResult(null);
    setDispatchResults([]);
    setConfirmedIndex(null);

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
      setAmbulances(usedAmbulances);
      setHospitals(usedHospitals);

      scores = dispatchMod.calculateDispatchScores(
        triage,
        usedAmbulances,
        usedHospitals,
        { lat: data.lat, lng: data.lng }
      );
    } catch {
      // Modules not yet available — use fallback
      scores = generateFallbackScores(triage, usedAmbulances, usedHospitals);
    }

    // Sort by total score descending, pick top 3
    scores.sort((a, b) => b.totalScore - a.totalScore);
    setDispatchResults(scores.slice(0, 3));
    setPhase("dispatch_done");
  }

  // ─── Confirm dispatch ──────────────────────────────────────────────────────
  function handleConfirm(index: number) {
    setConfirmingIndex(index);
    setTimeout(() => {
      setConfirmingIndex(null);
      setConfirmedIndex(index);
      setPhase("confirmed");
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
