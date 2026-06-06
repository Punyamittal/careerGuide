import mongoose from "mongoose";
import { COLLECTIONS } from "./constants.js";
import { ResponseValueSchema } from "./shared.schema.js";
import {
  isValidClarItemId,
  isValidJourneyId,
  isValidUserId,
  unitIntervalValidator
} from "./validators.js";

export const clarificationResponseSchemaDefinition = {
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
  itemId: {
    type: String,
    required: [true, "itemId is required"],
    validate: { validator: isValidClarItemId, message: "Invalid itemId format" }
  },
  itemVersion: { type: Number, default: 2, min: 1, max: 99 },
  questionType: {
    type: String,
    enum: ["sjt", "forced-choice", "ranking", "micro-CAT", "likert", "unknown"],
    default: "unknown"
  },
  responseValue: { type: ResponseValueSchema, required: true },
  responseCorrect: { type: Boolean, default: null },
  partialScore: { type: Number, default: null, ...unitIntervalValidator() },
  responseTimeMs: { type: Number, default: null, min: 0 },
  answerChangeCount: { type: Number, default: 0, min: 0 },
  scoringRubric: { type: String, maxlength: 512 },
  clientSeq: { type: Number, default: null, min: 0 }
};

export const clarificationResponseSchemaOptions = {
  timestamps: true,
  collection: COLLECTIONS.CLARIFICATION_RESPONSES
};

export const clarificationResponseIndexes = [
  {
    key: { clarificationSessionId: 1, journeyId: 1, itemId: 1 },
    options: { unique: true, name: "uniq_session_journey_item" }
  },
  { key: { userId: 1, itemId: 1 }, options: { name: "idx_user_item" } },
  { key: { clarificationSessionId: 1, createdAt: 1 }, options: { name: "idx_session_timeline" } }
];

export function createClarificationResponseSchema() {
  const schema = new mongoose.Schema(
    clarificationResponseSchemaDefinition,
    clarificationResponseSchemaOptions
  );
  for (const idx of clarificationResponseIndexes) {
    schema.index(idx.key, idx.options);
  }
  return schema;
}
