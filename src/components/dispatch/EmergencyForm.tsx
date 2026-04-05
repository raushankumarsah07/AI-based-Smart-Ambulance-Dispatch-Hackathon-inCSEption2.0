"use client";

import { useState } from "react";
import {
  Phone,
  User,
  MapPin,
  FileText,
  ChevronDown,
  Brain,
  Loader2,
  Map,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeverityLevel, Specialization } from "@/lib/types";

interface EmergencyFormData {
  callerName: string;
  callerPhone: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  manualSeverity?: SeverityLevel;
  manualSpecialization?: Specialization;
}

interface EmergencyFormProps {
  onSubmit: (data: EmergencyFormData) => void;
  isLoading?: boolean;
}

const SEVERITY_OPTIONS: SeverityLevel[] = ["P1", "P2", "P3", "P4"];
const SPECIALIZATION_OPTIONS: Specialization[] = [
  "Trauma",
  "Cardiac",
  "Burns",
  "Pediatric",
  "Neuro",
  "General",
];

// Random Delhi demo locations
const DELHI_LOCATIONS = [
  { lat: 28.6139, lng: 77.209, address: "Connaught Place, New Delhi" },
  { lat: 28.6562, lng: 77.2410, address: "Civil Lines, Delhi" },
  { lat: 28.5355, lng: 77.2100, address: "Saket, New Delhi" },
  { lat: 28.6280, lng: 77.2189, address: "Karol Bagh, New Delhi" },
  { lat: 28.6692, lng: 77.4538, address: "Noida Sector 62, UP" },
];

function getRandomDelhiLocation() {
  return DELHI_LOCATIONS[Math.floor(Math.random() * DELHI_LOCATIONS.length)];
}

export default function EmergencyForm({ onSubmit, isLoading = false }: EmergencyFormProps) {
  const defaultLocation = getRandomDelhiLocation();

  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState(defaultLocation.address);
  const [lat, setLat] = useState(defaultLocation.lat);
  const [lng, setLng] = useState(defaultLocation.lng);
  const [manualOverrideOpen, setManualOverrideOpen] = useState(false);
  const [manualSeverity, setManualSeverity] = useState<SeverityLevel | "">("");
  const [manualSpecialization, setManualSpecialization] = useState<Specialization | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = "Emergency description is required";
    }
    if (!address.trim() && (!lat || !lng)) {
      newErrors.location = "Either an address or coordinates are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || isLoading) return;

    onSubmit({
      callerName,
      callerPhone,
      description,
      address,
      lat,
      lng,
      manualSeverity: manualSeverity || undefined,
      manualSpecialization: manualSpecialization || undefined,
    });
  }

  const inputClass =
    "w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30";

  const labelClass = "mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Caller Info */}
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
          Caller Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              <User className="h-3.5 w-3.5 text-cyan-500" />
              Name
            </label>
            <input
              type="text"
              value={callerName}
              onChange={(e) => setCallerName(e.target.value)}
              placeholder="Caller's name"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              <Phone className="h-3.5 w-3.5 text-cyan-500" />
              Phone
            </label>
            <input
              type="tel"
              value={callerPhone}
              onChange={(e) => setCallerPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Emergency Description */}
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
          Emergency Description
        </h3>
        <label className={labelClass}>
          <FileText className="h-3.5 w-3.5 text-cyan-500" />
          What happened?
        </label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.description;
                return next;
              });
            }
          }}
          placeholder="Describe the emergency in detail (e.g., 'Person collapsed with chest pain, not breathing, near India Gate...')"
          rows={4}
          className={cn(inputClass, "resize-none", errors.description && "border-red-500 focus:border-red-500")}
        />
        {errors.description && (
          <p className="mt-1.5 text-xs text-red-400">{errors.description}</p>
        )}
        <p className="mt-2 text-[11px] text-gray-500">
          AI will analyze keywords to determine severity and required specialization.
        </p>
      </div>

      {/* Location */}
      <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
          Location
        </h3>

        <div className="mb-4">
          <label className={labelClass}>
            <MapPin className="h-3.5 w-3.5 text-cyan-500" />
            Address
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (errors.location) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.location;
                    return next;
                  });
                }
              }}
              placeholder="Street address or landmark"
              className={cn(inputClass, "flex-1", errors.location && "border-red-500 focus:border-red-500")}
            />
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition-colors hover:border-cyan-500 hover:text-cyan-400"
              title="Use map picker (coming soon)"
            >
              <Map className="h-3.5 w-3.5" />
              Use Map
            </button>
          </div>
          {errors.location && (
            <p className="mt-1.5 text-xs text-red-400">{errors.location}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Latitude</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
              placeholder="28.6139"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Longitude</label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
              placeholder="77.2090"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Manual Override (collapsible) */}
      <div className="rounded-xl border border-[#1e293b] bg-[#111827]">
        <button
          type="button"
          onClick={() => setManualOverrideOpen(!manualOverrideOpen)}
          className="flex w-full items-center justify-between p-5 text-left"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
            Manual Override
          </h3>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-500 transition-transform duration-200",
              manualOverrideOpen && "rotate-180"
            )}
          />
        </button>

        {manualOverrideOpen && (
          <div className="border-t border-[#1e293b] px-5 pb-5 pt-4">
            <p className="mb-4 text-xs text-gray-500">
              Override the AI triage with manual severity and specialization.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Severity</label>
                <select
                  value={manualSeverity}
                  onChange={(e) => setManualSeverity(e.target.value as SeverityLevel | "")}
                  className={cn(inputClass, "cursor-pointer")}
                >
                  <option value="">Auto (AI decides)</option>
                  {SEVERITY_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s} -{" "}
                      {s === "P1"
                        ? "Critical"
                        : s === "P2"
                        ? "Urgent"
                        : s === "P3"
                        ? "Moderate"
                        : "Minor"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Specialization</label>
                <select
                  value={manualSpecialization}
                  onChange={(e) =>
                    setManualSpecialization(e.target.value as Specialization | "")
                  }
                  className={cn(inputClass, "cursor-pointer")}
                >
                  <option value="">Auto (AI decides)</option>
                  {SPECIALIZATION_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          "glow-pulse flex w-full items-center justify-center gap-2.5 rounded-xl bg-cyan-600 px-6 py-3.5 text-sm font-semibold text-white transition-all",
          "hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
          isLoading && "cursor-not-allowed opacity-60"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Brain className="h-5 w-5" />
            Analyze &amp; Dispatch
          </>
        )}
      </button>
    </form>
  );
}
