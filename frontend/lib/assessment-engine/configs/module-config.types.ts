import type { EngineType } from "../types";

export type ModuleScoringConfig = {
  provider: "rule" | "openai" | "anthropic" | "gemini";
  constructs: string[];
};

/* ─── Likert ─── */

export type LikertItemType = "frequency" | "semantic_differential" | "binary";

/** Future stimulus modes — engine reads `stimulus.type` when present. */
export type LikertStimulusConfig = {
  type: "text" | "image" | "swipe";
  assetUrl?: string;
  alt?: string;
};

export type LikertItemConfig = {
  id: string;
  type: LikertItemType;
  prompt: string;
  /** Thematic bucket for scoring + analytics aggregation */
  category: string;
  scaleLabels?: string[];
  poles?: [string, string];
  binaryLabels?: [string, string];
  difficulty: number;
  telemetryTags: string[];
  /** Per-construct weights for rule-based summary (config-driven) */
  scoringWeight: Record<string, number>;
  /** Adaptive routing hints: simple | complex | ambiguous */
  adaptiveTags?: string[];
  idealIndex?: number;
  /** Reserved for Interest Explorer / RIASEC evolution */
  stimulus?: LikertStimulusConfig;
};

export type LikertCheckpoint = {
  afterIndex: number;
  message: string;
};

export type LikertModuleConfig = {
  moduleId: string;
  engineType: "likert";
  title: string;
  scoring: ModuleScoringConfig;
  items: LikertItemConfig[];
  fastResponseMs?: number;
  hesitationMs?: number;
  /** Advance to next item after selection (default true) */
  autoAdvanceOnSelect?: boolean;
  autoAdvanceDelayMs?: number;
  /** Show pacing message every N completed items (default 5) */
  checkpointInterval?: number;
  checkpoints?: LikertCheckpoint[];
  estimatedMinutes?: number;
};

/* ─── Branching / SJT ─── */

export type ScenarioAvatar = "coach" | "peer" | "manager" | "user" | "narrator";

export type BranchWeights = {
  empathy?: number;
  assertiveness?: number;
  escalation?: number;
  communication?: number;
  collaboration?: number;
};

export type BranchEffects = {
  lockBranches?: string[];
  unlockBranches?: string[];
  weightModifiers?: Partial<BranchWeights>;
  toneShift?: "calm" | "tense" | "neutral" | "hopeful";
};

export type BranchingOption = {
  id: string;
  label: string;
  text: string;
  weights: BranchWeights;
  consequence?: string;
  nextNodeId?: string | null;
  effects?: BranchEffects;
};

export type BranchingNode = {
  id: string;
  type: "narrative" | "choice" | "consequence";
  speaker?: string;
  avatar?: ScenarioAvatar;
  narrative: string;
  options?: BranchingOption[];
  difficulty: number;
  tags?: string[];
};

export type ScenarioConfig = {
  id: string;
  title: string;
  setting: string;
  entryNodeId: string;
  nodes: BranchingNode[];
  difficulty: number;
  telemetryTags: string[];
  /** Tags for adaptive routing (e.g. de-escalation, ambiguous) */
  adaptiveTags?: string[];
};

export type BranchingModuleConfig = {
  moduleId: string;
  engineType: "branching";
  title: string;
  scoring: ModuleScoringConfig;
  scenarios: ScenarioConfig[];
  fastResponseMs?: number;
  impulsiveMs?: number;
  hesitationMs?: number;
};

export type ModuleConfig = LikertModuleConfig | BranchingModuleConfig;

export function isLikertConfig(c: ModuleConfig): c is LikertModuleConfig {
  return c.engineType === "likert";
}

export function isBranchingConfig(c: ModuleConfig): c is BranchingModuleConfig {
  return c.engineType === "branching";
}

/* ─── Answers & persistence ─── */

export type ItemAnswer = {
  value: number | string;
  responseTimeMs: number;
  interactionCount: number;
  changedAnswer: boolean;
  submittedAt: string;
};

export type BranchingAnswer = {
  nodeId: string;
  scenarioId: string;
  optionId: string;
  responseTimeMs: number;
  hesitationTimeMs: number;
  changedChoice: boolean;
  branchDepth: number;
  weights: BranchWeights;
  submittedAt: string;
};

export type BranchSignals = {
  empathy: number;
  assertiveness: number;
  escalation: number;
  communication: number;
};

export type BranchPathStep = {
  scenarioId: string;
  nodeId: string;
  optionId?: string;
  at: string;
};

export type AdaptiveStateSnapshot = {
  difficulty: number;
  streakCorrect: number;
  itemsCompleted: number;
  hesitationStreak: number;
  impulsiveStreak?: number;
  nuancedStreak?: number;
  /** 1 = prefer simpler items, 5 = prefer more complex/ambiguous */
  cognitiveLoadTarget?: number;
};

export type SessionAnalyticsSnapshot = {
  avgResponseTimeMs: number;
  answerChangeCount: number;
  hesitationCount: number;
  itemsAnswered: number;
  dropoutItemId: string | null;
  completionDurationMs: number;
  consistencyScore: number;
};

export type SessionSummarySnapshot = {
  completionTimeMs: number;
  dominantPattern: string;
  topTendencies: string[];
  consistencyScore: number;
  categoryScores: Record<string, number>;
  /** Short narrative bullets shown on the immediate report */
  insights?: string[];
  /** Branching modules — scenarios finished */
  scenariosCompleted?: number;
  scenariosTotal?: number;
};

export type PersistedSession = {
  sessionId: string;
  moduleId: string;
  engineType: EngineType;
  /** Likert */
  currentItemId?: string | null;
  itemOrder?: string[];
  sessionAnalytics?: SessionAnalyticsSnapshot;
  sessionSummary?: SessionSummarySnapshot;
  /** Branching */
  currentScenarioId?: string | null;
  currentNodeId?: string | null;
  scenarioOrder?: string[];
  branchingPath?: BranchPathStep[];
  flags?: Record<string, boolean>;
  signals?: BranchSignals;
  completedScenarioIds?: string[];
  answers: Record<string, ItemAnswer | BranchingAnswer>;
  adaptiveState: AdaptiveStateSnapshot;
  startedAt: string;
  elapsedMs: number;
  updatedAt: string;
};
