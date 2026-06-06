import mongoose from "mongoose";
import { COLLECTIONS, MAX_ITEM_EXPOSURE } from "./constants.js";
import { isValidClarItemId, isValidExposureCount, isValidUserId } from "./validators.js";

export const clarificationItemExposureSchemaDefinition = {
  userId: {
    type: String,
    required: [true, "userId is required"],
    validate: { validator: isValidUserId, message: "Invalid userId" }
  },
  itemId: {
    type: String,
    required: [true, "itemId is required"],
    validate: { validator: isValidClarItemId, message: "Invalid itemId format" }
  },
  exposureCount: {
    type: Number,
    default: 0,
    validate: {
      validator: isValidExposureCount,
      message: `exposureCount must be 0–${MAX_ITEM_EXPOSURE + 10}`
    }
  },
  lastExposedAt: { type: Date, default: Date.now },
  stemHash: { type: String, maxlength: 64 },
  journeyId: { type: String },
  poolId: { type: String, maxlength: 32 }
};

export const clarificationItemExposureSchemaOptions = {
  timestamps: true,
  collection: COLLECTIONS.CLARIFICATION_ITEM_EXPOSURE
};

export const clarificationItemExposureIndexes = [
  { key: { userId: 1, itemId: 1 }, options: { unique: true, name: "uniq_user_item" } },
  {
    key: { userId: 1, exposureCount: 1 },
    options: { name: "idx_user_exposure_count" }
  },
  { key: { stemHash: 1 }, options: { name: "idx_stem_hash", sparse: true } },
  {
    key: { userId: 1, lastExposedAt: -1 },
    options: { name: "idx_user_last_exposed" }
  }
];

export function createClarificationItemExposureSchema() {
  const schema = new mongoose.Schema(
    clarificationItemExposureSchemaDefinition,
    clarificationItemExposureSchemaOptions
  );
  for (const idx of clarificationItemExposureIndexes) {
    schema.index(idx.key, idx.options);
  }
  return schema;
}
