import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import HospitalRegistrationModel from "@/lib/models/HospitalRegistration";
import type { Types } from "mongoose";

export const runtime = "nodejs";

type HospitalSearchResult = {
  _id: Types.ObjectId;
  hospitalName: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
};

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = String(searchParams.get("q") || "").trim();
    const city = String(searchParams.get("city") || "").trim();
    const lat = toNumber(searchParams.get("lat"), NaN);
    const lng = toNumber(searchParams.get("lng"), NaN);

    await connectToDatabase();

    // Search by hospital name
    if (query.length > 0) {
      const matchedHospitals: HospitalSearchResult[] = await HospitalRegistrationModel.find(
        {
          hospitalName: { $regex: query, $options: "i" },
          latitude: { $type: "number" },
          longitude: { $type: "number" },
        } as Record<string, unknown>
      )
        .select({
          hospitalName: 1,
          city: 1,
          state: 1,
          latitude: 1,
          longitude: 1,
        })
        .sort({ hospitalName: 1 })
        .limit(10)
        .lean();

      return NextResponse.json({
        ok: true,
        suggestions: matchedHospitals.map((hospital) => ({
          id: String(hospital._id),
          hospitalName: String(hospital.hospitalName || "Unknown Hospital"),
          city: String(hospital.city || "Unknown City"),
          state: String(hospital.state || "Unknown State"),
          latitude: Number(hospital.latitude),
          longitude: Number(hospital.longitude),
        })),
      });
    }

    // Search by city name as fallback
    if (city.length > 0) {
      const cityhospitals: HospitalSearchResult[] = await HospitalRegistrationModel.find(
        {
          city: { $regex: city, $options: "i" },
          latitude: { $type: "number" },
          longitude: { $type: "number" },
        } as Record<string, unknown>
      )
        .select({
          hospitalName: 1,
          city: 1,
          state: 1,
          latitude: 1,
          longitude: 1,
        })
        .sort({ hospitalName: 1 })
        .limit(10)
        .lean();

      return NextResponse.json({
        ok: true,
        suggestions: cityhospitals.map((hospital) => ({
          id: String(hospital._id),
          hospitalName: String(hospital.hospitalName || "Unknown Hospital"),
          city: String(hospital.city || "Unknown City"),
          state: String(hospital.state || "Unknown State"),
          latitude: Number(hospital.latitude),
          longitude: Number(hospital.longitude),
        })),
      });
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { ok: false, error: "lat and lng query parameters are required" },
        { status: 400 }
      );
    }

    const hospitals: HospitalSearchResult[] = await HospitalRegistrationModel.find(
      {
        latitude: { $type: "number" },
        longitude: { $type: "number" },
      } as Record<string, unknown>
    )
      .select({
        hospitalName: 1,
        city: 1,
        state: 1,
        latitude: 1,
        longitude: 1,
      })
      .lean();

    if (!hospitals.length) {
      return NextResponse.json({ ok: true, nearestHospital: null, nearbyHospitals: [] });
    }

    const rankedHospitals = hospitals
      .map((hospital) => ({
        id: String(hospital._id),
        hospitalName: String(hospital.hospitalName || "Unknown Hospital"),
        city: String(hospital.city || "Unknown City"),
        state: String(hospital.state || "Unknown State"),
        latitude: Number(hospital.latitude),
        longitude: Number(hospital.longitude),
        distanceKm: haversineKm(
          lat,
          lng,
          Number(hospital.latitude),
          Number(hospital.longitude)
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const nearest = rankedHospitals[0] || null;

    return NextResponse.json({
      ok: true,
      nearestHospital: nearest,
      nearbyHospitals: rankedHospitals.slice(0, 8),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch nearest hospital",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const requiredFields = [
      "hospitalName",
      "contactPerson",
      "contactEmail",
      "contactPhone",
      "address",
      "city",
      "state",
    ];

    for (const field of requiredFields) {
      if (!body?.[field] || String(body[field]).trim() === "") {
        return NextResponse.json(
          { ok: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    await connectToDatabase();

    const record = await HospitalRegistrationModel.create({
      hospitalName: String(body.hospitalName).trim(),
      contactPerson: String(body.contactPerson).trim(),
      contactEmail: String(body.contactEmail).trim().toLowerCase(),
      contactPhone: String(body.contactPhone).trim(),
      address: String(body.address).trim(),
      city: String(body.city).trim(),
      state: String(body.state).trim(),
      latitude: toNumber(body.latitude),
      longitude: toNumber(body.longitude),
      totalBeds: Math.max(0, Math.floor(toNumber(body.totalBeds))),
      emergencyBeds: Math.max(0, Math.floor(toNumber(body.emergencyBeds))),
      icuBeds: Math.max(0, Math.floor(toNumber(body.icuBeds))),
      totalAmbulances: Math.max(0, Math.floor(toNumber(body.totalAmbulances))),
      specializations: Array.isArray(body.specializations)
        ? body.specializations.map((s: unknown) => String(s).trim()).filter(Boolean)
        : [],
      registrationStatus: "pending",
    });

    return NextResponse.json({
      ok: true,
      registrationId: String(record._id),
      message: "Hospital registration saved successfully",
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
      normalized.includes("ip") ||
      normalized.includes("network") ||
      normalized.includes("timed out") ||
      normalized.includes("econn")
    ) {
      hint =
        "Atlas network access issue. Add 0.0.0.0/0 (or allowlist required IPs) in Atlas Network Access.";
    } else if (
      normalized.includes("validation") ||
      normalized.includes("required")
    ) {
      hint = "Please verify all required registration fields are filled correctly.";
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to save hospital registration",
        details: rawMessage,
        hint,
      },
      { status: 500 }
    );
  }
}
