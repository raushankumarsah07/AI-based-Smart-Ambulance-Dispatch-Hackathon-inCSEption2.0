// ============================================
// SmartAmbSys - Core Type Definitions
// ============================================

export type SeverityLevel = "P1" | "P2" | "P3" | "P4";
export type Specialization = "Trauma" | "Cardiac" | "Burns" | "Pediatric" | "Neuro" | "General";
export type AmbulanceType = "ALS" | "BLS"; // Advanced Life Support / Basic Life Support
export type AmbulanceStatus = "available" | "dispatched" | "en_route" | "at_scene" | "transporting" | "at_hospital";
export type EmergencyStatus = "pending" | "dispatched" | "in_progress" | "completed";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Ambulance {
  id: string;
  callSign: string;
  type: AmbulanceType;
  status: AmbulanceStatus;
  location: Coordinates;
  speed: number; // km/h
  fuelLevel: number; // 0-100
  equipment: string[];
  crew: string[];
  currentEmergencyId?: string;
}

export interface Hospital {
  id: string;
  name: string;
  location: Coordinates;
  specializations: Specialization[];
  totalBeds: number;
  availableBeds: number;
  icuBeds: number;
  icuAvailable: number;
  emergencyBeds: number;
  emergencyAvailable: number;
  rating: number; // 1-5
  contactNumber: string;
  isActive: boolean;
}

export interface Emergency {
  id: string;
  callerName: string;
  callerPhone: string;
  description: string;
  location: Coordinates;
  address: string;
  severity: SeverityLevel;
  specialization: Specialization;
  status: EmergencyStatus;
  assignedAmbulanceId?: string;
  assignedHospitalId?: string;
  createdAt: Date;
  dispatchedAt?: Date;
  arrivedAt?: Date;
  completedAt?: Date;
  estimatedArrivalMinutes?: number;
}

export interface TriageResult {
  severity: SeverityLevel;
  specialization: Specialization;
  reasoning: string;
  urgencyScore: number; // 0-100
  recommendedEquipment: string[];
}

export interface DispatchScore {
  ambulanceId: string;
  hospitalId: string;
  totalScore: number;
  breakdown: {
    distanceScore: number;     // 30%
    trafficScore: number;      // 25%
    equipmentScore: number;    // 20%
    hospitalMatchScore: number; // 15%
    fuelScore: number;         // 10%
  };
  estimatedArrivalMinutes: number;
  distanceKm: number;
  route?: Coordinates[];
}

export interface DashboardStats {
  totalEmergencies: number;
  activeEmergencies: number;
  avgResponseTime: number;
  ambulancesAvailable: number;
  ambulancesTotal: number;
  hospitalsActive: number;
  co2Saved: number; // kg
  livesImpacted: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  hour: number;
}

export interface RouteSegment {
  start: Coordinates;
  end: Coordinates;
  distance: number;
  duration: number;
  trafficLevel: "low" | "moderate" | "heavy" | "gridlock";
}
