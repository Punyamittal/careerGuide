/** Mirrors backend clarify.dto.ts — client-side types only. */

export interface ConstructScore {
  score: number;
  confidence: number;
  band: string;
  evidence?: string[];
  blocked?: boolean;
}

export interface JourneyMeta {
  journeyId: string;
  name: string;
  priority: number;
  forced: boolean;
  itemsPlanned: { min: number; max: number };
  simInjection: string[];
}

export interface RuleDetail {
  ruleId: string;
  name: string;
  message: string;
  priority: number;
  forced: boolean;
  journeys: string[];
}

export interface ClarifyEvaluateResponse {
  clarificationSessionId: string | null;
  firedRules: string[];
  triggeredRules: RuleDetail[];
  journeys: JourneyMeta[];
  maxJourneys: number;
  extendedMode: boolean;
  priority: number | null;
  accommodation: Record<string, unknown>;
  canSkip: boolean;
  skipped: boolean;
  explainability: Array<{ timestamp: string; step: string; message: string }>;
  version: string;
}

export interface ClarifyNextItem {
  itemId: string;
  questionType: string;
  stem: string;
  options: string[];
  metadata?: { difficulty?: string; exposurePool?: string };
}

export type ClarifyNextResponse =
  | {
      blockType: "items";
      journeyId: string;
      clarificationSessionId: string;
      itemsRemaining: number;
      items: ClarifyNextItem[];
    }
  | {
      blockType: "simulation";
      journeyId: string;
      clarificationSessionId: string;
      simConfig: Record<string, unknown> & { simId: string; timeMultiplier?: number };
    }
  | { blockType: "complete"; message: string };

export interface ClarifyResponseResult {
  accepted: boolean;
  partialScore: number;
  constructUpdates: Record<string, number>;
  journeyConfidence: { aggregate: number };
  shouldContinue: boolean;
}

export interface ClarifySimCompleteResponse {
  compositeScore: number;
  dimensionScores: Record<string, number>;
  success: boolean;
}

export interface ClarifyFinalizeResponse {
  constructScores: Record<string, ConstructScore>;
  validityBand: "high" | "interpret_with_caution";
  clarificationSummary: Record<string, unknown>;
  blockedConstructs: string[];
  nextPhase: "8";
  version: string;
}

export interface FlowSessionState {
  flowSessionId: string;
  currentPhase: string;
  status: string;
  constructSnapshot: Record<string, unknown>;
  validityFlags: Record<string, unknown>;
  accommodation: Record<string, unknown>;
  clarification: {
    clarificationSessionId: string;
    status: string;
    firedRules: string[];
    assignedJourneys: string[];
  } | null;
}

export type ClarificationPhase =
  | "idle"
  | "evaluating"
  | "routing"
  | "items"
  | "simulation"
  | "finalizing"
  | "complete"
  | "error";
