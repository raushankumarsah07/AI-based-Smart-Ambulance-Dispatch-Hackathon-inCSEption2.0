import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { randomCoordinate } from "@/lib/utils";
import AmbulanceLiveModel from "@/lib/models/AmbulanceLive";
import type { AmbulanceStatus, AmbulanceType } from "@/lib/types";

export const runtime = "nodejs";

function toNumber(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const center = {
      lat: toNumber(body?.lat?.toString?.() ?? null, 12.9716),
      lng: toNumber(body?.lng?.toString?.() ?? null, 77.5946),
    };
    const count = Math.max(1, Math.min(50, toNumber(body?.count?.toString?.() ?? null, 12)));

    const statuses: AmbulanceStatus[] = [
      "available",
      "available",
      "available",
      "available",
      "available",
      "available",
      "dispatched",
      "dispatched",
      "en_route",
      "at_scene",
      "available",
      "available",
    ] as const;

    const records = Array.from({ length: count }, (_, idx) => {
      const isAls = idx < Math.ceil(count * 0.4);
      const status: AmbulanceStatus = statuses[idx % statuses.length];
      const type: AmbulanceType = isAls ? "ALS" : "BLS";

      return {
        ambulanceId: `seed-${idx + 1}`,
        callSign: `LOC-${String(idx + 1).padStart(2, "0")}`,
        type,
        status,
        location: randomCoordinate(center, 12),
        speed: status === "available" || status === "at_scene" ? 0 : 35 + Math.floor(Math.random() * 30),
        fuelLevel: 45 + Math.floor(Math.random() * 55),
        equipment: isAls
          ? ["Defibrillator", "Cardiac Monitor", "Trauma Kit", "IV Access Kit", "Oxygen Supply"]
          : ["First Aid Kit", "Oxygen Supply", "IV Access Kit", "Blood Pressure Monitor"],
        crew: isAls ? ["Paramedic Lead", `Driver ${idx + 1}`] : ["EMT", `Driver ${idx + 1}`],
        lastUpdatedAt: new Date(),
      };
    });

    await Promise.all(
      records.map((record) =>
        AmbulanceLiveModel.findOneAndUpdate(
          { ambulanceId: record.ambulanceId },
          { $set: record },
          { upsert: true }
        )
      )
    );

    return NextResponse.json({ ok: true, seeded: records.length, center });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to seed live ambulances",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
