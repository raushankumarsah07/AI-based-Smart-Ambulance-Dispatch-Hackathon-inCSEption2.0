// ============================================
// SmartAmbSys - Simulation Data for Delhi, India
// ============================================

import type {
  Ambulance,
  AmbulanceStatus,
  AmbulanceType,
  Coordinates,
  DashboardStats,
  Emergency,
  EmergencyStatus,
  HeatmapPoint,
  Hospital,
  SeverityLevel,
  Specialization,
} from "@/lib/types";
import { randomCoordinate, generateId } from "@/lib/utils";

// ---- Delhi Center ----

export const DELHI_CENTER: Coordinates = {
  lat: 28.6139,
  lng: 77.209,
};

// ---- Hospitals (12) ----

export const hospitals: Hospital[] = [
  {
    id: generateId(),
    name: "AIIMS - All India Institute of Medical Sciences",
    location: { lat: 28.5672, lng: 77.21 },
    specializations: ["Trauma", "Cardiac", "Neuro", "Burns", "Pediatric", "General"],
    totalBeds: 2500,
    availableBeds: 187,
    icuBeds: 200,
    icuAvailable: 14,
    emergencyBeds: 80,
    emergencyAvailable: 11,
    rating: 4.8,
    contactNumber: "+91-11-26588500",
    isActive: true,
  },
  {
    id: generateId(),
    name: "Safdarjung Hospital",
    location: { lat: 28.5682, lng: 77.2068 },
    specializations: ["Trauma", "General", "Burns"],
    totalBeds: 1800,
    availableBeds: 142,
    icuBeds: 120,
    icuAvailable: 9,
    emergencyBeds: 60,
    emergencyAvailable: 7,
    rating: 4.2,
    contactNumber: "+91-11-26707437",
    isActive: true,
  },
  {
    id: generateId(),
    name: "Ram Manohar Lohia Hospital (RML)",
    location: { lat: 28.6265, lng: 77.2002 },
    specializations: ["General", "Cardiac", "Neuro"],
    totalBeds: 1300,
    availableBeds: 98,
    icuBeds: 80,
    icuAvailable: 6,
    emergencyBeds: 50,
    emergencyAvailable: 8,
    rating: 4.0,
    contactNumber: "+91-11-23404446",
    isActive: true,
  },
  {
    id: generateId(),
    name: "GTB Hospital - Guru Teg Bahadur",
    location: { lat: 28.6863, lng: 77.3105 },
    specializations: ["Trauma", "General", "Pediatric"],
    totalBeds: 1500,
    availableBeds: 203,
    icuBeds: 100,
    icuAvailable: 12,
    emergencyBeds: 55,
    emergencyAvailable: 9,
    rating: 3.9,
    contactNumber: "+91-11-22586262",
    isActive: true,
  },
  {
    id: generateId(),
    name: "Lok Nayak Jai Prakash Hospital (LNJP)",
    location: { lat: 28.6382, lng: 77.2387 },
    specializations: ["General", "Burns", "Cardiac"],
    totalBeds: 2000,
    availableBeds: 168,
    icuBeds: 150,
    icuAvailable: 11,
    emergencyBeds: 70,
    emergencyAvailable: 5,
    rating: 4.1,
    contactNumber: "+91-11-23232400",
    isActive: true,
  },
  {
    id: generateId(),
    name: "Sir Ganga Ram Hospital",
    location: { lat: 28.6385, lng: 77.1911 },
    specializations: ["Cardiac", "Neuro", "General"],
    totalBeds: 675,
    availableBeds: 42,
    icuBeds: 60,
    icuAvailable: 4,
    emergencyBeds: 30,
    emergencyAvailable: 3,
    rating: 4.6,
    contactNumber: "+91-11-25861662",
    isActive: true,
  },
  {
    id: generateId(),
    name: "Max Super Speciality Hospital, Saket",
    location: { lat: 28.5275, lng: 77.2137 },
    specializations: ["Cardiac", "Neuro", "Trauma"],
    totalBeds: 500,
    availableBeds: 38,
    icuBeds: 50,
    icuAvailable: 5,
    emergencyBeds: 25,
    emergencyAvailable: 4,
    rating: 4.7,
    contactNumber: "+91-11-26515050",
    isActive: true,
  },
  {
    id: generateId(),
    name: "Fortis Escorts Heart Institute",
    location: { lat: 28.5498, lng: 77.2224 },
    specializations: ["Cardiac", "General"],
    totalBeds: 310,
    availableBeds: 27,
    icuBeds: 45,
    icuAvailable: 3,
    emergencyBeds: 20,
    emergencyAvailable: 2,
    rating: 4.5,
    contactNumber: "+91-11-47135000",
    isActive: true,
  },
  {
    id: generateId(),
    name: "Deen Dayal Upadhyay Hospital (DDU)",
    location: { lat: 28.5893, lng: 77.1608 },
    specializations: ["General", "Trauma", "Pediatric"],
    totalBeds: 1100,
    availableBeds: 134,
    icuBeds: 70,
    icuAvailable: 8,
    emergencyBeds: 45,
    emergencyAvailable: 6,
    rating: 3.8,
    contactNumber: "+91-11-25100092",
    isActive: true,
  },
  {
    id: generateId(),
    name: "Maulana Azad Medical College & Hospital",
    location: { lat: 28.6337, lng: 77.2381 },
    specializations: ["General", "Burns", "Neuro"],
    totalBeds: 1800,
    availableBeds: 156,
    icuBeds: 110,
    icuAvailable: 7,
    emergencyBeds: 55,
    emergencyAvailable: 4,
    rating: 4.0,
    contactNumber: "+91-11-23234242",
    isActive: true,
  },
  {
    id: generateId(),
    name: "Indraprastha Apollo Hospital",
    location: { lat: 28.5412, lng: 77.2827 },
    specializations: ["Cardiac", "Neuro", "Trauma", "Burns", "Pediatric"],
    totalBeds: 710,
    availableBeds: 55,
    icuBeds: 70,
    icuAvailable: 6,
    emergencyBeds: 35,
    emergencyAvailable: 5,
    rating: 4.7,
    contactNumber: "+91-11-26925858",
    isActive: true,
  },
  {
    id: generateId(),
    name: "Batra Hospital & Medical Research Centre",
    location: { lat: 28.5349, lng: 77.2475 },
    specializations: ["General", "Cardiac", "Pediatric"],
    totalBeds: 400,
    availableBeds: 34,
    icuBeds: 40,
    icuAvailable: 3,
    emergencyBeds: 20,
    emergencyAvailable: 2,
    rating: 4.3,
    contactNumber: "+91-11-29958747",
    isActive: true,
  },
];

