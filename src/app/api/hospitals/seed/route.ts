import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import HospitalRegistrationModel from "@/lib/models/HospitalRegistration";

export const runtime = "nodejs";

const DEMO_HOSPITALS = [
  {
    hospitalName: "Apollo Hospital Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    address: "154, Opposite Matra Apartment, East End Main Road, New BEL Road",
    latitude: 13.0053,
    longitude: 77.6064,
    contactPerson: "Dr. Rajesh Kumar",
    contactEmail: "apollo.bangalore@hospital.com",
    contactPhone: "+91-9876543210",
    totalBeds: 500,
    emergencyBeds: 50,
    icuBeds: 80,
    totalAmbulances: 15,
    specializations: ["Trauma", "Cardiac", "Neuro", "General"],
  },
  {
    hospitalName: "Max Healthcare Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    address: "154, Bannerghatta Road, Bangalore",
    latitude: 12.9406,
    longitude: 77.6245,
    contactPerson: "Dr. Priya Singh",
    contactEmail: "max.bangalore@hospital.com",
    contactPhone: "+91-9876543211",
    totalBeds: 400,
    emergencyBeds: 40,
    icuBeds: 60,
    totalAmbulances: 12,
    specializations: ["Cardiac", "General", "Pediatric"],
  },
  {
    hospitalName: "Fortis Hospital Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    address: "Banana Garden, Sanjay Nagar, Bangalore",
    latitude: 13.0126,
    longitude: 77.6421,
    contactPerson: "Dr. Amit Patel",
    contactEmail: "fortis.bangalore@hospital.com",
    contactPhone: "+91-9876543212",
    totalBeds: 350,
    emergencyBeds: 35,
    icuBeds: 50,
    totalAmbulances: 10,
    specializations: ["Trauma", "Burn", "General"],
  },
  {
    hospitalName: "Max Hospital Delhi",
    city: "Delhi",
    state: "Delhi",
    address: "2, Press Enclave Rd, Saket",
    latitude: 28.5244,
    longitude: 77.1856,
    contactPerson: "Dr. Arjun Verma",
    contactEmail: "max.delhi@hospital.com",
    contactPhone: "+91-9876543213",
    totalBeds: 600,
    emergencyBeds: 60,
    icuBeds: 100,
    totalAmbulances: 20,
    specializations: ["Cardiac", "Neuro", "General", "Trauma"],
  },
  {
    hospitalName: "Apollo Hospital Delhi",
    city: "Delhi",
    state: "Delhi",
    address: "Subhash Chandra Bose Marg, Mathura Road",
    latitude: 28.5679,
    longitude: 77.2511,
    contactPerson: "Dr. Vikram Singh",
    contactEmail: "apollo.delhi@hospital.com",
    contactPhone: "+91-9876543214",
    totalBeds: 550,
    emergencyBeds: 55,
    icuBeds: 90,
    totalAmbulances: 18,
    specializations: ["Trauma", "Cardiac", "Pediatric"],
  },
  {
    hospitalName: "Fortis Hospital Delhi",
    city: "Delhi",
    state: "Delhi",
    address: "Sector 62, Noida, Uttar Pradesh",
    latitude: 28.5821,
    longitude: 77.3692,
    contactPerson: "Dr. Neha Sharma",
    contactEmail: "fortis.delhi@hospital.com",
    contactPhone: "+91-9876543215",
    totalBeds: 450,
    emergencyBeds: 45,
    icuBeds: 70,
    totalAmbulances: 14,
    specializations: ["General", "Burn", "Neuro"],
  },
  {
    hospitalName: "Lifespring Hospital Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    address: "S.V Road, Vile Parle, Mumbai",
    latitude: 19.0976,
    longitude: 72.8194,
    contactPerson: "Dr. Rohan Desai",
    contactEmail: "lifespring.mumbai@hospital.com",
    contactPhone: "+91-9876543216",
    totalBeds: 520,
    emergencyBeds: 52,
    icuBeds: 85,
    totalAmbulances: 16,
    specializations: ["Cardiac", "General", "Trauma"],
  },
  {
    hospitalName: "Sakra World Hospital Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    address: "Devarabisanahalli, Bangalore",
    latitude: 13.1146,
    longitude: 77.7499,
    contactPerson: "Dr. Anujith Ravi",
    contactEmail: "sakra.bangalore@hospital.com",
    contactPhone: "+91-9876543217",
    totalBeds: 300,
    emergencyBeds: 30,
    icuBeds: 45,
    totalAmbulances: 8,
    specializations: ["General", "Pediatric", "Neuro"],
  },
];

export async function POST() {
  try {
    await connectToDatabase();

    // Clear existing demo hospitals
    await HospitalRegistrationModel.deleteMany({});

    // Insert demo hospitals
    const result = await HospitalRegistrationModel.insertMany(
      DEMO_HOSPITALS.map((h) => ({
        ...h,
        registrationStatus: "approved",
      }))
    );

    return NextResponse.json({
      ok: true,
      message: `Successfully seeded ${result.length} demo hospitals`,
      hospitals: result.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to seed demo hospitals",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "POST to this endpoint to seed demo hospitals for Bangalore, Delhi, and Mumbai",
  });
}
