import { FUSION_V3 } from "../constants/clarification.constants.js";
import type {
  ClarifyResponseRequestDto,
  ClarifyResponseResultDto
} from "../dtos/clarify.dto.js";
import { patchJourneyProgress } from "../repositories/clarificationSession.repository.js";
import { upsertClarificationResponse } from "../repositories/clarificationResponse.repository.js";
import type { ClarificationSession, JourneyProgress } from "../types/entities.js";
import {
  assertClarificationBelongsToFlow,
  recordItemExposure
} from "./session.service.js";
import { scoreItemResponse } from "./itemScoring.service.js";
import { getJourneyProgress } from "./next.service.js";

function computeJourneyConfidence(
  progress: JourneyProgress,
  latestScore: number
): { aggregate: number } {
  const answered = progress.itemsAnswered ?? 1;
  const prev = progress.constructConfidence?.aggregate ?? 0.5;
  const next = prev + (latestScore - prev) / answered;
  return { aggregate: Math.min(0.95, next) };
}

export async function submitClarificationResponse(
  flowSessionId: string,
  userId: string,
  payload: ClarifyResponseRequestDto
): Promise<ClarifyResponseResultDto> {
  let clarSession = await assertClarificationBelongsToFlow(
    payload.clarificationSessionId,
    flowSessionId,
    userId
  );

  const scored = scoreItemResponse(payload.itemId, payload.selectedOption);

  await upsertClarificationResponse({
    clarificationSessionId: clarSession.id,
    userId,
    journeyId: payload.journeyId,
    itemId: payload.itemId,
    questionType: scored.questionType,
    responseValue: { selectedOption: payload.selectedOption },
    responseCorrect: scored.correct,
    partialScore: scored.partialScore,
    responseTimeMs: payload.responseTimeMs ?? null,
    answerChangeCount: payload.answerChangeCount ?? 0,
    scoringRubric: scored.scoringRubric ?? undefined,
    clientSeq: payload.clientSeq ?? null
  });

  await recordItemExposure(userId, payload.itemId);

  const progress = getJourneyProgress(clarSession, payload.journeyId);
  const recent = [...(progress.recentItemIds ?? []), payload.itemId].slice(-5);
  const itemsAnswered = (progress.itemsAnswered ?? 0) + 1;

  clarSession = await patchJourneyProgress(clarSession, payload.journeyId, {
    itemsAnswered,
    recentItemIds: recent
  });

  const journeyConfidence = computeJourneyConfidence(
    { ...progress, itemsAnswered },
    scored.partialScore
  );

  return {
    accepted: true,
    partialScore: scored.partialScore,
    constructUpdates: scored.constructUpdates,
    journeyConfidence,
    shouldContinue:
      itemsAnswered < (progress.itemsPlanned?.max ?? FUSION_V3.minItemsBeforeStop)
  };
}

export type { ClarificationSession };