// ---- Ambulances (15) ----

const alsEquipment: string[] = [
  "Cardiac Monitor",
  "Defibrillator",
  "Ventilator",
  "IV Pump",
  "Intubation Kit",
  "Suction Unit",
  "Oxygen Supply",
  "Spinal Board",
  "Trauma Kit",
  "Drug Kit (Advanced)",
];

const blsEquipment: string[] = [
  "First Aid Kit",
  "Oxygen Supply",
  "Spinal Board",
  "Splints",
  "Bandages & Dressings",
  "Suction Unit",
  "AED",
  "Stretcher",
];

const crewRoster: [string, string][] = [
  ["Dr. Rajesh Sharma", "Paramedic Vikram Singh"],
  ["Dr. Anita Verma", "Paramedic Sunil Yadav"],
  ["Dr. Priya Mehta", "Paramedic Ravi Kumar"],
  ["Dr. Sanjay Gupta", "Paramedic Deepak Chauhan"],
  ["Dr. Neha Kapoor", "Paramedic Arun Joshi"],
  ["Dr. Amit Tiwari", "Paramedic Manoj Pandey"],
  ["Paramedic Rohit Malhotra", "EMT Ajay Thakur"],
  ["Paramedic Kavita Nair", "EMT Pooja Singh"],
  ["Paramedic Arvind Dubey", "EMT Santosh Mishra"],
  ["Paramedic Sunita Rao", "EMT Rakesh Jha"],
  ["Paramedic Mohan Das", "EMT Ashok Srivastava"],
  ["Paramedic Geeta Patel", "EMT Dinesh Tomar"],
  ["Paramedic Renu Sharma", "EMT Vijay Chauhan"],
  ["Paramedic Kiran Bhat", "EMT Naveen Reddy"],
  ["Paramedic Suresh Iyer", "EMT Praveen Kumar"],
];

