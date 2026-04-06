"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, Loader2, MapPin, Phone, Search, User, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

const LocationMapPicker = dynamic(
  () => import("@/components/dispatch/LocationMapPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs text-gray-400">
        Loading map...
      </div>
    ),
  }
);

const SPECIALIZATION_OPTIONS = [
  "Trauma",
  "Cardiac",
  "Burns",
  "Pediatric",
  "Neuro",
  "General",
] as const;

type RegistrationForm = {
  hospitalName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
  totalBeds: string;
  emergencyBeds: string;
  icuBeds: string;
  totalAmbulances: string;
  specializations: string[];
};

const INITIAL_FORM: RegistrationForm = {
  hospitalName: "",
  contactPerson: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  city: "",
  state: "",
  latitude: "",
  longitude: "",
  totalBeds: "",
  emergencyBeds: "",
  icuBeds: "",
  totalAmbulances: "",
  specializations: [],
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegistrationForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locatedPlaceLabel, setLocatedPlaceLabel] = useState<string | null>(null);
  const [nearestHospital, setNearestHospital] = useState<{
    id: string;
    hospitalName: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    distanceKm: number;
  } | null>(null);
  const [nearbyHospitals, setNearbyHospitals] = useState<Array<{
    id: string;
    hospitalName: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    distanceKm: number;
  }>>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{
    id: string;
    hospitalName: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
  }>>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 12.9716, lng: 77.5946 });
  const [draggedHospital, setDraggedHospital] = useState<string | null>(null);

  const requiredMissing = useMemo(() => {
    const required = [
      "hospitalName",
      "contactPerson",
      "contactEmail",
      "contactPhone",
      "address",
      "city",
      "state",
    ] as const;

    return required.some((field) => !form[field].trim());
  }, [form]);

  function updateField<K extends keyof RegistrationForm>(key: K, value: RegistrationForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function fetchNearestByCoordinates(lat: string, lng: string) {
    const nearestResponse = await fetch(
      `/api/hospitals/register?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
      { cache: "no-store" }
    );

    if (!nearestResponse.ok) {
      setNearestHospital(null);
      setNearbyHospitals([]);
      return;
    }

    const nearestData = (await nearestResponse.json()) as {
      ok?: boolean;
      nearestHospital?: {
        id: string;
        hospitalName: string;
        city: string;
        state: string;
        latitude: number;
        longitude: number;
        distanceKm: number;
      } | null;
      nearbyHospitals?: Array<{
        id: string;
        hospitalName: string;
        city: string;
        state: string;
        latitude: number;
        longitude: number;
        distanceKm: number;
      }>;
    };

    if (nearestData.ok && nearestData.nearestHospital) {
      setNearestHospital(nearestData.nearestHospital);
      setNearbyHospitals(
        Array.isArray(nearestData.nearbyHospitals) ? nearestData.nearbyHospitals : []
      );
      return;
    }

    setNearestHospital(null);
    setNearbyHospitals([]);
  }

  async function fetchHospitalsByCity(cityName: string) {
    if (!cityName.trim()) return false;

    try {
      const response = await fetch(
        `/api/hospitals/register?city=${encodeURIComponent(cityName)}`,
        { cache: "no-store" }
      );

      if (!response.ok) return false;

      const data = (await response.json()) as {
        ok?: boolean;
        suggestions?: Array<{
          id: string;
          hospitalName: string;
          city: string;
          state: string;
          latitude: number;
          longitude: number;
        }>;
      };

      if (data.ok && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        const cityHospitals = data.suggestions.map((h) => ({
          id: h.id,
          hospitalName: h.hospitalName,
          city: h.city,
          state: h.state,
          latitude: h.latitude,
          longitude: h.longitude,
          distanceKm: 0,
        }));

        setNearbyHospitals(cityHospitals);
        if (cityHospitals.length > 0) {
          setNearestHospital(cityHospitals[0]);
        }
        return true;
      }
    } catch {
      // Silently fail, will try coordinate-based search
    }

    return false;
  }

  async function locateCurrentPosition() {
    if (detectingLocation) return;

    setDetectingLocation(true);
    setError(null);
    setLocationQuery("");
    setLocatedPlaceLabel(null);
    setNearestHospital(null);
    setNearbyHospitals([]);

    try {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setError("Geolocation is not supported by your browser.");
        setDetectingLocation(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = Number(position.coords.latitude.toFixed(6));
          const lng = Number(position.coords.longitude.toFixed(6));

          updateField("latitude", lat.toFixed(6));
          updateField("longitude", lng.toFixed(6));
          setMapCenter({ lat, lng });

          // Reverse geocode to get location label
          try {
            const reverseResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
              { headers: { Accept: "application/json" } }
            );

            if (reverseResponse.ok) {
              const reverseData = (await reverseResponse.json()) as {
                display_name?: string;
                address?: {
                  city?: string;
                  town?: string;
                  village?: string;
                  state?: string;
                };
              };

              const displayName = reverseData.display_name || `${lat}, ${lng}`;
              setLocatedPlaceLabel(displayName);
              updateField("address", displayName);

              const detectedCity =
                reverseData.address?.city || reverseData.address?.town || reverseData.address?.village;
              if (detectedCity && !form.city.trim()) {
                updateField("city", detectedCity);
              }
              if (reverseData.address?.state && !form.state.trim()) {
                updateField("state", reverseData.address.state);
              }

              // Try city-based search first
              if (detectedCity) {
                const cityFound = await fetchHospitalsByCity(detectedCity);
                if (cityFound) {
                  setDetectingLocation(false);
                  return;
                }
              }

              // Fallback to coordinate-based search
              await fetchNearestByCoordinates(lat.toFixed(6), lng.toFixed(6));
            }
          } catch {
            // If reverse geocoding fails, just fetch by coordinates
            await fetchNearestByCoordinates(lat.toFixed(6), lng.toFixed(6));
          }

          setDetectingLocation(false);
        },
        () => {
          setError("Unable to detect your location. Please allow location access or type a location manually.");
          setDetectingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch {
      setError("Failed to use current location. Please try again.");
      setDetectingLocation(false);
    }
  }

  useEffect(() => {
    const query = locationQuery.trim();

    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/hospitals/register?q=${encodeURIComponent(query)}`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          setLocationSuggestions([]);
          return;
        }

        const data = (await response.json()) as {
          ok?: boolean;
          suggestions?: Array<{
            id: string;
            hospitalName: string;
            city: string;
            state: string;
            latitude: number;
            longitude: number;
          }>;
        };

        setLocationSuggestions(data.ok && Array.isArray(data.suggestions) ? data.suggestions : []);
      } catch {
        setLocationSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [locationQuery]);

  async function locateFromTypedAddress() {
    if (!locationQuery.trim()) {
      setError("Type a location to detect coordinates on the map.");
      return;
    }

    setLocating(true);
    setError(null);

    try {
      const selectedSuggestion = locationSuggestions.find(
        (item) =>
          `${item.hospitalName}, ${item.city}`.toLowerCase() ===
          locationQuery.trim().toLowerCase()
      );

      if (selectedSuggestion) {
        const lat = selectedSuggestion.latitude.toFixed(6);
        const lng = selectedSuggestion.longitude.toFixed(6);

        updateField("latitude", lat);
        updateField("longitude", lng);
        updateField("address", `${selectedSuggestion.hospitalName}, ${selectedSuggestion.city}`);
        updateField("city", selectedSuggestion.city);
        updateField("state", selectedSuggestion.state);

        setLocatedPlaceLabel(`${selectedSuggestion.hospitalName}, ${selectedSuggestion.city}`);
        await fetchNearestByCoordinates(lat, lng);
        return;
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(locationQuery)}&limit=1&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );

      if (!response.ok) {
        setError("Unable to detect this location right now.");
        return;
      }

      const results = (await response.json()) as Array<{
        lat?: string;
        lon?: string;
        display_name?: string;
        address?: {
          city?: string;
          town?: string;
          village?: string;
          state?: string;
        };
      }>;

      if (!results.length || !results[0]?.lat || !results[0]?.lon) {
        setError("Location not found. Try a clearer address with city and state.");
        return;
      }

      const first = results[0];
      const lat = Number(first.lat).toFixed(6);
      const lng = Number(first.lon).toFixed(6);

      updateField("latitude", lat);
      updateField("longitude", lng);
      setLocatedPlaceLabel(first.display_name || `${lat}, ${lng}`);

      if (first.display_name) {
        updateField("address", first.display_name);
      }

      const detectedCity = first.address?.city || first.address?.town || first.address?.village;
      if (detectedCity && !form.city.trim()) {
        updateField("city", detectedCity);
      }
      if (first.address?.state && !form.state.trim()) {
        updateField("state", first.address.state);
      }
      
      // Try to fetch hospitals by city name first, then by coordinates
      if (detectedCity) {
        const cityFound = await fetchHospitalsByCity(detectedCity);
        if (cityFound) return;
      }
      
      await fetchNearestByCoordinates(lat, lng);
    } catch {
      setError("Failed to locate address. Please try again.");
    } finally {
      setLocating(false);
    }
  }

  function handleDropHospital(hospital: typeof locationSuggestions[number]) {
    updateField("hospitalName", hospital.hospitalName);
    updateField("latitude", hospital.latitude.toFixed(6));
    updateField("longitude", hospital.longitude.toFixed(6));
    updateField("address", `${hospital.hospitalName}, ${hospital.city}`);
    updateField("city", hospital.city);
    updateField("state", hospital.state);
    
    setLocatedPlaceLabel(`${hospital.hospitalName}, ${hospital.city}`);
    setLocationQuery(`${hospital.hospitalName}, ${hospital.city}`);
    setMapCenter({ lat: hospital.latitude, lng: hospital.longitude });
    setDraggedHospital(null);
    
    void fetchNearestByCoordinates(
      hospital.latitude.toFixed(6),
      hospital.longitude.toFixed(6)
    );
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (requiredMissing) {
      setError("Please fill all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/hospitals/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          latitude: Number(form.latitude) || 0,
          longitude: Number(form.longitude) || 0,
          totalBeds: Number(form.totalBeds) || 0,
          emergencyBeds: Number(form.emergencyBeds) || 0,
          icuBeds: Number(form.icuBeds) || 0,
          totalAmbulances: Number(form.totalAmbulances) || 0,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        registrationId?: string;
      };

      if (!response.ok || !data.ok) {
        setError(data.error || "Unable to submit registration.");
        return;
      }

      setSuccess(`Registration submitted successfully. ID: ${data.registrationId || "N/A"}`);
      setForm(INITIAL_FORM);
    } catch {
      setError("Server error while submitting registration.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30";

  const labelClass = "mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-400";

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-xl border border-[#1e293b] bg-[#111827] p-5">
          <div className="mb-2 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-gray-100">Hospital Registration</h1>
          </div>
          <p className="text-sm text-gray-400">
            Register your hospital to appear in emergency dispatch recommendations.
          </p>
        </div>

        <form onSubmit={submitForm} className="space-y-5">
          <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
              Hospital Details
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Hospital Name *</label>
                <input
                  value={form.hospitalName}
                  onChange={(e) => updateField("hospitalName", e.target.value)}
                  className={inputClass}
                  placeholder="Enter hospital name"
                />
              </div>

              <div>
                <label className={labelClass}>Contact Person *</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                  <input
                    value={form.contactPerson}
                    onChange={(e) => updateField("contactPerson", e.target.value)}
                    className={cn(inputClass, "pl-10")}
                    placeholder="Name"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Contact Phone *</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                  <input
                    value={form.contactPhone}
                    onChange={(e) => updateField("contactPhone", e.target.value)}
                    className={cn(inputClass, "pl-10")}
                    placeholder="+91..."
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Contact Email *</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => updateField("contactEmail", e.target.value)}
                  className={inputClass}
                  placeholder="hospital@example.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Address *</label>
                <input
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className={inputClass}
                  placeholder="Street / Area"
                />
              </div>

              <div>
                <label className={labelClass}>City *</label>
                <input
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className={inputClass}
                  placeholder="City"
                />
              </div>

              <div>
                <label className={labelClass}>State *</label>
                <input
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  className={inputClass}
                  placeholder="State"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#1e293b] bg-[#111827] p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-300">
              <MapPin className="h-4 w-4 text-cyan-400" />
              Location & Capacity
            </h2>

            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Type Hospital Location</label>
                <div className="flex gap-2 flex-wrap">
                  <input
                    list="hospital-location-suggestions"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className={cn(inputClass, "flex-1 min-w-[200px]")}
                    placeholder="e.g. Apollo Hospital, Bengaluru"
                  />
                  <button
                    type="button"
                    onClick={() => void locateFromTypedAddress()}
                    disabled={locating || detectingLocation}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 whitespace-nowrap",
                      (locating || detectingLocation) && "cursor-not-allowed opacity-60"
                    )}
                  >
                    {locating ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Locating...
                      </>
                    ) : (
                      <>
                        <Search className="h-3.5 w-3.5" />
                        Locate
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void locateCurrentPosition()}
                    disabled={detectingLocation || locating}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 whitespace-nowrap",
                      (detectingLocation || locating) && "cursor-not-allowed opacity-60"
                    )}
                  >
                    {detectingLocation ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Navigation className="h-3.5 w-3.5" />
                        Use Current Location
                      </>
                    )}
                  </button>
                </div>

                {locationSuggestions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] text-gray-400">
                      💡 Drag hospital names to the map below or click to select:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {locationSuggestions.map((hospital) => (
                        <div
                          key={hospital.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer!.effectAllowed = "move";
                            e.dataTransfer!.setData("application/json", JSON.stringify(hospital));
                            setDraggedHospital(hospital.id);
                          }}
                          onDragEnd={() => setDraggedHospital(null)}
                          onClick={() => handleDropHospital(hospital)}
                          className={cn(
                            "cursor-move rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                            draggedHospital === hospital.id
                              ? "border-cyan-400 bg-cyan-500/30 opacity-70"
                              : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/20"
                          )}
                        >
                          <div className="font-semibold">{hospital.hospitalName}</div>
                          <div className="text-[10px] text-gray-300">{hospital.city}, {hospital.state}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <datalist id="hospital-location-suggestions">
                  {locationSuggestions.map((item) => (
                    <option
                      key={item.id}
                      value={`${item.hospitalName}, ${item.city}`}
                    />
                  ))}
                </datalist>

                {locatedPlaceLabel && (
                  <p className="mt-2 text-xs text-cyan-300">
                    ✓ Located: {locatedPlaceLabel}
                  </p>
                )}

                {(nearbyHospitals.length > 0 || nearestHospital || locatedPlaceLabel) && (
                  <div className="mt-3 space-y-3">
                    {nearbyHospitals.length > 0 && (
                      <>
                        <div>
                          <p className="text-[11px] text-gray-400 mb-2">
                            🏥 Hospitals found near {locatedPlaceLabel}. Drag to select or click:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {nearbyHospitals.map((hospital) => (
                              <div
                                key={hospital.id}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer!.effectAllowed = "move";
                                  e.dataTransfer!.setData("application/json", JSON.stringify(hospital));
                                  setDraggedHospital(hospital.id);
                                }}
                                onDragEnd={() => setDraggedHospital(null)}
                                onClick={() => {
                                  setNearestHospital(hospital);
                                  updateField("latitude", hospital.latitude.toFixed(6));
                                  updateField("longitude", hospital.longitude.toFixed(6));
                                  updateField("address", `${hospital.hospitalName}, ${hospital.city}`);
                                  updateField("city", hospital.city);
                                  updateField("state", hospital.state);
                                }}
                                className={cn(
                                  "cursor-move rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                                  draggedHospital === hospital.id
                                    ? "border-emerald-400 bg-emerald-500/30 opacity-70"
                                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/20"
                                )}
                              >
                                <div className="font-semibold">{hospital.hospitalName}</div>
                                <div className="text-[10px] text-gray-300">
                                  {hospital.city}, {hospital.state} • {hospital.distanceKm.toFixed(2)} km
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {nearestHospital && (
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                        <div className="font-semibold">✓ Selected: {nearestHospital.hospitalName}</div>
                        <div className="text-[11px] mt-1">
                          {nearestHospital.city}, {nearestHospital.state} • {nearestHospital.distanceKm.toFixed(2)} km away
                        </div>
                      </div>
                    )}

                    {nearbyHospitals.length === 0 && locatedPlaceLabel && (
                      <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-gray-300">
                        No registered hospitals found near this location yet.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => updateField("latitude", e.target.value)}
                  className={inputClass}
                  placeholder="12.9716"
                />
              </div>
              <div>
                <label className={labelClass}>Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => updateField("longitude", e.target.value)}
                  className={inputClass}
                  placeholder="77.5946"
                />
              </div>
            </div>

            <div className="mb-5 overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
              <LocationMapPicker
                value={{ lat: Number(form.latitude) || mapCenter.lat, lng: Number(form.longitude) || mapCenter.lng }}
                selectedLabel={nearestHospital?.hospitalName || locationQuery || undefined}
                onDropHospital={handleDropHospital}
                onChange={({ lat, lng, address }) => {
                  updateField("latitude", lat.toFixed(6));
                  updateField("longitude", lng.toFixed(6));

                  if (address && !form.address.trim()) {
                    updateField("address", address);
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Total Ambulances (Hospital)</label>
                <input
                  type="number"
                  min={0}
                  value={form.totalAmbulances}
                  onChange={(e) => updateField("totalAmbulances", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Total Beds</label>
                <input
                  type="number"
                  min={0}
                  value={form.totalBeds}
                  onChange={(e) => updateField("totalBeds", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Emergency Beds</label>
                <input
                  type="number"
                  min={0}
                  value={form.emergencyBeds}
                  onChange={(e) => updateField("emergencyBeds", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>ICU Beds</label>
                <input
                  type="number"
                  min={0}
                  value={form.icuBeds}
                  onChange={(e) => updateField("icuBeds", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-5">
              <label className={labelClass}>Specializations</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATION_OPTIONS.map((spec) => {
                  const selected = form.specializations.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => {
                        updateField(
                          "specializations",
                          selected
                            ? form.specializations.filter((s) => s !== spec)
                            : [...form.specializations, spec]
                        );
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        selected
                          ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
                          : "border-gray-700 bg-gray-800 text-gray-400 hover:border-cyan-500/40"
                      )}
                    >
                      {spec}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || requiredMissing}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 py-3.5 text-sm font-semibold text-white transition-all",
              "hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
              (submitting || requiredMissing) && "cursor-not-allowed opacity-60"
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4" />
                Register Hospital
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
