import {
  CLARIFICATION_STATUS,
  FLOW_ID_USER_6,
  FLOW_STATUS
} from "../constants/clarification.constants.js";
import { throwClarification } from "../errors/clarification.errors.js";
import type { JourneyMetaDto } from "../dtos/clarify.dto.js";
import {
  createClarificationSessionRecord,
  findClarificationSessionByFlowId,
  findClarificationSessionById,
  finalizeClarificationSessionRecord,
  skipClarificationFlow
} from "../repositories/clarificationSession.repository.js";
import { incrementItemExposure } from "../repositories/clarificationItemExposure.repository.js";
import {
  getUserFlowSession,
  updateUserFlowSession
} from "../repositories/userFlowSession.repository.js";

export interface CreateClarificationPayload {
  firedRules: string[];
  journeys: JourneyMetaDto[];
  maxJourneys: number;
  accommodation: Record<string, unknown>;
}

export async function getFlowSession(flowSessionId: string, userId: string) {
  return getUserFlowSession(flowSessionId, userId);
}

export async function getClarificationSessionByFlowId(flowSessionId: string, userId: string) {
  return findClarificationSessionByFlowId(flowSessionId, userId);
}

export async function getClarificationSessionById(
  clarificationSessionId: string,
  userId: string
) {
  const session = await findClarificationSessionById(clarificationSessionId, userId);
  if (!session) throwClarification("NOT_EVALUATED", { clarificationSessionId });
  return session;
}

export async function assertClarificationBelongsToFlow(
  clarificationSessionId: string,
  flowSessionId: string,
  userId: string
) {
  const clar = await getClarificationSessionById(clarificationSessionId, userId);
  if (clar.flowSessionId !== flowSessionId) {
    throwClarification("SESSION_MISMATCH", { clarificationSessionId, flowSessionId });
  }
  return clar;
}

export async function createClarificationSession(
  flowSessionId: string,
  userId: string,
  evaluation: CreateClarificationPayload
) {
  const flow = await getFlowSession(flowSessionId, userId);

  if (flow.currentPhase !== "7" && flow.currentPhase !== "7.5") {
    const phaseNum = Number(flow.currentPhase);
    if (Number.isNaN(phaseNum) || phaseNum < 7) {
      throwClarification("PHASE7_INCOMPLETE", { currentPhase: flow.currentPhase });
    }
  }

  return createClarificationSessionRecord({
    flowSessionId,
    userId,
    firedRules: evaluation.firedRules,
    journeys: evaluation.journeys,
    maxJourneys: evaluation.maxJourneys,
    accommodationSnapshot: {
      ...flow.accommodation,
      region: flow.intakeMeta?.region,
      ...evaluation.accommodation
    }
  });
}

export async function skipClarification(
  flowSessionId: string,
  userId: string,
  reason = "no_rules_fired"
) {
  await skipClarificationFlow(flowSessionId, userId, reason);
  return getFlowSession(flowSessionId, userId);
}

export async function recordItemExposure(userId: string, itemId: string) {
  await incrementItemExposure(userId, itemId);
}

export async function finalizeClarification(
  flowSessionId: string,
  userId: string,
  fusionResult: Record<string, unknown>
) {
  const { clar, flowConstructSnapshot } = await finalizeClarificationSessionRecord(
    flowSessionId,
    userId,
    fusionResult
  );

  return {
    clar,
    flow: {
      ...((await getFlowSession(flowSessionId, userId)) ?? {}),
      constructSnapshot: flowConstructSnapshot,
      currentPhase: "8",
      status: FLOW_STATUS.CLARIFICATION
    }
  };
}

export { FLOW_ID_USER_6, CLARIFICATION_STATUS };
