import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @returns {Promise<import("mongoose").Connection>}
 */
export async function connectMigrationDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required for MongoDB migrations");
  }
  const dbName = process.env.MONGODB_DB_NAME || "careerguide";
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { dbName, maxPoolSize: 5 });
  return mongoose.connection;
}

export async function disconnectMigrationDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

/**
 * @param {import("mongodb").Db} db
 * @param {string} name
 */
export async function isMigrationApplied(db, name) {
  const col = db.collection("schema_migrations");
  const doc = await col.findOne({ name });
  return Boolean(doc);
}

/**
 * @param {import("mongodb").Db} db
 * @param {string} name
 */
export async function recordMigration(db, name) {
  await db.collection("schema_migrations").updateOne(
    { name },
    {
      $set: { name, appliedAt: new Date() },
      $setOnInsert: { version: 1 }
    },
    { upsert: true }
  );
}

export function migrationsDir() {
  return join(__dirname, "migrations");
}
