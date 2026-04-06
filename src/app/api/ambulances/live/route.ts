import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { haversineDistance } from "@/lib/utils";
import AmbulanceLiveModel from "@/lib/models/AmbulanceLive";
import type { AmbulanceStatus, AmbulanceType, Coordinates } from "@/lib/types";

export const runtime = "nodejs";

function toNumber(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

interface IncomingAmbulance {
  ambulanceId: string;
  callSign: string;
  type?: AmbulanceType;
  status?: AmbulanceStatus;
  location: Coordinates;
  speed?: number;
  fuelLevel?: number;
  equipment?: string[];
  crew?: string[];
}

interface LiveAmbulanceResponse {
  id: string;
  ambulanceId: string;
  callSign: string;
  type: AmbulanceType;
  status: AmbulanceStatus;
  location: Coordinates;
  speed: number;
  fuelLevel: number;
  equipment: string[];
  crew: string[];
  lastUpdatedAt: Date;
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const url = new URL(request.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const radiusKm = toNumber(url.searchParams.get("radiusKm"), 25);

    const docs = await AmbulanceLiveModel.find()
      .sort({ lastUpdatedAt: -1 })
      .lean();

    let ambulances: LiveAmbulanceResponse[] = docs.flatMap((d) => {
      const location = d.location as Coordinates | null | undefined;
      if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
        return [];
      }

      return [
        {
          id: d.ambulanceId,
          ambulanceId: d.ambulanceId,
          callSign: d.callSign as string,
          type: d.type as AmbulanceType,
          status: d.status as AmbulanceStatus,
          location: { lat: location.lat, lng: location.lng },
          speed: Number(d.speed) || 0,
          fuelLevel: Number(d.fuelLevel) || 0,
          equipment: Array.isArray(d.equipment) ? (d.equipment as string[]) : [],
          crew: Array.isArray(d.crew) ? (d.crew as string[]) : [],
          lastUpdatedAt: (d.lastUpdatedAt as Date) || new Date(),
        },
      ];
    });

    if (lat !== null && lng !== null) {
      const center = { lat: Number(lat), lng: Number(lng) };
      ambulances = ambulances.filter(
        (a) => haversineDistance(center, a.location) <= radiusKm
      );
    }

    return NextResponse.json({ ok: true, ambulances });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch live ambulances",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const updates: IncomingAmbulance[] = Array.isArray(body?.ambulances)
      ? body.ambulances
      : body
      ? [body]
      : [];

    if (updates.length === 0) {
      return NextResponse.json(
        { ok: false, error: "ambulances payload is required" },
        { status: 400 }
      );
    }

    const normalizedUpdates = updates
      .filter((item: IncomingAmbulance) => item?.ambulanceId && item?.callSign && item?.location)
      .map((item: IncomingAmbulance) => ({
        ambulanceId: item.ambulanceId,
        callSign: item.callSign,
        type: item.type || "BLS",
        status: item.status || "available",
        location: {
          lat: Number(item.location?.lat) || 0,
          lng: Number(item.location?.lng) || 0,
        },
        speed: Number(item.speed) || 0,
        fuelLevel: Number(item.fuelLevel) || 0,
        equipment: Array.isArray(item.equipment) ? item.equipment : [],
        crew: Array.isArray(item.crew) ? item.crew : [],
      }));

    if (normalizedUpdates.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No valid ambulance records in payload" },
        { status: 400 }
      );
    }

    await Promise.all(
      normalizedUpdates.map((item) =>
        AmbulanceLiveModel.findOneAndUpdate(
          { ambulanceId: item.ambulanceId },
          {
            $set: {
              ...item,
              lastUpdatedAt: new Date(),
            },
          },
          { upsert: true }
        )
      )
    );

    return NextResponse.json({ ok: true, updated: normalizedUpdates.length });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to upsert live ambulances",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
