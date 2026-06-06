import { clarificationError } from "../constants/errorCodes.js";
import { FUSION_V3 } from "../constants/clarification.constants.js";
import { getSimulationLibrary } from "../config/clarificationAssets.js";
import { loadQuestionBatch } from "./questionLoader.service.js";
import { scoreItemResponse } from "./itemScoring.service.js";
import { ClarificationSession } from "../models/ClarificationSession.model.js";
import { ClarificationResponse } from "../models/ClarificationResponse.model.js";
import { ClarificationSimResult } from "../models/ClarificationSimResult.model.js";
import * as sessionPersistence from "./sessionPersistence.service.js";

/**
 * @param {import("mongoose").Document} clarSession
 * @param {string} [requestedJourneyId]
 */
function resolveActiveJourney(clarSession, requestedJourneyId) {
  const assigned = clarSession.assignedJourneys ?? [];
  if (requestedJourneyId) {
    if (!assigned.includes(requestedJourneyId)) {
      throw clarificationError("INVALID_JOURNEY", { requestedJourneyId, assigned });
    }
    return requestedJourneyId;
  }

  for (const jid of assigned) {
    const progress = clarSession.journeyProgress?.get?.(jid) ?? clarSession.journeyProgress?.[jid];
    if (!progress || progress.status !== "completed") {
      return jid;
    }
  }

  return assigned[assigned.length - 1] ?? null;
}

/**
 * @param {import("mongoose").Document} clarSession
 * @param {string} journeyId
 */
function getJourneyProgress(clarSession, journeyId) {
  if (clarSession.journeyProgress instanceof Map) {
    return clarSession.journeyProgress.get(journeyId);
  }
  return clarSession.journeyProgress?.[journeyId];
}

/**
 * @param {import("mongoose").Document} clarSession
 * @param {string} journeyId
 * @param {Record<string, unknown>} patch
 */
async function patchJourneyProgress(clarSession, journeyId, patch) {
  const key = `journeyProgress.${journeyId}`;
  if (clarSession.journeyProgress instanceof Map) {
    const current = clarSession.journeyProgress.get(journeyId) ?? {};
    clarSession.journeyProgress.set(journeyId, { ...current, ...patch });
  } else {
    clarSession.set(key, { ...(getJourneyProgress(clarSession, journeyId) ?? {}), ...patch });
  }
  await clarSession.save();
}

/**
 * @param {string} flowSessionId
 * @param {string} userId
 * @param {{ journeyId?: string; batchSize?: number }} [opts]
 */
export async function routeClarificationNext(flowSessionId, userId, opts = {}) {
  const clarSession = await sessionPersistence.getClarificationSessionByFlowId(flowSessionId, userId);
  if (!clarSession) throw clarificationError("NOT_EVALUATED");
  if (clarSession.status === "finalized") throw clarificationError("ALREADY_FINALIZED");

  const journeyId = resolveActiveJourney(clarSession, opts.journeyId);
  if (!journeyId) {
    return { blockType: "complete", message: "All journeys completed" };
  }

  const progress = getJourneyProgress(clarSession, journeyId) ?? {};
  const journeyMeta = (clarSession.assignedJourneyMeta ?? []).find((j) => j.journeyId === journeyId);

  const needsSim =
    !progress.simCompleted &&
    journeyMeta?.simInjection?.length > 0 &&
    (progress.itemsAnswered ?? 0) >= Math.min(2, journeyMeta.itemsPlanned?.min ?? 4);

  if (needsSim) {
    const simLibrary = getSimulationLibrary();
    let simId = journeyMeta.simInjection[0];

    if (journeyMeta.simSubstitution?.U17 && clarSession.firedRules?.includes("U17")) {
      simId = journeyMeta.simSubstitution.U17[0] ?? simId;
    }

    const simConfig = simLibrary[simId] ?? simLibrary[simId.replace(/-/g, "_")];
    if (simConfig) {
      await patchJourneyProgress(clarSession, journeyId, { status: "active", simId });
      return {
        blockType: "simulation",
        journeyId,
        clarificationSessionId: clarSession._id.toString(),
        simConfig: {
          simId,
          ...simConfig,
          timeMultiplier: clarSession.accommodationSnapshot?.time_multiplier ?? 1.0
        }
      };
    }
  }

  const maxItems = journeyMeta?.itemsPlanned?.max ?? 12;
  if ((progress.itemsAnswered ?? 0) >= maxItems) {
    await patchJourneyProgress(clarSession, journeyId, { status: "completed", completedAt: new Date() });
    return routeClarificationNext(flowSessionId, userId, opts);
  }

  const batchSize = Math.min(opts.batchSize ?? 1, maxItems - (progress.itemsAnswered ?? 0));
  const items = await loadQuestionBatch({
    userId,
    journeyId,
    count: batchSize,
    excludeRecent: progress.recentItemIds ?? [],
    region: clarSession.accommodationSnapshot?.region
  });

  if (items.length === 0) {
    throw clarificationError("POOL_EXHAUSTED", { journeyId });
  }

  await patchJourneyProgress(clarSession, journeyId, { status: "active" });

  if (clarSession.status === "evaluating") {
    clarSession.status = "in_progress";
    await clarSession.save();
  }

  return {
    blockType: "items",
    journeyId,
    clarificationSessionId: clarSession._id.toString(),
    itemsRemaining: maxItems - (progress.itemsAnswered ?? 0),
    items: items.map((item) => ({
      itemId: item.item_id,
      questionType: item.question_type,
      stem: item.stem,
      options: shuffleOptions(item.options, item.item_id),
      optionOrder: null,
      metadata: {
        difficulty: item.difficulty,
        exposurePool: item.exposure_pool ?? item.journey
      }
    }))
  };
}

