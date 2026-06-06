import type { JourneyMetaDto } from "../dtos/clarify.dto.js";

export interface ConstructEntry {
  score?: number;
  confidence?: number;
  methods?: string[];
  se?: number | null;
}

export interface UserFlowSessionRow {
  id: string;
  user_id: string;
  flow_id: string;
  status: string;
  current_phase: string;
  phase_progress: Record<string, unknown>;
  construct_snapshot: Record<string, ConstructEntry>;
  validity_flags: Record<string, unknown>;
  telemetry: Record<string, unknown>;
  accommodation: Record<string, unknown>;
  intake_meta: Record<string, unknown>;
  block_sessions: unknown[];
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserFlowSession {
  id: string;
  userId: string;
  flowId: string;
  status: string;
  currentPhase: string;
  phaseProgress: Record<string, unknown>;
  constructSnapshot: Record<string, ConstructEntry>;
  validityFlags: Record<string, unknown>;
  telemetry: Record<string, unknown>;
  accommodation: Record<string, unknown>;
  intakeMeta: Record<string, unknown>;
  blockSessions: unknown[];
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyProgress {
  status?: string;
  itemsAnswered?: number;
  itemsPlanned?: { min: number; max: number };
  simCompleted?: boolean;
  simId?: string;
  recentItemIds?: string[];
  constructConfidence?: Record<string, number>;
  completedAt?: string;
}

export interface ClarificationSessionRow {
  id: string;
  flow_session_id: string;
  user_id: string;
  status: string;
  fired_rules: string[];
  assigned_journeys: string[];
  max_journeys: number;
  current_journey_index: number;
  journey_progress: Record<string, JourneyProgress>;
  assigned_journey_meta: JourneyMetaDto[];
  accommodation_snapshot: Record<string, unknown>;
  fusion_result: Record<string, unknown> | null;
  blocked_constructs: string[];
  evaluated_at: string | null;
  finalized_at: string | null;
  schema_version: number;
  created_at: string;
  updated_at: string;
}

export interface ClarificationSession {
  id: string;
  flowSessionId: string;
  userId: string;
  status: string;
  firedRules: string[];
  assignedJourneys: string[];
  maxJourneys: number;
  currentJourneyIndex: number;
  journeyProgress: Record<string, JourneyProgress>;
  assignedJourneyMeta: JourneyMetaDto[];
  accommodationSnapshot: Record<string, unknown>;
  fusionResult: Record<string, unknown> | null;
  blockedConstructs: string[];
  evaluatedAt: string | null;
  finalizedAt: string | null;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClarificationResponseRow {
  id: string;
  clarification_session_id: string;
  user_id: string;
  journey_id: string;
  item_id: string;
  item_version: number;
  question_type: string;
  response_value: Record<string, unknown>;
  response_correct: boolean | null;
  partial_score: number | null;
  response_time_ms: number | null;
  answer_change_count: number;
  scoring_rubric: string | null;
  client_seq: number | null;
  created_at: string;
  updated_at: string;
}

export interface ClarificationSimResultRow {
  id: string;
  clarification_session_id: string;
  user_id: string;
  journey_id: string;
  sim_id: string;
  telemetry: Record<string, unknown>;
  composite_score: number | null;
  dimension_scores: Record<string, number>;
  success: boolean | null;
  duration_ms: number | null;
  negotiation_band: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClarificationItemExposureRow {
  id: string;
  user_id: string;
  item_id: string;
  exposure_count: number;
  last_exposed_at: string;
  stem_hash: string | null;
  journey_id: string | null;
  pool_id: string | null;
}

export function mapUserFlowSession(row: UserFlowSessionRow): UserFlowSession {
  return {
    id: row.id,
    userId: row.user_id,
    flowId: row.flow_id,
    status: row.status,
    currentPhase: row.current_phase,
    phaseProgress: row.phase_progress ?? {},
    constructSnapshot: row.construct_snapshot ?? {},
    validityFlags: row.validity_flags ?? {},
    telemetry: row.telemetry ?? {},
    accommodation: row.accommodation ?? {},
    intakeMeta: row.intake_meta ?? {},
    blockSessions: row.block_sessions ?? [],
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapClarificationSession(row: ClarificationSessionRow): ClarificationSession {
  return {
    id: row.id,
    flowSessionId: row.flow_session_id,
    userId: row.user_id,
    status: row.status,
    firedRules: row.fired_rules ?? [],
    assignedJourneys: row.assigned_journeys ?? [],
    maxJourneys: row.max_journeys,
    currentJourneyIndex: row.current_journey_index,
    journeyProgress: row.journey_progress ?? {},
    assignedJourneyMeta: row.assigned_journey_meta ?? [],
    accommodationSnapshot: row.accommodation_snapshot ?? {},
    fusionResult: row.fusion_result,
    blockedConstructs: row.blocked_constructs ?? [],
    evaluatedAt: row.evaluated_at,
    finalizedAt: row.finalized_at,
    schemaVersion: row.schema_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapClarificationResponse(row: ClarificationResponseRow) {
  return {
    id: row.id,
    clarificationSessionId: row.clarification_session_id,
    userId: row.user_id,
    journeyId: row.journey_id,
    itemId: row.item_id,
    itemVersion: row.item_version,
    questionType: row.question_type,
    responseValue: row.response_value,
    responseCorrect: row.response_correct,
    partialScore: row.partial_score,
    responseTimeMs: row.response_time_ms,
    answerChangeCount: row.answer_change_count,
    scoringRubric: row.scoring_rubric,
    clientSeq: row.client_seq,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapClarificationSimResult(row: ClarificationSimResultRow) {
  return {
    id: row.id,
    clarificationSessionId: row.clarification_session_id,
    userId: row.user_id,
    journeyId: row.journey_id,
    simId: row.sim_id,
    telemetry: row.telemetry,
    compositeScore: row.composite_score,
    dimensionScores: row.dimension_scores ?? {},
    success: row.success,
    durationMs: row.duration_ms,
    negotiationBand: row.negotiation_band,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