// Statuses: 10 available, 2 dispatched, 2 en_route, 1 at_scene
const ambulanceStatuses: AmbulanceStatus[] = [
  "available",
  "available",
  "available",
  "available",
  "available",
  "available",
  "available",
  "available",
  "available",
  "available",
  "dispatched",
  "dispatched",
  "en_route",
  "en_route",
  "at_scene",
];

export const ambulances: Ambulance[] = Array.from({ length: 15 }, (_, i) => {
  const isALS = i < 6; // first 6 are ALS, remaining 9 are BLS
  const status = ambulanceStatuses[i];
  const fuelLevel = Math.floor(Math.random() * 61) + 40; // 40-100
  const speed =
    status === "available" || status === "at_scene"
      ? 0
      : Math.floor(Math.random() * 40) + 30; // 30-70 km/h when moving

  return {
    id: generateId(),
    callSign: `AMB-${String(i + 1).padStart(2, "0")}`,
    type: (isALS ? "ALS" : "BLS") as AmbulanceType,
    status,
    location: randomCoordinate(DELHI_CENTER, 15),
    speed,
    fuelLevel,
    equipment: isALS ? [...alsEquipment] : [...blsEquipment],
    crew: [...crewRoster[i]],
    currentEmergencyId: status !== "available" ? generateId() : undefined,
  };
});

// ---- Emergency History (20) ----

const emergencyTemplates: {
  description: string;
  severity: SeverityLevel;
  specialization: Specialization;
}[] = [
  { description: "Chest pain and difficulty breathing", severity: "P1", specialization: "Cardiac" },
  { description: "Road traffic accident on NH-44 near Kashmere Gate", severity: "P1", specialization: "Trauma" },
  { description: "Severe burn injuries from kitchen LPG leak", severity: "P1", specialization: "Burns" },
  { description: "Elderly patient collapsed, suspected stroke", severity: "P1", specialization: "Neuro" },
  { description: "Multi-vehicle collision on Ring Road near AIIMS flyover", severity: "P1", specialization: "Trauma" },
  { description: "Child with high fever and seizures", severity: "P2", specialization: "Pediatric" },
  { description: "Acute abdominal pain, suspected appendicitis", severity: "P2", specialization: "General" },
  { description: "Fall from construction site, spinal injury suspected", severity: "P1", specialization: "Trauma" },
  { description: "Diabetic patient found unconscious at home", severity: "P2", specialization: "General" },
  { description: "Cardiac arrest during morning walk in Lodhi Garden", severity: "P1", specialization: "Cardiac" },
  { description: "Road accident near Pragati Maidan — two-wheeler hit by bus", severity: "P2", specialization: "Trauma" },
  { description: "Asthma attack, severe respiratory distress", severity: "P2", specialization: "General" },
  { description: "Minor head injury from slip at Rajiv Chowk Metro station", severity: "P3", specialization: "General" },
  { description: "Electric shock at industrial unit in Okhla Phase-II", severity: "P2", specialization: "Burns" },
  { description: "Pregnant woman with complications, needs urgent transfer", severity: "P1", specialization: "General" },
  { description: "Food poisoning at community event in Dwarka Sector 12", severity: "P3", specialization: "General" },
  { description: "Chest tightness and dizziness after exertion", severity: "P3", specialization: "Cardiac" },
  { description: "Child fell from balcony, fracture suspected", severity: "P2", specialization: "Pediatric" },
  { description: "Knife wound during altercation in Chandni Chowk", severity: "P2", specialization: "Trauma" },
  { description: "Mild allergic reaction, facial swelling and rash", severity: "P4", specialization: "General" },
];

