import * as sessionPersistence from "./sessionPersistence.service.js";
import { evaluateClarification } from "../../../clarification/services/evaluate.service.js";
import { finalizeClarificationSession } from "../../../clarification/services/finalize.service.js";
import { routeClarificationNext } from "../../../clarification/services/next.service.js";
import { submitClarificationResponse } from "../../../clarification/services/response.service.js";
import { submitSimComplete } from "../../../clarification/services/simComplete.service.js";

export { evaluateClarification, finalizeClarificationSession };

export { routeClarificationNext, submitClarificationResponse, submitSimComplete };

/**
 * @param {string} flowSessionId
 * @param {string} userId
 */
export async function getFlowState(flowSessionId, userId) {
  const flow = await sessionPersistence.getFlowSession(flowSessionId, userId);
  const clar = await sessionPersistence.getClarificationSessionByFlowId(flowSessionId, userId);

  return {
    flowSessionId: flow.id,
    currentPhase: flow.currentPhase,
    status: flow.status,
    constructSnapshot: flow.constructSnapshot ?? {},
    validityFlags: flow.validityFlags,
    accommodation: flow.accommodation,
    clarification: clar
      ? {
          clarificationSessionId: clar.id,
          status: clar.status,
          firedRules: clar.firedRules,
          assignedJourneys: clar.assignedJourneys
        }
      : null
  };
}

export { sessionPersistence };
