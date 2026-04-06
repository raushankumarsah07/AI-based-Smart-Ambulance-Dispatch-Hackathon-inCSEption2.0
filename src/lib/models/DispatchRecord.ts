import mongoose, { Schema, type InferSchemaType } from "mongoose";

const RecommendationSchema = new Schema(
  {
    rank: { type: Number, required: true },
    ambulanceId: { type: String, required: true },
    ambulanceCallSign: { type: String, required: true },
    hospitalId: { type: String, required: true },
    hospitalName: { type: String, required: true },
    totalScore: { type: Number, required: true },
    estimatedArrivalMinutes: { type: Number, required: true },
    distanceKm: { type: Number, required: true },
  },
  { _id: false }
);

const DispatchRecordSchema = new Schema(
  {
    emergencyId: { type: String, required: true, unique: true, index: true },
    callerName: { type: String, default: "" },
    callerPhone: { type: String, default: "" },
    description: { type: String, default: "" },
    address: { type: String, default: "" },
    location: {
      lat: { type: Number, required: true, default: 0 },
      lng: { type: Number, required: true, default: 0 },
    },
    triage: {
      severity: { type: String, default: "" },
      specialization: { type: String, default: "" },
      reasoning: { type: String, default: "" },
      urgencyScore: { type: Number, default: 0 },
      recommendedEquipment: { type: [String], default: [] },
    },
    recommendations: { type: [RecommendationSchema], default: [] },
    selectedDispatch: {
      selectedRank: { type: Number },
      ambulanceId: { type: String },
      ambulanceCallSign: { type: String },
      hospitalId: { type: String },
      hospitalName: { type: String },
      estimatedArrivalMinutes: { type: Number },
      distanceKm: { type: Number },
      confirmedAt: { type: Date },
    },
    status: {
      type: String,
      enum: ["analyzed", "confirmed"],
      default: "analyzed",
      index: true,
    },
    analyzedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "dispatch_records",
  }
);

export type DispatchRecord = InferSchemaType<typeof DispatchRecordSchema>;

export default (mongoose.models.DispatchRecord as mongoose.Model<DispatchRecord>) ||
  mongoose.model<DispatchRecord>("DispatchRecord", DispatchRecordSchema);
