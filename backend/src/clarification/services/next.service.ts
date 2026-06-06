import { CLARIFICATION_STATUS, FUSION_V3 } from "../constants/clarification.constants.js";
import { throwClarification } from "../errors/clarification.errors.js";
import type {
  ClarifyNextQueryDto,
  ClarifyNextResponseDto,
  JourneyMetaDto
} from "../dtos/clarify.dto.js";
import { getSimulationLibrary } from "../../modules/clarification/config/clarificationAssets.js";
import {
  findClarificationSessionByFlowId,
  patchJourneyProgress,
  updateClarificationSession
} from "../repositories/clarificationSession.repository.js";
import type { ClarificationSession, JourneyProgress } from "../types/entities.js";
import { loadQuestionBatch, shuffleOptions } from "./questionLoader.service.js";
import { objectIdToString } from "./flowMapper.service.js";

export function getJourneyProgress(
  clarSession: ClarificationSession,
  journeyId: string
): JourneyProgress {
  return clarSession.journeyProgress[journeyId] ?? {};
}

function resolveActiveJourney(
  clarSession: ClarificationSession,
  requestedJourneyId?: string
): string | null {
  const assigned = clarSession.assignedJourneys ?? [];

  if (requestedJourneyId) {
    if (!assigned.includes(requestedJourneyId)) {
      throwClarification("INVALID_JOURNEY", {
        requestedJourneyId,
        assigned
      });
    }
    return requestedJourneyId;
  }

  for (const journeyId of assigned) {
    const progress = getJourneyProgress(clarSession, journeyId);
    if (!progress || progress.status !== "completed") {
      return journeyId;
    }
  }

  return assigned[assigned.length - 1] ?? null;
}

export async function routeClarificationNext(
  flowSessionId: string,
  userId: string,
  opts: ClarifyNextQueryDto = {}
): Promise<ClarifyNextResponseDto> {
  let clarSession = await findClarificationSessionByFlowId(flowSessionId, userId);

  if (!clarSession) throwClarification("NOT_EVALUATED");
  if (clarSession.status === CLARIFICATION_STATUS.FINALIZED) {
    throwClarification("ALREADY_FINALIZED");
  }

  const journeyId = resolveActiveJourney(clarSession, opts.journeyId);
  if (!journeyId) {
    return { blockType: "complete", message: "All journeys completed" };
  }

  const progress = getJourneyProgress(clarSession, journeyId);
  const journeyMeta = (clarSession.assignedJourneyMeta ?? []).find(
    (meta) => meta.journeyId === journeyId
  );

  const needsSim =
    !progress.simCompleted &&
    (journeyMeta?.simInjection?.length ?? 0) > 0 &&
    (progress.itemsAnswered ?? 0) >= Math.min(2, journeyMeta?.itemsPlanned?.min ?? 4);

  if (needsSim && journeyMeta) {
    const simLibrary = getSimulationLibrary() as Record<string, Record<string, unknown>>;
    let simId = journeyMeta.simInjection[0];

    if (journeyMeta.simSubstitution?.U17 && clarSession.firedRules?.includes("U17")) {
      simId = journeyMeta.simSubstitution.U17[0] ?? simId;
    }

    const simConfig = simLibrary[simId] ?? simLibrary[simId.replace(/-/g, "_")];
    if (simConfig) {
      clarSession = await patchJourneyProgress(clarSession, journeyId, {
        status: "active",
        simId
      });
      return {
        blockType: "simulation",
        journeyId,
        clarificationSessionId: objectIdToString(clarSession.id),
        simConfig: {
          simId,
          ...simConfig,
          timeMultiplier: Number(clarSession.accommodationSnapshot?.time_multiplier ?? 1.0)
        }
      };
    }
  }

  const maxItems = journeyMeta?.itemsPlanned?.max ?? 12;
  if ((progress.itemsAnswered ?? 0) >= maxItems) {
    await patchJourneyProgress(clarSession, journeyId, {
      status: "completed",
      completedAt: new Date().toISOString()
    });
    return routeClarificationNext(flowSessionId, userId, opts);
  }

  const batchSize = Math.min(opts.batchSize ?? 1, maxItems - (progress.itemsAnswered ?? 0));

  const items = await loadQuestionBatch({
    userId,
    journeyId,
    count: batchSize,
    excludeRecent: progress.recentItemIds ?? [],
    region: String(clarSession.accommodationSnapshot?.region ?? "")
  });

  if (items.length === 0) {
    throwClarification("POOL_EXHAUSTED", { journeyId });
  }

  clarSession = await patchJourneyProgress(clarSession, journeyId, { status: "active" });

  if (clarSession.status === CLARIFICATION_STATUS.EVALUATING) {
    clarSession = await updateClarificationSession(clarSession.id, userId, {
      status: CLARIFICATION_STATUS.IN_PROGRESS
    });
  }

  return {
    blockType: "items",
    journeyId,
    clarificationSessionId: objectIdToString(clarSession.id),
    itemsRemaining: maxItems - (progress.itemsAnswered ?? 0),
    items: items.map((item) => ({
      itemId: item.item_id,
      questionType: item.question_type ?? "unknown",
      stem: item.stem ?? "",
      options: shuffleOptions(item.options ?? [], item.item_id),
      optionOrder: null,
      metadata: {
        difficulty: item.difficulty,
        exposurePool: item.exposure_pool ?? item.journey
      }
    }))
  };
}

export { resolveActiveJourney, FUSION_V3 };
export type { JourneyMetaDto };
