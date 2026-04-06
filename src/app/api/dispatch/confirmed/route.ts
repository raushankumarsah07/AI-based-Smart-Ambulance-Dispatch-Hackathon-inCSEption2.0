import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DispatchRecordModel from "@/lib/models/DispatchRecord";

export const runtime = "nodejs";

type ConfirmedDispatchRecord = {
  _id: unknown;
  emergencyId: string;
  callerName?: string;
  callerPhone?: string;
  description?: string;
  address?: string;
  location?: { lat?: number; lng?: number };
  triage?: { severity?: string; specialization?: string };
  selectedDispatch?: {
    ambulanceId?: string;
    ambulanceCallSign?: string;
    hospitalId?: string;
    hospitalName?: string;
    estimatedArrivalMinutes?: number;
    distanceKm?: number;
    confirmedAt?: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
};

export async function GET() {
  try {
    await connectToDatabase();

    const records = await DispatchRecordModel.find({ status: "confirmed" })
      .sort({ "selectedDispatch.confirmedAt": -1, updatedAt: -1 })
      .limit(50)
      .lean<ConfirmedDispatchRecord[]>();

    const emergencies = records.map((record) => {
      const confirmedAt = record.selectedDispatch?.confirmedAt || record.updatedAt || record.createdAt;

      return {
        id: record.emergencyId,
        callerName: record.callerName || "Unknown Caller",
        callerPhone: record.callerPhone || "",
        description: record.description || "Confirmed emergency dispatch",
        location: {
          lat: Number(record.location?.lat) || 0,
          lng: Number(record.location?.lng) || 0,
        },
        address: record.address || "",
        severity: (record.triage?.severity || "P3") as "P1" | "P2" | "P3" | "P4",
        specialization: (record.triage?.specialization || "General") as
          | "Trauma"
          | "Cardiac"
          | "Burns"
          | "Pediatric"
          | "Neuro"
          | "General",
        status: "dispatched" as const,
        assignedAmbulanceId: record.selectedDispatch?.ambulanceId,
        assignedHospitalId: record.selectedDispatch?.hospitalId,
        createdAt: confirmedAt ? new Date(confirmedAt) : new Date(),
        dispatchedAt: confirmedAt ? new Date(confirmedAt) : undefined,
        estimatedArrivalMinutes: record.selectedDispatch?.estimatedArrivalMinutes,
      };
    });

    return NextResponse.json({ ok: true, emergencies });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch confirmed dispatches",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}