/**
 * @param {string[]} options
 * @param {string} seed
 */
function shuffleOptions(options, seed) {
  const arr = [...options];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * @param {string} flowSessionId
 * @param {string} userId
 * @param {Record<string, unknown>} payload
 */
export async function submitClarificationResponse(flowSessionId, userId, payload) {
  const clarSession = await sessionPersistence.getClarificationSessionByFlowId(flowSessionId, userId);
  if (!clarSession) throw clarificationError("NOT_EVALUATED");

  const scored = scoreItemResponse(payload.itemId, payload.selectedOption, payload);

  await ClarificationResponse.findOneAndUpdate(
    {
      clarificationSessionId: clarSession._id,
      journeyId: payload.journeyId,
      itemId: payload.itemId
    },
    {
      clarificationSessionId: clarSession._id,
      userId,
      journeyId: payload.journeyId,
      itemId: payload.itemId,
      questionType: scored.questionType,
      responseValue: { selectedOption: payload.selectedOption },
      responseCorrect: scored.correct,
      partialScore: scored.partialScore,
      responseTimeMs: payload.responseTimeMs ?? null,
      answerChangeCount: payload.answerChangeCount ?? 0,
      scoringRubric: scored.scoringRubric,
      clientSeq: payload.clientSeq ?? null
    },
    { upsert: true, new: true }
  );

  await sessionPersistence.recordItemExposure(userId, payload.itemId);

  const progress = getJourneyProgress(clarSession, payload.journeyId) ?? {};
  const recent = [...(progress.recentItemIds ?? []), payload.itemId].slice(-5);
  const itemsAnswered = (progress.itemsAnswered ?? 0) + 1;

  await patchJourneyProgress(clarSession, payload.journeyId, {
    itemsAnswered,
    recentItemIds: recent
  });

  const conf = computeJourneyConfidence(clarSession, payload.journeyId, scored.partialScore);

  return {
    accepted: true,
    partialScore: scored.partialScore,
    constructUpdates: scored.constructUpdates,
    journeyConfidence: conf,
    shouldContinue: itemsAnswered < (progress.itemsPlanned?.max ?? FUSION_V3.minItemsBeforeStop)
  };
}

/**
 * @param {import("mongoose").Document} clarSession
 * @param {string} journeyId
 * @param {number} latestScore
 */
function computeJourneyConfidence(clarSession, journeyId, latestScore) {
  const progress = getJourneyProgress(clarSession, journeyId) ?? {};
  const n = progress.itemsAnswered ?? 1;
  const prev = progress.constructConfidence?.get?.("aggregate") ?? 0.5;
  const next = prev + (latestScore - prev) / n;
  return { aggregate: Math.min(0.95, next) };
}

/**
 * @param {string} flowSessionId
 * @param {string} userId
 * @param {Record<string, unknown>} payload
 */
export async function submitSimComplete(flowSessionId, userId, payload) {
  const clarSession = await sessionPersistence.getClarificationSessionByFlowId(flowSessionId, userId);
  if (!clarSession) throw clarificationError("NOT_EVALUATED");

  const dimensionScores = payload.dimensionScores ?? scoreSimTelemetry(payload.simId, payload.telemetry);

  await ClarificationSimResult.findOneAndUpdate(
    { clarificationSessionId: clarSession._id, simId: payload.simId },
    {
      clarificationSessionId: clarSession._id,
      userId,
      journeyId: payload.journeyId,
      simId: payload.simId,
      telemetry: payload.telemetry,
      compositeScore: payload.compositeScore ?? dimensionScores.composite,
      dimensionScores,
      success: payload.success ?? (dimensionScores.composite ?? 0) >= 0.65,
      durationMs: payload.durationMs ?? null
    },
    { upsert: true, new: true }
  );

  await patchJourneyProgress(clarSession, payload.journeyId, {
    simCompleted: true,
    simId: payload.simId
  });

  return {
    compositeScore: dimensionScores.composite,
    dimensionScores,
    success: (dimensionScores.composite ?? 0) >= 0.65
  };
}

/**
 * @param {string} simId
 * @param {Record<string, unknown>} telemetry
 */
function scoreSimTelemetry(simId, telemetry) {
  if (simId.includes("NEGOTIATION")) {
    const probe = Number(telemetry.probe_count ?? 0);
    const trust = Number(telemetry.npc_trust_meter_end ?? telemetry.npc_trust_series?.at?.(-1) ?? 0.5);
    const jv = Number(telemetry.joint_value_score ?? 0.5);
    const composite = 0.25 * Math.min(1, probe) + 0.25 * jv + 0.2 * trust + 0.3 * (probe > 0 ? 1 : 0);
    return {
      composite,
      "NEG-INT": probe > 0 ? 0.8 : 0.3,
      "NEG-TRADE": jv,
      "NEG-REL": trust,
      "NEG-JV": jv
    };
  }

  if (simId.includes("FORMAT-LAB")) {
    const gain = Number(telemetry.rule_change_gain ?? 0);
    return { composite: Math.min(1, 0.5 + gain), "LRN-ADAPT": gain, "LRN-META": gain };
  }

  return { composite: 0.5 };
}

export { resolveActiveJourney, getJourneyProgress };