const delhiAddresses: string[] = [
  "B-14, Sector 3, Dwarka, New Delhi",
  "32, Rajpur Road, Civil Lines, Delhi",
  "A-27, Lajpat Nagar II, New Delhi",
  "H.No. 55, Chandni Chowk, Old Delhi",
  "Plot 8, Institutional Area, Lodhi Road, New Delhi",
  "D-45, Nehru Place, New Delhi",
  "12/4, Karol Bagh, Central Delhi",
  "F-Block, Connaught Place, New Delhi",
  "G-19, Saket, South Delhi",
  "Flat 203, Vasant Kunj, New Delhi",
  "15, Mayur Vihar Phase-I, East Delhi",
  "42, Pitampura Main Road, North Delhi",
  "E-22, Greater Kailash I, New Delhi",
  "Okhla Industrial Estate, Phase-II, New Delhi",
  "Sector 14, Rohini, North West Delhi",
  "A-3, Janakpuri C-Block, West Delhi",
  "Near Pragati Maidan Gate 5, New Delhi",
  "B-102, Safdarjung Enclave, New Delhi",
  "Opposite Red Fort, Netaji Subhash Marg, Old Delhi",
  "Shastri Nagar, Near Metro Station, North Delhi",
];

const callerNames: string[] = [
  "Ramesh Verma",
  "Sunita Devi",
  "Mohammad Irfan",
  "Priya Kumari",
  "Anil Sharma",
  "Fatima Begum",
  "Vikash Yadav",
  "Meena Gupta",
  "Harish Chandra",
  "Kavita Jain",
  "Suresh Babu",
  "Nisha Singh",
  "Pankaj Mishra",
  "Deepa Nair",
  "Rajiv Saxena",
  "Shalini Kapoor",
  "Omprakash Tiwari",
  "Anjali Mehta",
  "Bhupinder Singh",
  "Rekha Pandey",
];

// 16 completed, 3 in_progress, 1 dispatched
const emergencyStatuses: EmergencyStatus[] = [
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "in_progress",
  "in_progress",
  "in_progress",
  "dispatched",
];

const now = Date.now();

export const emergencyHistory: Emergency[] = Array.from({ length: 20 }, (_, i) => {
  // Spread timestamps across the last 24 hours (1440 minutes)
  const minutesAgo = Math.floor(Math.random() * 1440);
  const createdAt = new Date(now - minutesAgo * 60 * 1000);
  const status = emergencyStatuses[i];
  const { description, severity, specialization } = emergencyTemplates[i];

  const dispatchedAt =
    status !== "pending"
      ? new Date(createdAt.getTime() + Math.floor(Math.random() * 4 + 1) * 60 * 1000)
      : undefined;

  const arrivedAt =
    status === "completed" || status === "in_progress"
      ? new Date(
          (dispatchedAt?.getTime() ?? createdAt.getTime()) +
            Math.floor(Math.random() * 12 + 5) * 60 * 1000
        )
      : undefined;

  const completedAt =
    status === "completed"
      ? new Date(
          (arrivedAt?.getTime() ?? createdAt.getTime()) +
            Math.floor(Math.random() * 30 + 15) * 60 * 1000
        )
      : undefined;

  const phone = `+91-98${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`;

  return {
    id: generateId(),
    callerName: callerNames[i],
    callerPhone: phone,
    description,
    location: randomCoordinate(DELHI_CENTER, 15),
    address: delhiAddresses[i],
    severity,
    specialization,
    status,
    assignedAmbulanceId:
      status !== "pending" ? ambulances[i % ambulances.length].id : undefined,
    assignedHospitalId:
      status !== "pending" ? hospitals[i % hospitals.length].id : undefined,
    createdAt,
    dispatchedAt,
    arrivedAt,
    completedAt,
    estimatedArrivalMinutes:
      status === "dispatched" || status === "in_progress"
        ? Math.floor(Math.random() * 15) + 3
        : undefined,
  };
});

// ---- Heatmap Data (50 points) ----

// Hotspot centers across Delhi — busier areas get higher base intensity
const hotspotCenters: { coords: Coordinates; weight: number }[] = [
  { coords: { lat: 28.6315, lng: 77.2167 }, weight: 0.95 }, // Connaught Place
  { coords: { lat: 28.6507, lng: 77.2334 }, weight: 0.92 }, // Chandni Chowk
  { coords: { lat: 28.6442, lng: 77.1883 }, weight: 0.88 }, // Karol Bagh
  { coords: { lat: 28.5672, lng: 77.21 }, weight: 0.85 },   // AIIMS / IIT Flyover
  { coords: { lat: 28.6893, lng: 77.2296 }, weight: 0.82 }, // Kashmere Gate ISBT
  { coords: { lat: 28.5431, lng: 77.2718 }, weight: 0.78 }, // Nehru Place
  { coords: { lat: 28.6288, lng: 77.265 }, weight: 0.76 },  // ITO / Ring Road junction
  { coords: { lat: 28.5922, lng: 77.047 }, weight: 0.7 },   // Dwarka Sector 21
  { coords: { lat: 28.7189, lng: 77.1025 }, weight: 0.72 }, // Rohini Sector 3
  { coords: { lat: 28.628, lng: 77.371 }, weight: 0.68 },   // Anand Vihar ISBT
];

