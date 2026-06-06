import mongoose from "mongoose";
import { COLLECTIONS } from "./constants.js";
import {
  isValidJourneyId,
  isValidSimId,
  isValidUserId,
  unitIntervalValidator
} from "./validators.js";

export const clarificationSimResultSchemaDefinition = {
  clarificationSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ClarificationSession",
    required: [true, "clarificationSessionId is required"]
  },
  userId: {
    type: String,
    required: [true, "userId is required"],
    validate: { validator: isValidUserId, message: "Invalid userId" }
  },
  journeyId: {
    type: String,
    required: [true, "journeyId is required"],
    validate: { validator: isValidJourneyId, message: "Invalid journeyId" }
  },
  simId: {
    type: String,
    required: [true, "simId is required"],
    validate: { validator: isValidSimId, message: "Invalid simId format" }
  },
  telemetry: { type: mongoose.Schema.Types.Mixed, required: true },
  compositeScore: { type: Number, default: null, ...unitIntervalValidator() },
  dimensionScores: { type: mongoose.Schema.Types.Mixed, default: {} },
  success: { type: Boolean, default: null },
  durationMs: { type: Number, default: null, min: 0 },
  negotiationBand: {
    type: String,
    enum: ["developing", "capable", "strong", null],
    default: null
  }
};

export const clarificationSimResultSchemaOptions = {
  timestamps: true,
  collection: COLLECTIONS.CLARIFICATION_SIM_RESULTS
};

export const clarificationSimResultIndexes = [
  {
    key: { clarificationSessionId: 1, simId: 1 },
    options: { unique: true, name: "uniq_session_sim" }
  },
  { key: { userId: 1, simId: 1 }, options: { name: "idx_user_sim" } },
  { key: { journeyId: 1 }, options: { name: "idx_journey" } }
];

export function createClarificationSimResultSchema() {
  const schema = new mongoose.Schema(
    clarificationSimResultSchemaDefinition,
    clarificationSimResultSchemaOptions
  );
  for (const idx of clarificationSimResultIndexes) {
    schema.index(idx.key, idx.options);
  }
  return schema;
}
