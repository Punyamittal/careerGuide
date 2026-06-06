// @ts-nocheck — dialogue union literals; runtime-validated by scenario spec
import {
  COMPOSITE_WEIGHTS,
  INITIAL_TRUST,
  NPC_LINES,
  type NegotiationBranch,
  type TradePackage,
  TRADE_PACKAGES,
  MAX_ROUNDS
} from "../constants/scenario.js";

export interface NegotiationOffer {
  round: number;
  branch: NegotiationBranch;
  tradePackage?: TradePackage;
  scopePreserved?: number;
  datePreserved?: number;
  timestampMs: number;
}

export interface NegotiationSessionState {
  sessionId: string;
  userId: string;
  round: number;
  maxRounds: number;
  trust: number;
  trustSeries: number[];
  probeCount: number;
  firstProbeLatencyMs: number | null;
  firstMove: NegotiationBranch | null;
  batnaRevealed: boolean;
  creativeTrade: boolean;
  walkAway: boolean;
  dealAccepted: boolean;
  unilateralConcedeRound1: boolean;
  zeroSumOnly: boolean;
  interestSummaryText: string | null;
  scopePreserved: number;
  datePreserved: number;
  jointValueScore: number;
  offers: NegotiationOffer[];
  concessions: NegotiationOffer[];
  startedAtMs: number;
  completedAtMs: number | null;
  status: "active" | "completed";
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

export interface NegotiationScoreResult {
  composite: number;
  dimensionScores: NegotiationDimensionScores;
  negotiationBand: "developing" | "capable" | "strong";
  success: boolean;
  failureReasons: string[];
  simEvidenceSummary: string;
  telemetry: NegotiationTelemetry;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export function buildTelemetry(state: NegotiationSessionState): NegotiationTelemetry {
  const ended = state.completedAtMs ?? Date.now();
  return {
    offers: state.offers,
    concessions: state.concessions,
    probe_count: state.probeCount,
    probe_latency_ms: state.firstProbeLatencyMs,
    interest_summary_text: state.interestSummaryText,
    walk_away: state.walkAway,
    round_count: state.round,
    npc_trust_series: state.trustSeries,
    npc_trust_meter_end: state.trustSeries[state.trustSeries.length - 1] ?? state.trust,
    joint_value_score: state.jointValueScore,
    batna_referenced: state.batnaRevealed,
    creative_trade_flag: state.creativeTrade,
    unilateral_concede_round1: state.unilateralConcedeRound1,
    zero_sum_only: state.zeroSumOnly,
    first_move: state.firstMove,
    duration_ms: ended - state.startedAtMs
  };
}

/**
 * V2 rubric: NEG-INT, NEG-TRADE, NEG-REL, NEG-ASSERT, NEG-JV
 * composite = 0.25*INT + 0.25*TRADE + 0.20*REL + 0.15*ASSERT + 0.15*JV
 */
export function scoreNegotiationV2(state: NegotiationSessionState): NegotiationScoreResult {
  const telemetry = buildTelemetry(state);
  const trustEnd = telemetry.npc_trust_meter_end;

  const interestQuality =
    state.probeCount >= 1
      ? clamp01(0.55 + (state.interestSummaryText ? 0.25 : 0) + (state.batnaRevealed ? 0.2 : 0))
      : 0;

  const negInt =
    state.probeCount >= 1 && interestQuality >= 0.6 ? clamp01(interestQuality) : state.probeCount >= 1 ? 0.55 : 0.25;

  const jointValueDelta = state.jointValueScore - 0.5;
  const negTrade =
    state.creativeTrade && jointValueDelta > 0
      ? clamp01(0.65 + jointValueDelta)
      : state.creativeTrade
        ? 0.45
        : 0.25;

  const negRel = trustEnd >= 0.5 ? clamp01(trustEnd) : clamp01(trustEnd * 0.85);

  const negAssert = state.unilateralConcedeRound1 && state.firstMove === "concede_unilateral" ? 0.2 : 0.85;

  const negJv = clamp01(state.jointValueScore);

  const assertivenessScore = negAssert;
  const relationshipScore = negRel;

  const dimensionScores: NegotiationDimensionScores = {
    "NEG-INT": round4(negInt),
    "NEG-TRADE": round4(negTrade),
    "NEG-REL": round4(negRel),
    "NEG-ASSERT": round4(negAssert),
    "NEG-JV": round4(negJv),
    assertiveness_score: round4(assertivenessScore),
    trust_score: round4(trustEnd),
    joint_value_score: round4(state.jointValueScore),
    relationship_score: round4(relationshipScore)
  };

  const composite = round4(
    COMPOSITE_WEIGHTS["NEG-INT"] * negInt +
      COMPOSITE_WEIGHTS["NEG-TRADE"] * negTrade +
      COMPOSITE_WEIGHTS["NEG-REL"] * negRel +
      COMPOSITE_WEIGHTS["NEG-ASSERT"] * negAssert +
      COMPOSITE_WEIGHTS["NEG-JV"] * negJv
  );

  const failureReasons: string[] = [];
  if (state.walkAway && state.probeCount === 0) failureReasons.push("walkaway_without_probe");
  if (state.zeroSumOnly) failureReasons.push("zero_sum_only");
  if (state.unilateralConcedeRound1) failureReasons.push("unilateral_concede_round1");

  const success =
    composite >= 0.65 &&
    state.probeCount >= 1 &&
    !(state.walkAway && state.probeCount === 0) &&
    !state.zeroSumOnly &&
    !(state.unilateralConcedeRound1 && !state.dealAccepted);

  let negotiationBand: "developing" | "capable" | "strong" = "developing";
  if (composite >= 0.72) negotiationBand = "strong";
  else if (composite >= 0.45) negotiationBand = "capable";

  const simEvidenceSummary = [
    `Probes: ${state.probeCount}`,
    `Trust end: ${round4(trustEnd)}`,
    `Joint value: ${round4(state.jointValueScore)}`,
    state.creativeTrade ? "Creative trade proposed" : "No creative trade",
    state.batnaRevealed ? "BATNA referenced" : "BATNA not revealed",
    state.dealAccepted ? "Deal accepted" : state.walkAway ? "Walk away" : "No deal"
  ].join(" · ");

  return {
    composite,
    dimensionScores,
    negotiationBand,
    success,
    failureReasons,
    simEvidenceSummary,
    telemetry
  };
}

export function createInitialState(sessionId: string, userId: string): NegotiationSessionState {
  return {
    sessionId,
    userId,
    round: 1,
    maxRounds: MAX_ROUNDS,
    trust: INITIAL_TRUST,
    trustSeries: [INITIAL_TRUST],
    probeCount: 0,
    firstProbeLatencyMs: null,
    firstMove: null,
    batnaRevealed: false,
    creativeTrade: false,
    walkAway: false,
    dealAccepted: false,
    unilateralConcedeRound1: false,
    zeroSumOnly: false,
    interestSummaryText: null,
    scopePreserved: 1,
    datePreserved: 1,
    jointValueScore: 0.5,
    offers: [],
    concessions: [],
    startedAtMs: Date.now(),
    completedAtMs: null,
    status: "active"
  };
}

export interface ActionInput {
  branch: NegotiationBranch;
  tradePackage?: TradePackage;
  interestSummaryText?: string;
  timestampMs?: number;
}

export interface ActionOutcome {
  state: NegotiationSessionState;
  npcMessage: string;
  npcMood: "neutral" | "open" | "firm" | "positive" | "negative";
  availableActions: NegotiationBranch[];
  availableTradePackages: TradePackage[];
  sessionComplete: boolean;
}

function pushTrust(state: NegotiationSessionState, delta: number): void {
  state.trust = clamp01(state.trust + delta);
  state.trustSeries.push(state.trust);
}

function recordOffer(state: NegotiationSessionState, offer: NegotiationOffer, asConcession: boolean): void {
  state.offers.push(offer);
  if (asConcession) state.concessions.push(offer);
}

export function applyNegotiationAction(
  state: NegotiationSessionState,
  input: ActionInput
): ActionOutcome {
  if (state.status === "completed") {
    return {
      state,
      npcMessage: NPC_LINES.deal_accept,
      npcMood: "positive",
      availableActions: [],
      availableTradePackages: [],
      sessionComplete: true
    };
  }

  const now = input.timestampMs ?? Date.now();
  const { branch, tradePackage, interestSummaryText } = input;

  if (!state.firstMove) state.firstMove = branch;

  let npcMessage = NPC_LINES.round1_hardline;
  let npcMood: ActionOutcome["npcMood"] = "firm";
  let sessionComplete = false;

  if (branch === "probe_interests") {
    state.probeCount += 1;
    if (state.firstProbeLatencyMs == null) {
      state.firstProbeLatencyMs = now - state.startedAtMs;
    }
    if (interestSummaryText?.trim()) {
      state.interestSummaryText = interestSummaryText.trim();
    }
    pushTrust(state, 0.08);
    npcMessage = NPC_LINES.probe_ack;
    npcMood = "open";
    if (state.round >= 2 && state.probeCount >= 1) {
      state.batnaRevealed = true;
      npcMessage = NPC_LINES.round2_interest;
    }
    recordOffer(
      state,
      { round: state.round, branch, timestampMs: now },
      false
    );
  } else if (branch === "facilitate_options_meeting") {
    pushTrust(state, 0.05);
    npcMessage = NPC_LINES.facilitate_ack;
    npcMood = "open";
    recordOffer(state, { round: state.round, branch, timestampMs: now }, false);
  } else if (branch === "trade_scope_date") {
    if (!tradePackage) {
      npcMessage = "Which package do you want to put on the table?";
      npcMood = "neutral";
      return {
        state,
        npcMessage,
        npcMood,
        availableActions: ["trade_scope_date"],
        availableTradePackages: Object.keys(TRADE_PACKAGES) as TradePackage[],
        sessionComplete: false
      };
    }
    const pkg = TRADE_PACKAGES[tradePackage];
    state.creativeTrade = pkg.creative;
    state.scopePreserved = pkg.scopePreserved;
    state.datePreserved = pkg.datePreserved;
    state.jointValueScore = clamp01(pkg.scopePreserved * 0.5 + pkg.datePreserved * 0.5);
    pushTrust(state, 0.12);
    npcMessage = NPC_LINES.trade_ack;
    npcMood = "open";
    recordOffer(
      state,
      {
        round: state.round,
        branch,
        tradePackage,
        scopePreserved: pkg.scopePreserved,
        datePreserved: pkg.datePreserved,
        timestampMs: now
      },
      false
    );
    if (state.round >= 3 && state.probeCount >= 1) {
      state.dealAccepted = true;
      npcMessage = NPC_LINES.deal_accept;
      npcMood = "positive";
      sessionComplete = true;
    }
  } else if (branch === "concede_unilateral") {
    if (state.round === 1) state.unilateralConcedeRound1 = true;
    state.scopePreserved = 0.5;
    state.datePreserved = 0.4;
    state.jointValueScore = 0.45;
    pushTrust(state, -0.05);
    npcMessage = NPC_LINES.concede_ack;
    npcMood = "neutral";
    recordOffer(
      state,
      {
        round: state.round,
        branch,
        scopePreserved: 0.5,
        datePreserved: 0.4,
        timestampMs: now
      },
      true
    );
    if (state.round >= 2) sessionComplete = true;
  } else if (branch === "hardball") {
    pushTrust(state, -0.15);
    if (state.probeCount === 0 && state.round >= 2) state.zeroSumOnly = true;
    npcMessage = NPC_LINES.hardball_ack;
    npcMood = "firm";
    recordOffer(state, { round: state.round, branch, timestampMs: now }, false);
  } else if (branch === "walkaway") {
    state.walkAway = true;
    pushTrust(state, -0.2);
    npcMessage = NPC_LINES.walkaway_ack;
    npcMood = "negative";
    recordOffer(state, { round: state.round, branch, timestampMs: now }, false);
    sessionComplete = true;
  }

  if (!sessionComplete && branch !== "walkaway") {
    if (state.round < state.maxRounds) {
      state.round += 1;
      if (state.round === 3) {
        npcMessage = `${npcMessage}\n\n${NPC_LINES.round3_final}`;
      } else if (state.round === 2 && state.probeCount >= 1 && !state.batnaRevealed) {
        state.batnaRevealed = true;
        npcMessage = NPC_LINES.round2_interest;
      } else if (state.round === 2 && state.probeCount === 0) {
        npcMessage = `${npcMessage}\n\n${NPC_LINES.round2_no_probe}`;
      }
    } else {
      sessionComplete = true;
      if (!state.dealAccepted && !state.walkAway) {
        npcMessage = state.creativeTrade ? NPC_LINES.deal_accept : NPC_LINES.deal_reject;
        state.dealAccepted = state.creativeTrade && state.probeCount >= 1;
      }
    }
  }

  if (sessionComplete) {
    state.status = "completed";
    state.completedAtMs = now;
  }

  const availableActions = sessionComplete
    ? []
    : (["probe_interests", "trade_scope_date", "facilitate_options_meeting", "concede_unilateral", "hardball", "walkaway"] as NegotiationBranch[]);

  const availableTradePackages =
    !sessionComplete && (branch === "trade_scope_date" || state.round >= 2)
      ? (Object.keys(TRADE_PACKAGES) as TradePackage[])
      : [];

  return {
    state,
    npcMessage,
    npcMood,
    availableActions,
    availableTradePackages,
    sessionComplete
  };
}

export function getOpeningNpcMessage(): string {
  return NPC_LINES.setup;
}
