import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { estimateTravelTime, haversineDistance } from "@/lib/utils";
import AmbulanceLiveModel from "@/lib/models/AmbulanceLive";
import DispatchRecordModel from "@/lib/models/DispatchRecord";
import HospitalRegistrationModel from "@/lib/models/HospitalRegistration";

export const runtime = "nodejs";

type Coordinates = { lat: number; lng: number };

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function randomCoordinate(center: Coordinates, radiusKm: number): Coordinates {
  const radiusInDeg = radiusKm / 111.32;
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDeg * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  return {
    lat: center.lat + y,
    lng: center.lng + x / Math.cos((center.lat * Math.PI) / 180),
  };
}

function pickNearest<T extends { location: Coordinates }>(
  source: Coordinates,
  items: T[]
) {
  let best: T | null = null;
  let bestDistanceKm = Number.POSITIVE_INFINITY;

  for (const item of items) {
    const distanceKm = haversineDistance(source, item.location);
    if (distanceKm < bestDistanceKm) {
      bestDistanceKm = distanceKm;
      best = item;
    }
  }

  return { best, bestDistanceKm };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lat = toNumber(body?.lat, NaN);
    const lng = toNumber(body?.lng, NaN);
    const address =
      typeof body?.address === "string" && body.address.trim().length > 0
        ? body.address.trim()
        : `SOS near ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { ok: false, error: "Valid lat and lng are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const origin = { lat, lng };

    async function seedLocalFleetIfMissing() {
      const existingCount = await AmbulanceLiveModel.countDocuments();
      if (existingCount > 0) return;

      const seed = Array.from({ length: 10 }, (_, idx) => {
        const isAls = idx < 4;
        return {
          ambulanceId: `SOS-${String(idx + 1).padStart(2, "0")}`,
          callSign: `SOS-${String(idx + 1).padStart(2, "0")}`,
          type: isAls ? "ALS" : "BLS",
          status: "available",
          location: randomCoordinate(origin, 10),
          speed: 38 + Math.floor(Math.random() * 18),
          fuelLevel: 55 + Math.floor(Math.random() * 40),
          equipment: isAls
            ? ["Defibrillator", "Cardiac Monitor", "Trauma Kit", "Oxygen Supply"]
            : ["First Aid Kit", "Oxygen Supply", "IV Access Kit"],
          crew: isAls ? ["Paramedic Lead", "Driver"] : ["EMT", "Driver"],
          lastUpdatedAt: new Date(),
        };
      });

      await AmbulanceLiveModel.insertMany(seed);
    }

    await seedLocalFleetIfMissing();

    const allAmbulancesRaw = await AmbulanceLiveModel.find()
      .lean()
      .exec();

    const allAmbulances = allAmbulancesRaw
      .map((a) => ({
        ambulanceId: String(a.ambulanceId || ""),
        callSign: String(a.callSign || ""),
        status: String(a.status || "available"),
        location: {
          lat: toNumber((a.location as { lat?: number } | undefined)?.lat, NaN),
          lng: toNumber((a.location as { lng?: number } | undefined)?.lng, NaN),
        },
        speed: Math.max(10, toNumber(a.speed, 40)),
      }))
      .filter(
        (a) =>
          a.ambulanceId.length > 0 &&
          Number.isFinite(a.location.lat) &&
          Number.isFinite(a.location.lng)
      );

    const availableAmbulances = allAmbulances.filter((a) => a.status === "available");
    const dispatchCandidates = availableAmbulances.length > 0 ? availableAmbulances : allAmbulances;

    if (dispatchCandidates.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No ambulance records found" },
        { status: 409 }
      );
    }

    const { best: nearestAmbulance, bestDistanceKm } = pickNearest(origin, dispatchCandidates);

    if (!nearestAmbulance) {
      return NextResponse.json(
        { ok: false, error: "Unable to identify nearest ambulance" },
        { status: 500 }
      );
    }

    const hospitalsRaw = await HospitalRegistrationModel.find(
      {
        latitude: { $type: "number" },
        longitude: { $type: "number" },
      } as Record<string, unknown>
    )
      .select({ hospitalName: 1, latitude: 1, longitude: 1 })
      .lean()
      .exec();

    const hospitals = hospitalsRaw
      .map((h) => ({
        id: String(h._id),
        name: String(h.hospitalName || "Nearest Hospital"),
        location: {
          lat: toNumber(h.latitude, NaN),
          lng: toNumber(h.longitude, NaN),
        },
      }))
      .filter((h) => Number.isFinite(h.location.lat) && Number.isFinite(h.location.lng));

    const { best: nearestHospital } = pickNearest(origin, hospitals);

    const estimatedArrivalMinutes = Math.max(
      1,
      Math.round(estimateTravelTime(bestDistanceKm, nearestAmbulance.speed, 1.15))
    );

    const emergencyId = `sos-${Date.now()}`;
    const confirmedAt = new Date();

    await AmbulanceLiveModel.findOneAndUpdate(
      { ambulanceId: nearestAmbulance.ambulanceId },
      {
        $set: {
          status: "dispatched",
          speed: nearestAmbulance.speed,
          lastUpdatedAt: confirmedAt,
        },
      }
    );

    await DispatchRecordModel.findOneAndUpdate(
      { emergencyId },
      {
        $set: {
          emergencyId,
          callerName: "SOS User",
          callerPhone: "",
          description: "SOS emergency alert triggered from home page",
          address,
          location: origin,
          triage: {
            severity: "P1",
            specialization: "General",
            reasoning: "SOS one-tap alert",
            urgencyScore: 95,
            recommendedEquipment: ["Defibrillator", "Oxygen Supply", "Trauma Kit"],
          },
          recommendations: [],
          selectedDispatch: {
            selectedRank: 1,
            ambulanceId: nearestAmbulance.ambulanceId,
            ambulanceCallSign: nearestAmbulance.callSign,
            hospitalId: nearestHospital?.id || "",
            hospitalName: nearestHospital?.name || "Nearest Hospital",
            estimatedArrivalMinutes,
            distanceKm: Number(bestDistanceKm.toFixed(2)),
            confirmedAt,
          },
          status: "confirmed",
          analyzedAt: confirmedAt,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      ok: true,
      emergencyId,
      ambulance: {
        ambulanceId: nearestAmbulance.ambulanceId,
        callSign: nearestAmbulance.callSign,
      },
      usedFallback: availableAmbulances.length === 0,
      estimatedArrivalMinutes,
      distanceKm: Number(bestDistanceKm.toFixed(2)),
    });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Unknown error";
    const normalized = rawMessage.toLowerCase();

    let hint: string | undefined;
    if (
      normalized.includes("authentication failed") ||
      normalized.includes("bad auth") ||
      normalized.includes("auth")
    ) {
      hint =
        "Atlas authentication failed. Update MONGODB_URI in Vercel with the latest URL-encoded password, then redeploy.";
    } else if (
      normalized.includes("not authorized") ||
      normalized.includes("permission")
    ) {
      hint =
        "Atlas user permission issue. Grant readWrite access for the target database to your database user.";
    } else if (
      normalized.includes("ip") ||
      normalized.includes("network") ||
      normalized.includes("timed out") ||
      normalized.includes("econn")
    ) {
      hint =
        "Atlas network access issue. Add 0.0.0.0/0 (or allowlist required IPs) in Atlas Network Access.";
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to trigger SOS dispatch",
        details: rawMessage,
        hint,
      },
      { status: 500 }
    );
  }
}