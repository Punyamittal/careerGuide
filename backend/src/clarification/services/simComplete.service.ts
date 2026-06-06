import type {
  ClarifySimCompleteRequestDto,
  ClarifySimCompleteResponseDto
} from "../dtos/clarify.dto.js";
import { patchJourneyProgress } from "../repositories/clarificationSession.repository.js";
import { upsertClarificationSimResult } from "../repositories/clarificationSimResult.repository.js";
import { assertClarificationBelongsToFlow } from "./session.service.js";
import {
  createInitialState,
  scoreNegotiationV2,
  type NegotiationSessionState
} from "../../modules/negotiation-v2/engines/negotiation.engine.js";

function scoreSimTelemetry(
  simId: string,
  telemetry: Record<string, unknown>
): Record<string, number> {
  if (simId.includes("NEGOTIATION")) {
    const state = telemetryToNegotiationState(telemetry);
    const scored = scoreNegotiationV2(state);
    return {
      composite: scored.composite,
      ...scored.dimensionScores
    };
  }

  if (simId.includes("FORMAT-LAB")) {
    const gain = Number(telemetry.rule_change_gain ?? 0);
    return {
      composite: Math.min(1, 0.5 + gain),
      "LRN-ADAPT": gain,
      "LRN-META": gain
    };
  }

  return { composite: 0.5 };
}

function telemetryToNegotiationState(
  telemetry: Record<string, unknown>
): NegotiationSessionState {
  const trustSeries = Array.isArray(telemetry.npc_trust_series)
    ? (telemetry.npc_trust_series as number[])
    : [Number(telemetry.npc_trust_meter_end ?? 0.5)];

  const state = createInitialState("clar-replay", "clar-user");
  state.probeCount = Number(telemetry.probe_count ?? 0);
  state.firstProbeLatencyMs =
    telemetry.probe_latency_ms != null ? Number(telemetry.probe_latency_ms) : null;
  state.interestSummaryText =
    typeof telemetry.interest_summary_text === "string" ? telemetry.interest_summary_text : null;
  state.walkAway = telemetry.walk_away === true;
  state.round = Number(telemetry.round_count ?? 1);
  state.trustSeries = trustSeries;
  state.trust = trustSeries[trustSeries.length - 1] ?? 0.5;
  state.jointValueScore = Number(telemetry.joint_value_score ?? 0.5);
  state.batnaRevealed = telemetry.batna_referenced === true;
  state.creativeTrade = telemetry.creative_trade_flag === true;
  state.unilateralConcedeRound1 = telemetry.unilateral_concede_round1 === true;
  state.zeroSumOnly = telemetry.zero_sum_only === true;
  state.firstMove =
    typeof telemetry.first_move === "string"
      ? (telemetry.first_move as NegotiationSessionState["firstMove"])
      : null;
  state.offers = Array.isArray(telemetry.offers) ? (telemetry.offers as never) : [];
  state.concessions = Array.isArray(telemetry.concessions) ? (telemetry.concessions as never) : [];
  state.status = "completed";
  state.completedAtMs = Date.now();
  state.startedAtMs = Date.now() - Number(telemetry.duration_ms ?? 0);
  return state;
}

export async function submitSimComplete(
  flowSessionId: string,
  userId: string,
  payload: ClarifySimCompleteRequestDto
): Promise<ClarifySimCompleteResponseDto> {
  let clarSession = await assertClarificationBelongsToFlow(
    payload.clarificationSessionId,
    flowSessionId,
    userId
  );

  const dimensionScores =
    payload.dimensionScores ?? scoreSimTelemetry(payload.simId, payload.telemetry);
  const compositeScore = payload.compositeScore ?? dimensionScores.composite ?? 0.5;
  const success = payload.success ?? compositeScore >= 0.65;

  await upsertClarificationSimResult({
    clarificationSessionId: clarSession.id,
    userId,
    journeyId: payload.journeyId,
    simId: payload.simId,
    telemetry: payload.telemetry,
    compositeScore,
    dimensionScores,
    success,
    durationMs: payload.durationMs ?? null
  });

  await patchJourneyProgress(clarSession, payload.journeyId, {
    simCompleted: true,
    simId: payload.simId
  });

  return {
    compositeScore,
    dimensionScores,
    success
  };
}