export const heatmapData: HeatmapPoint[] = Array.from({ length: 50 }, (_, i) => {
  const hotspot = hotspotCenters[i % hotspotCenters.length];

  // Jitter coordinates so points cluster around the center (1.5 km spread)
  const jittered = randomCoordinate(hotspot.coords, 1.5);

  // Intensity: base weight +/- noise, clamped to [0.1, 1.0]
  const noise = (Math.random() - 0.5) * 0.2;
  const intensity = Math.min(1, Math.max(0.1, hotspot.weight + noise));

  // Higher-intensity points more likely during rush hours
  const rushHours = [8, 9, 10, 17, 18, 19, 20, 21, 22, 23];
  const normalHours = [0, 1, 2, 3, 4, 5, 6, 7, 11, 12, 13, 14, 15, 16];
  const hour =
    intensity > 0.75
      ? rushHours[Math.floor(Math.random() * rushHours.length)]
      : normalHours[Math.floor(Math.random() * normalHours.length)];

  return {
    lat: jittered.lat,
    lng: jittered.lng,
    intensity: parseFloat(intensity.toFixed(2)),
    hour,
  };
});

// ---- Dashboard Stats ----

export function getDashboardStats(): DashboardStats {
  const totalEmergencies = emergencyHistory.length;
  const activeEmergencies = emergencyHistory.filter(
    (e) => e.status === "dispatched" || e.status === "in_progress"
  ).length;

  // Average response time: created -> arrived for completed emergencies
  const completedWithArrival = emergencyHistory.filter(
    (e) => e.status === "completed" && e.arrivedAt && e.createdAt
  );
  const avgResponseTime =
    completedWithArrival.length > 0
      ? completedWithArrival.reduce((sum, e) => {
          const diffMinutes =
            (e.arrivedAt!.getTime() - e.createdAt.getTime()) / 60000;
          return sum + diffMinutes;
        }, 0) / completedWithArrival.length
      : 0;

  const ambulancesAvailable = ambulances.filter(
    (a) => a.status === "available"
  ).length;
  const ambulancesTotal = ambulances.length;
  const hospitalsActive = hospitals.filter((h) => h.isActive).length;

  // Rough simulation metrics
  const co2Saved = parseFloat((completedWithArrival.length * 2.4).toFixed(1)); // ~2.4 kg CO2 saved per optimized dispatch
  const livesImpacted = completedWithArrival.length;

  return {
    totalEmergencies,
    activeEmergencies,
    avgResponseTime: parseFloat(avgResponseTime.toFixed(1)),
    ambulancesAvailable,
    ambulancesTotal,
    hospitalsActive,
    co2Saved,
    livesImpacted,
  };
}

// ---- Traffic Multiplier ----

/**
 * Returns a traffic multiplier (1.0 - 2.5) based on Delhi rush hour patterns.
 *
 * Peak:     8-10 AM (2.2x), 5-8 PM (2.5x)
 * Shoulder: 7 AM, 11 AM, 4 PM, 9 PM (1.7x)
 * Midday:   12-3 PM (1.4x)
 * Night:    12-5 AM (1.0x)
 * Default:  1.2x
 */
export function getTrafficMultiplier(hour: number): number {
  const h = ((hour % 24) + 24) % 24;

  if (h >= 8 && h <= 10) return 2.2;   // Morning rush
  if (h >= 17 && h <= 20) return 2.5;  // Evening rush
  if (h === 7 || h === 11 || h === 16 || h === 21) return 1.7; // Shoulder
  if (h >= 12 && h <= 15) return 1.4;  // Midday moderate
  if (h >= 0 && h <= 5) return 1.0;    // Late night calm

  return 1.2; // Early morning / late evening default
}
