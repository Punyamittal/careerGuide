import { API_CONTRACT_VERSION, CLARIFICATION_STATUS } from "../constants/clarification.constants.js";
import { throwClarification } from "../errors/clarification.errors.js";
import type { ClarifyFinalizeResponseDto } from "../dtos/clarify.dto.js";
import {
  countClarificationResponses,
  findNegotiationSimResult
} from "../repositories/clarificationResponse.repository.js";
import { upsertLearnerProfileAfterClarification } from "../repositories/learnerProfile.repository.js";
import {
  finalizeClarification,
  getClarificationSessionByFlowId,
  getFlowSession
} from "./session.service.js";
import { buildClarEvidenceAndFuse } from "./fusion.service.js";

export async function finalizeClarificationSession(
  flowSessionId: string,
  userId: string
): Promise<ClarifyFinalizeResponseDto> {
  const flow = await getFlowSession(flowSessionId, userId);
  const clar = await getClarificationSessionByFlowId(flowSessionId, userId);

  if (!clar) throwClarification("NOT_EVALUATED");

  if (clar.status === CLARIFICATION_STATUS.SKIPPED) {
    return {
      constructScores: flow.constructSnapshot as ClarifyFinalizeResponseDto["constructScores"],
      validityBand:
        (flow.validityFlags?.validity_band as "high" | "interpret_with_caution") ?? "high",
      clarificationSummary: { skipped: true },
      blockedConstructs: [],
      nextPhase: "8",
      version: API_CONTRACT_VERSION
    };
  }

  const negSim = await findNegotiationSimResult(clar.id);

  const fusionResult = await buildClarEvidenceAndFuse(clar.id, flow.constructSnapshot, {
    firedRules: clar.firedRules,
    validityFlags: flow.validityFlags as Record<string, unknown>,
    negSimMissing: clar.firedRules.includes("U12") && !negSim
  });

  if (clar.firedRules.includes("U12") && !negSim) {
    fusionResult.blockedConstructs = ["NEG-SKILL"];
    if (fusionResult.constructScores["NEG-SKILL"]) {
      fusionResult.constructScores["NEG-SKILL"].blocked = true;
    }
  }

  await finalizeClarification(
    flowSessionId,
    userId,
    fusionResult as unknown as Record<string, unknown>
  );

  await upsertLearnerProfileAfterClarification(userId, {
    constructScores: fusionResult.constructScores as Record<string, unknown>,
    validityBand: fusionResult.validityBand,
    clarificationSummary: {
      rulesFired: clar.firedRules,
      journeysCompleted: clar.assignedJourneys,
      itemsAnswered: await countClarificationResponses(clar.id),
      boostApplied: fusionResult.boostApplied
    }
  });

  return {
    constructScores: fusionResult.constructScores,
    validityBand: fusionResult.validityBand,
    clarificationSummary: {
      rulesFired: clar.firedRules,
      journeysCompleted: clar.assignedJourneys,
      itemsAnswered: await countClarificationResponses(clar.id),
      boostApplied: fusionResult.boostApplied
    },
    blockedConstructs: fusionResult.blockedConstructs ?? [],
    nextPhase: "8",
    version: API_CONTRACT_VERSION
  };
}
