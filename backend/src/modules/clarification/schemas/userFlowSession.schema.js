import mongoose from "mongoose";
import { FLOW_STATUS, FLOW_PHASES, FLOW_ID_USER_6 } from "../constants/clarification.constants.js";
import { COLLECTIONS } from "./constants.js";
import {
  AccommodationSchema,
  BlockSessionSchema,
  ConstructEntrySchema,
  FlowTelemetrySchema,
  IntakeMetaSchema,
  ValidityFlagsSchema
} from "./shared.schema.js";
import { isValidUserId } from "./validators.js";

export const userFlowSessionSchemaDefinition = {
  userId: {
    type: String,
    required: [true, "userId is required"],
    index: true,
    validate: {
      validator: isValidUserId,
      message: "Invalid userId"
    }
  },
  flowId: {
    type: String,
    required: true,
    default: FLOW_ID_USER_6,
    enum: [FLOW_ID_USER_6, "user-6-pilot"]
  },
  status: {
    type: String,
    enum: Object.values(FLOW_STATUS),
    default: FLOW_STATUS.IN_PROGRESS
  },
  currentPhase: {
    type: String,
    enum: FLOW_PHASES,
    default: "0"
  },
  phaseProgress: { type: mongoose.Schema.Types.Mixed, default: {} },
  constructSnapshot: {
    type: Map,
    of: ConstructEntrySchema,
    default: () => new Map()
  },
  validityFlags: {
    type: ValidityFlagsSchema,
    default: () => ({})
  },
  telemetry: {
    type: FlowTelemetrySchema,
    default: () => ({})
  },
  accommodation: {
    type: AccommodationSchema,
    default: () => ({})
  },
  intakeMeta: {
    type: IntakeMetaSchema,
    default: () => ({})
  },
  blockSessions: {
    type: [BlockSessionSchema],
    default: []
  },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
};

export const userFlowSessionSchemaOptions = {
  timestamps: true,
  collection: COLLECTIONS.USER_FLOW_SESSIONS,
  minimize: false
};

/** @type {import("mongoose").IndexDefinition} */
export const userFlowSessionIndexes = [
  { key: { userId: 1, flowId: 1, status: 1 }, options: { name: "idx_user_flow_status" } },
  { key: { userId: 1, createdAt: -1 }, options: { name: "idx_user_created" } },
  { key: { flowId: 1, currentPhase: 1 }, options: { name: "idx_flow_phase" } }
];

export function createUserFlowSessionSchema() {
  const schema = new mongoose.Schema(userFlowSessionSchemaDefinition, userFlowSessionSchemaOptions);
  schema.index(userFlowSessionIndexes[0].key, userFlowSessionIndexes[0].options);
  schema.index(userFlowSessionIndexes[1].key, userFlowSessionIndexes[1].options);
  schema.index(userFlowSessionIndexes[2].key, userFlowSessionIndexes[2].options);
  return schema;
}
