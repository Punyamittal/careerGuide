import mongoose from "mongoose";
import { env } from "./env.js";
import { log } from "../utils/logger.js";

let connected = false;

/**
 * @returns {Promise<typeof mongoose>}
 */
export async function connectMongo() {
  if (connected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!env.mongodb.uri) {
    log("warn", "mongodb_uri_missing", { message: "MONGODB_URI not set; clarification module disabled" });
    return mongoose;
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongodb.uri, {
    dbName: env.mongodb.dbName,
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10_000
  });

  connected = true;
  log("info", "mongodb_connected", { db: env.mongodb.dbName });
  return mongoose;
}

export async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    connected = false;
  }
}

export function isMongoReady() {
  return mongoose.connection.readyState === 1;
}
