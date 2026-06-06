import mongoose from "mongoose";
import { CLARIFICATION_STATUS } from "../constants/clarification.constants.js";
import { COLLECTIONS, JOURNEY_IDS } from "./constants.js";
import { JourneyProgressSchema } from "./shared.schema.js";
import { areValidRuleIds, isValidJourneyId, isValidUserId } from "./validators.js";

export const clarificationSessionSchemaDefinition = {
  flowSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserFlowSession",
    required: [true, "flowSessionId is required"]
  },
  userId: {
    type: String,
    required: [true, "userId is required"],
    validate: {
      validator: isValidUserId,
      message: "Invalid userId"
    }
  },
  status: {
    type: String,
    enum: Object.values(CLARIFICATION_STATUS),
    default: CLARIFICATION_STATUS.EVALUATING
  },
  firedRules: {
    type: [String],
    default: [],
    validate: {
      validator: areValidRuleIds,
      message: "firedRules must contain valid U1–U17 rule IDs"
    }
  },
  assignedJourneys: {
    type: [String],
    default: [],
    validate: {
      validator(arr) {
        return Array.isArray(arr) && arr.every(isValidJourneyId);
      },
      message: "assignedJourneys must contain valid journey IDs"
    }
  },
  maxJourneys: { type: Number, default: 2, min: 0, max: 3 },
  currentJourneyIndex: { type: Number, default: 0, min: 0 },
  journeyProgress: {
    type: Map,
    of: JourneyProgressSchema,
    default: () => new Map()
  },
  assignedJourneyMeta: { type: [mongoose.Schema.Types.Mixed], default: [] },
  accommodationSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
  fusionResult: { type: mongoose.Schema.Types.Mixed, default: null },
  blockedConstructs: { type: [String], default: [] },
  evaluatedAt: { type: Date, default: null },
  finalizedAt: { type: Date, default: null },
  schemaVersion: { type: Number, default: 2 }
};

export const clarificationSessionSchemaOptions = {
  timestamps: true,
  collection: COLLECTIONS.CLARIFICATION_SESSIONS
};

export const clarificationSessionIndexes = [
  { key: { flowSessionId: 1 }, options: { unique: true, name: "uniq_flow_session" } },
  { key: { userId: 1, status: 1 }, options: { name: "idx_user_status" } },
  { key: { userId: 1, createdAt: -1 }, options: { name: "idx_user_created" } },
  { key: { firedRules: 1 }, options: { name: "idx_fired_rules" } }
];

export function createClarificationSessionSchema() {
  const schema = new mongoose.Schema(
    clarificationSessionSchemaDefinition,
    clarificationSessionSchemaOptions
  );
  for (const idx of clarificationSessionIndexes) {
    schema.index(idx.key, idx.options);
  }
  return schema;
}

export { JOURNEY_IDS };
