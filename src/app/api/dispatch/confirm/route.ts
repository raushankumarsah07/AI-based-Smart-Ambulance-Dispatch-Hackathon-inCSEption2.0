import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DispatchRecordModel from "@/lib/models/DispatchRecord";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body?.emergencyId) {
      return NextResponse.json(
        { ok: false, error: "emergencyId is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const setPayload: Record<string, unknown> = {
      emergencyId: body.emergencyId,
      selectedDispatch: {
        selectedRank: Number(body.selectedRank) || 1,
        ambulanceId: body.ambulanceId || "",
        ambulanceCallSign: body.ambulanceCallSign || "",
        hospitalId: body.hospitalId || "",
        hospitalName: body.hospitalName || "",
        estimatedArrivalMinutes: Number(body.estimatedArrivalMinutes) || 0,
        distanceKm: Number(body.distanceKm) || 0,
        confirmedAt: new Date(),
      },
      status: "confirmed",
    };

    if (typeof body.callerName === "string") {
      setPayload.callerName = body.callerName;
    }
    if (typeof body.callerPhone === "string") {
      setPayload.callerPhone = body.callerPhone;
    }
    if (typeof body.description === "string") {
      setPayload.description = body.description;
    }
    if (typeof body.address === "string") {
      setPayload.address = body.address;
    }

    if (body.location && typeof body.location === "object") {
      setPayload.location = {
        lat: Number(body.location.lat) || 0,
        lng: Number(body.location.lng) || 0,
      };
    }

    if (body.triage && typeof body.triage === "object") {
      setPayload.triage = {
        severity: body.triage.severity || "",
        specialization: body.triage.specialization || "",
        reasoning: body.triage.reasoning || "",
        urgencyScore: Number(body.triage.urgencyScore) || 0,
        recommendedEquipment: Array.isArray(body.triage.recommendedEquipment)
          ? body.triage.recommendedEquipment
          : [],
      };
    }

    if (Array.isArray(body.recommendations)) {
      setPayload.recommendations = body.recommendations;
    }

    await DispatchRecordModel.findOneAndUpdate(
      { emergencyId: body.emergencyId },
      {
        $set: setPayload,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to save dispatch confirmation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
