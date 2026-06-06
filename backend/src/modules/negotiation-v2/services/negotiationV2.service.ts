import { SIM_ID } from "../constants/scenario.js";
import {
  applyNegotiationAction,
  createInitialState,
  getOpeningNpcMessage,
  scoreNegotiationV2,
  type ActionInput,
  type NegotiationSessionState
} from "../engines/negotiation.engine.js";
import { NegotiationV2Session } from "../models/NegotiationV2Session.model.js";
import { ApiError } from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { isMongoReady } from "../../../config/mongodb.js";

/** In-memory fallback when MongoDB is unavailable (dev). */
const memorySessions = new Map<string, { userId: string; state: NegotiationSessionState; result?: Record<string, unknown> }>();

function requireMongoOrMemory(): void {
  if (!isMongoReady() && memorySessions.size === 0) {
    /* allow memory store */
  }
}

export async function startNegotiationSession(
  userId: string,
  opts: { flowSessionId?: string; clarificationSessionId?: string } = {}
) {
  requireMongoOrMemory();
  const sessionId = crypto.randomUUID();
  const state = createInitialState(sessionId, userId);

  const doc = {
    userId,
    simId: SIM_ID,
    status: "active",
    flowSessionId: opts.flowSessionId ?? null,
    clarificationSessionId: opts.clarificationSessionId ?? null,
    state
  };

  if (isMongoReady()) {
    const created = await NegotiationV2Session.create(doc);
    const id = created._id.toString();
    created.state.sessionId = id;
    await created.save();
    return {
      sessionId: id,
      simId: SIM_ID,
      round: state.round,
      maxRounds: state.maxRounds,
      trust: state.trust,
      npcMessage: getOpeningNpcMessage(),
      npcMood: "firm" as const,
      availableActions: [
        "probe_interests",
        "trade_scope_date",
        "facilitate_options_meeting",
        "concede_unilateral",
        "hardball",
        "walkaway"
      ],
      availableTradePackages: [],
      sessionComplete: false
    };
  }

  memorySessions.set(sessionId, { userId, state });
  return {
    sessionId,
    simId: SIM_ID,
    round: state.round,
    maxRounds: state.maxRounds,
    trust: state.trust,
    npcMessage: getOpeningNpcMessage(),
    npcMood: "firm" as const,
    availableActions: [
      "probe_interests",
      "trade_scope_date",
      "facilitate_options_meeting",
      "concede_unilateral",
      "hardball",
      "walkaway"
    ],
    availableTradePackages: [],
    sessionComplete: false
  };
}

async function loadSession(sessionId: string, userId: string): Promise<NegotiationSessionState> {
  if (isMongoReady()) {
    const doc = await NegotiationV2Session.findOne({ _id: sessionId, userId });
    if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, "Negotiation session not found");
    return doc.state as NegotiationSessionState;
  }

  const mem = memorySessions.get(sessionId);
  if (!mem || mem.userId !== userId) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Negotiation session not found");
  }
  return mem.state;
}

async function saveSession(
  sessionId: string,
  userId: string,
  state: NegotiationSessionState,
  result?: Record<string, unknown>
): Promise<void> {
  if (isMongoReady()) {
    await NegotiationV2Session.findOneAndUpdate(
      { _id: sessionId, userId },
      {
        state,
        status: state.status,
        ...(result ? { result } : {})
      }
    );
    return;
  }

  const mem = memorySessions.get(sessionId);
  if (mem) {
    mem.state = state;
    if (result) mem.result = result;
  }
}

export async function submitNegotiationAction(
  sessionId: string,
  userId: string,
  input: ActionInput
) {
  const state = await loadSession(sessionId, userId);
  if (state.status === "completed") {
    throw new ApiError(StatusCodes.CONFLICT, "Session already completed");
  }

  const outcome = applyNegotiationAction(structuredClone(state), input);

  let result: Record<string, unknown> | undefined;
  if (outcome.sessionComplete) {
    const scored = scoreNegotiationV2(outcome.state);
    result = {
      simId: SIM_ID,
      composite: scored.composite,
      success: scored.success,
      negotiation_band: scored.negotiationBand,
      dimension_subscores: scored.dimensionScores,
      sim_evidence_summary: scored.simEvidenceSummary,
      failure_reasons: scored.failureReasons,
      telemetry: scored.telemetry
    };
  }

  await saveSession(sessionId, userId, outcome.state, result);

  return {
    sessionId,
    simId: SIM_ID,
    round: outcome.state.round,
    maxRounds: outcome.state.maxRounds,
    trust: outcome.state.trust,
    trustSeries: outcome.state.trustSeries,
    probeCount: outcome.state.probeCount,
    batnaRevealed: outcome.state.batnaRevealed,
    npcMessage: outcome.npcMessage,
    npcMood: outcome.npcMood,
    availableActions: outcome.availableActions,
    availableTradePackages: outcome.availableTradePackages,
    sessionComplete: outcome.sessionComplete,
    result: result ?? null
  };
}

export async function completeNegotiationSession(sessionId: string, userId: string) {
  const state = await loadSession(sessionId, userId);
  if (state.status === "completed") {
    const existing = isMongoReady()
      ? await NegotiationV2Session.findOne({ _id: sessionId, userId }).lean()
      : null;
    if (existing?.result) return existing.result;
  }

  const finalState = structuredClone(state);
  finalState.status = "completed";
  finalState.completedAtMs = Date.now();

  const scored = scoreNegotiationV2(finalState);
  const result = {
    simId: SIM_ID,
    composite: scored.composite,
    success: scored.success,
    negotiation_band: scored.negotiationBand,
    dimension_subscores: scored.dimensionScores,
    sim_evidence_summary: scored.simEvidenceSummary,
    failure_reasons: scored.failureReasons,
    telemetry: scored.telemetry
  };

  await saveSession(sessionId, userId, finalState, result);
  return result;
}

export async function getNegotiationSession(sessionId: string, userId: string) {
  const state = await loadSession(sessionId, userId);
  const doc = isMongoReady()
    ? await NegotiationV2Session.findOne({ _id: sessionId, userId }).lean()
    : null;

  return {
    sessionId,
    simId: SIM_ID,
    status: state.status,
    round: state.round,
    maxRounds: state.maxRounds,
    trust: state.trust,
    trustSeries: state.trustSeries,
    probeCount: state.probeCount,
    batnaRevealed: state.batnaRevealed,
    result: doc?.result ?? memorySessions.get(sessionId)?.result ?? null
  };
}

export { scoreNegotiationV2 };
