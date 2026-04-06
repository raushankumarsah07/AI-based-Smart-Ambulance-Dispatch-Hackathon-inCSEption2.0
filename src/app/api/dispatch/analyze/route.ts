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

    await DispatchRecordModel.findOneAndUpdate(
      { emergencyId: body.emergencyId },
      {
        $set: {
          emergencyId: body.emergencyId,
          callerName: body.callerName || "",
          callerPhone: body.callerPhone || "",
          description: body.description || "",
          address: body.address || "",
          location: {
            lat: Number(body.location?.lat) || 0,
            lng: Number(body.location?.lng) || 0,
          },
          triage: {
            severity: body.triage?.severity || "",
            specialization: body.triage?.specialization || "",
            reasoning: body.triage?.reasoning || "",
            urgencyScore: Number(body.triage?.urgencyScore) || 0,
            recommendedEquipment: Array.isArray(body.triage?.recommendedEquipment)
              ? body.triage.recommendedEquipment
              : [],
          },
          recommendations: Array.isArray(body.recommendations)
            ? body.recommendations
            : [],
          analyzedAt: new Date(),
          status: "analyzed",
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to save analyze record",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
