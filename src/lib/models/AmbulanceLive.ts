import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { AmbulanceStatus, AmbulanceType } from "@/lib/types";

const AmbulanceLiveSchema = new Schema(
  {
    ambulanceId: { type: String, required: true, unique: true, index: true },
    callSign: { type: String, required: true },
    type: {
      type: String,
      enum: ["ALS", "BLS"] as AmbulanceType[],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "available",
        "dispatched",
        "en_route",
        "at_scene",
        "transporting",
        "at_hospital",
      ] as AmbulanceStatus[],
      required: true,
      index: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    speed: { type: Number, default: 0 },
    fuelLevel: { type: Number, default: 100 },
    equipment: { type: [String], default: [] },
    crew: { type: [String], default: [] },
    lastUpdatedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
    collection: "ambulances_live",
  }
);

export type AmbulanceLive = InferSchemaType<typeof AmbulanceLiveSchema>;

export default (mongoose.models.AmbulanceLive as mongoose.Model<AmbulanceLive>) ||
  mongoose.model<AmbulanceLive>("AmbulanceLive", AmbulanceLiveSchema);
