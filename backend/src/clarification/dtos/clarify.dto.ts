import type { RuleId, JourneyId } from "../engine/ambiguityRules.js";

export interface ConstructScoreDto {
  score: number;
  confidence: number;
  band: string;
  evidence?: string[];
  blocked?: boolean;
}

export interface JourneyMetaDto {
  journeyId: JourneyId | string;
  name: string;
  priority: number;
  forced: boolean;
  triggeredBy?: RuleId[] | string[];
  itemsPlanned: { min: number; max: number };
  simInjection: string[];
  simSubstitution?: { U17?: string[] } | null;
}

export interface RuleDetailDto {
  ruleId: RuleId | string;
  name: string;
  message: string;
  priority: number;
  forced: boolean;
  journeys: string[];
}

export interface ExplainabilityLogDto {
  timestamp: string;
  step: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface AccommodationSnapshotDto {
  U15_active?: boolean;
  latency_penalty_disabled?: boolean;
  time_multiplier?: number;
  extended_time?: boolean;
}

/** POST /clarify/evaluate */
export interface ClarifyEvaluateResponseDto {
  clarificationSessionId: string | null;
  firedRules: string[];
  triggeredRules: RuleDetailDto[];
  journeys: JourneyMetaDto[];
  maxJourneys: number;
  extendedMode: boolean;
  priority: number | null;
  accommodation: AccommodationSnapshotDto;
  canSkip: boolean;
  skipped: boolean;
  explainability: ExplainabilityLogDto[];
  version: string;
}

/** GET /clarify/next — items block */
export interface ClarifyNextItemDto {
  itemId: string;
  questionType: string;
  stem: string;
  options: string[];
  optionOrder: null;
  metadata: {
    difficulty?: string;
    exposurePool?: string;
  };
}

export interface ClarifyNextItemsResponseDto {
  blockType: "items";
  journeyId: string;
  clarificationSessionId: string;
  itemsRemaining: number;
  items: ClarifyNextItemDto[];
}

export interface ClarifyNextSimResponseDto {
  blockType: "simulation";
  journeyId: string;
  clarificationSessionId: string;
  simConfig: Record<string, unknown> & {
    simId: string;
    timeMultiplier: number;
  };
}

export interface ClarifyNextCompleteResponseDto {
  blockType: "complete";
  message: string;
}

export type ClarifyNextResponseDto =
  | ClarifyNextItemsResponseDto
  | ClarifyNextSimResponseDto
  | ClarifyNextCompleteResponseDto;

/** POST /clarify/response */
export interface ClarifyResponseRequestDto {
  clarificationSessionId: string;
  journeyId: string;
  itemId: string;
  selectedOption: number | string;
  responseTimeMs?: number;
  answerChangeCount?: number;
  clientSeq?: number;
}

export interface ClarifyResponseResultDto {
  accepted: boolean;
  partialScore: number;
  constructUpdates: Record<string, number>;
  journeyConfidence: { aggregate: number };
  shouldContinue: boolean;
}

/** POST /clarify/sim/complete */
export interface ClarifySimCompleteRequestDto {
  clarificationSessionId: string;
  journeyId: string;
  simId: string;
  telemetry: Record<string, unknown>;
  compositeScore?: number;
  dimensionScores?: Record<string, number>;
  success?: boolean;
  durationMs?: number;
}

export interface ClarifySimCompleteResponseDto {
  compositeScore: number;
  dimensionScores: Record<string, number>;
  success: boolean;
}

/** POST /clarify/finalize */
export interface ClarifyFinalizeResponseDto {
  constructScores: Record<string, ConstructScoreDto>;
  validityBand: "high" | "interpret_with_caution";
  clarificationSummary: {
    skipped?: boolean;
    rulesFired?: string[];
    journeysCompleted?: string[];
    itemsAnswered?: number;
    boostApplied?: number;
  };
  blockedConstructs: string[];
  nextPhase: "8";
  version: string;
}

export interface FlowSessionParamsDto {
  flowSessionId: string;
}

export interface ClarifyNextQueryDto {
  journeyId?: string;
  batchSize?: number;
}
