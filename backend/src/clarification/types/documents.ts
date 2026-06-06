import type { Types } from "mongoose";
import type { ConstructEntry } from "../services/flowMapper.service.js";

export interface IUserFlowSession {
  _id: Types.ObjectId;
  userId: string;
  currentPhase: string;
  status: string;
  constructSnapshot: Map<string, ConstructEntry> | Record<string, ConstructEntry>;
  telemetry: Record<string, unknown>;
  validityFlags: Record<string, unknown>;
  accommodation: Record<string, unknown>;
  intakeMeta?: Record<string, unknown>;
}

export interface IJourneyProgress {
  status?: string;
  itemsAnswered?: number;
  itemsPlanned?: { min: number; max: number };
  simCompleted?: boolean;
  simId?: string;
  recentItemIds?: string[];
  completedAt?: Date;
}

export interface IClarificationSession {
  _id: Types.ObjectId;
  flowSessionId: Types.ObjectId;
  userId: string;
  status: string;
  firedRules: string[];
  assignedJourneys: string[];
  assignedJourneyMeta: Array<Record<string, unknown>>;
  accommodationSnapshot?: Record<string, unknown>;
  journeyProgress: Map<string, IJourneyProgress> | Record<string, IJourneyProgress>;
  fusionResult?: Record<string, unknown>;
  finalizedAt?: Date;
  blockedConstructs?: string[];
  save(): Promise<unknown>;
  set(path: string, value: unknown): void;
}

export interface IClarificationResponse {
  itemId: string;
  partialScore?: number;
  questionType?: string;
}

export interface IClarificationSimResult {
  simId: string;
  compositeScore?: number;
  dimensionScores?: Record<string, number>;
}

export interface IItemExposure {
  itemId: string;
}
