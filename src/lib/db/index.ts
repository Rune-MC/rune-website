import mongoose from "mongoose";

interface MongooseCache {
  promise: Promise<typeof mongoose> | null;
  conn: typeof mongoose | null;
}

const globalForMongoose = globalThis as unknown as {
  __runeMongoose?: MongooseCache;
};

const cached: MongooseCache = globalForMongoose.__runeMongoose ?? {
  promise: null,
  conn: null,
};
globalForMongoose.__runeMongoose = cached;

export function isDbConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function connectDb(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI not configured");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
