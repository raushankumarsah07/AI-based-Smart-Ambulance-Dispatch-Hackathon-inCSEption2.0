import mongoose, { Schema, type InferSchemaType } from "mongoose";

const HOSPITAL_REGISTRATION_COLLECTION =
  process.env.MONGODB_HOSPITAL_REGISTRATION_COLLECTION || "hospital_registration_records";

const HospitalRegistrationSchema = new Schema(
  {
    hospitalName: { type: String, required: true, trim: true, index: true },
    contactPerson: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
    contactPhone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    state: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    totalBeds: { type: Number, required: true, min: 0 },
    emergencyBeds: { type: Number, required: true, min: 0 },
    icuBeds: { type: Number, required: true, min: 0 },
    totalAmbulances: { type: Number, required: true, min: 0, default: 0 },
    specializations: { type: [String], default: [] },
    registrationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "hospital_registrations",
  }
);

export type HospitalRegistration = InferSchemaType<typeof HospitalRegistrationSchema>;

const model =
  (mongoose.models.HospitalRegistration as mongoose.Model<HospitalRegistration>) ||
  mongoose.model<HospitalRegistration>(
    "HospitalRegistration",
    HospitalRegistrationSchema,
    HOSPITAL_REGISTRATION_COLLECTION
  );

export default model as mongoose.Model<HospitalRegistration>;
