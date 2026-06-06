/** Assessment engine — shared types (mirrors backend registry + telemetry). */

export type EngineType =
  | "likert"
  | "branching"
  | "reaction_time"
  | "tracing"
  | "drag_drop"
  | "node_graph";

export type ModuleStatus = "draft" | "beta" | "live" | "deprecated";

export type AssessmentModule = {
  id: string;
  productCode: string;
  title: string;
  engineType: EngineType;
  constructTags: string[];
  mbsDomainHints: string[];
  difficultyTier: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  status: ModuleStatus;
  contentSource?: "archive" | "static_fallback" | "procedural";
  archiveItemCount?: number;
  bankVersion?: string | null;
};

export type TelemetryEventType =
  | "session_start"
  | "stimulus_present"
  | "response"
  | "response_timeout"
  | "hint_shown"
  | "item_complete"
  | "module_complete"
  | "session_abort";

export type TelemetryEvent = {
  itemId?: string;
  eventType: TelemetryEventType;
  stimulusId?: string;
  responseValue?: unknown;
  responseCorrect?: boolean | null;
  responseTimeMs?: number;
  attemptIndex?: number;
  difficultyLevel?: number;
  engineType?: EngineType;
  metadata?: Record<string, unknown>;
};

export type AdaptiveState = {
  difficulty: number;
  streakCorrect: number;
  itemsCompleted: number;
  accuracy?: number;
  meanRtMs?: number;
};

export type AssessmentItemProgress = {
  itemId: string | null;
  index: number;
  total: number;
  isLast: boolean;
};

export type MbsDomain = {
  id: string;
  code: string;
  label: string;
  careerGroup: string;
  careerDomain: string;
};

export type MbsOccupation = {
  socCode: string;
  mbsDomainId: string;
  mbsDomainLabel: string | null;
  careerGroup: string;
  careerDomain: string;
  confidence: number | null;
  title: string | null;
  description?: string | null;
};
