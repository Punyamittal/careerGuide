import type { NegotiationBranch, TradePackage } from "./scenario";

export const SIM_ID = "SIM-NEGOTIATION-NPC-V2";

export type NpcMood = "neutral" | "open" | "firm" | "positive" | "negative";

export interface NegotiationOffer {
  round: number;
  branch: NegotiationBranch;
  tradePackage?: TradePackage;
  scopePreserved?: number;
  datePreserved?: number;
  timestampMs: number;
}

export interface NegotiationTelemetry {
  offers: NegotiationOffer[];
  concessions: NegotiationOffer[];
  probe_count: number;
  probe_latency_ms: number | null;
  interest_summary_text: string | null;
  walk_away: boolean;
  round_count: number;
  npc_trust_series: number[];
  npc_trust_meter_end: number;
  joint_value_score: number;
  batna_referenced: boolean;
  creative_trade_flag: boolean;
  unilateral_concede_round1: boolean;
  zero_sum_only: boolean;
  first_move: NegotiationBranch | null;
  duration_ms: number;
}

export interface NegotiationDimensionScores {
  "NEG-INT": number;
  "NEG-TRADE": number;
  "NEG-REL": number;
  "NEG-ASSERT": number;
  "NEG-JV": number;
  assertiveness_score: number;
  trust_score: number;
  joint_value_score: number;
  relationship_score: number;
}

export interface NegotiationResultPayload {
  simId: string;
  composite: number;
  success: boolean;
  negotiation_band: "developing" | "capable" | "strong";
  dimension_subscores: NegotiationDimensionScores;
  sim_evidence_summary: string;
  failure_reasons: string[];
  telemetry: NegotiationTelemetry;
}

export interface NegotiationSessionView {
  sessionId: string;
  simId: string;
  round: number;
  maxRounds: number;
  trust: number;
  trustSeries?: number[];
  probeCount?: number;
  batnaRevealed?: boolean;
  npcMessage: string;
  npcMood: NpcMood;
  availableActions: NegotiationBranch[];
  availableTradePackages: TradePackage[];
  sessionComplete: boolean;
  result?: NegotiationResultPayload | null;
}

export interface NegotiationActionRequest {
  branch: NegotiationBranch;
  tradePackage?: TradePackage;
  interestSummaryText?: string;
  clientTimestampMs?: number;
}
