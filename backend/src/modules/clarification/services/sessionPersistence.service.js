import {
  createUserFlowSession,
  findUserFlowSession,
  getUserFlowSession,
  patchFlowPhase as patchFlowPhaseRepo
} from "../../../clarification/repositories/userFlowSession.repository.js";
import {
  findClarificationSessionByFlowId
} from "../../../clarification/repositories/clarificationSession.repository.js";

/**
 * @param {string} userId
 * @param {Record<string, unknown>} [intake]
 */
export async function createFlowSession(userId, intake = {}) {
  return createUserFlowSession(userId, intake);
}

/**
 * @param {string} flowSessionId
 * @param {string} userId
 */
export async function getFlowSession(flowSessionId, userId) {
  return getUserFlowSession(flowSessionId, userId);
}

/**
 * @param {string} flowSessionId
 * @param {string} userId
 * @param {{ phase: string; constructSnapshot?: Record<string, unknown>; telemetry?: Record<string, unknown>; validityFlags?: Record<string, unknown> }} patch
 */
export async function updateFlowSession(flowSessionId, userId, patch) {
  return patchFlowPhaseRepo(flowSessionId, userId, {
    phase: patch.phase,
    constructSnapshot: patch.constructSnapshot,
    telemetry: patch.telemetry,
    validityFlags: patch.validityFlags
  });
}

/**
 * @param {string} flowSessionId
 * @param {string} userId
 */
export async function getClarificationSessionByFlowId(flowSessionId, userId) {
  return findClarificationSessionByFlowId(flowSessionId, userId);
}

export { findUserFlowSession };
