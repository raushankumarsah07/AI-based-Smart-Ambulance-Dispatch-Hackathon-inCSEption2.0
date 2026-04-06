import mongoose from "mongoose";

const DEFAULT_MONGODB_URI =
  "mongodb://localhost:27017/AI_Smart_Ambulance_Dispatch";

const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
const MONGODB_DB_NAME =
  process.env.MONGODB_DB_NAME || "AI_Smart_Ambulance_Dispatch";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var __mongooseCache__: MongooseCache | undefined;
}

const globalCache = globalThis as typeof globalThis & {
  __mongooseCache__?: MongooseCache;
};

const cached = globalCache.__mongooseCache__ || {
  conn: null,
  promise: null,
};

if (!globalCache.__mongooseCache__) {
  globalCache.__mongooseCache__ = cached;
}

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
      autoIndex: true,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
