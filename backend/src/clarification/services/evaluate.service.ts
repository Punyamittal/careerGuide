import { API_CONTRACT_VERSION } from "../constants/clarification.constants.js";
import { evaluateAmbiguity } from "../engine/ambiguityEngine.js";
import type { ClarifyEvaluateResponseDto, JourneyMetaDto } from "../dtos/clarify.dto.js";
import { mapFlowToEngineInput, objectIdToString } from "./flowMapper.service.js";
import {
  createClarificationSession,
  getFlowSession,
  skipClarification
} from "./session.service.js";

export async function evaluateClarification(
  flowSessionId: string,
  userId: string
): Promise<ClarifyEvaluateResponseDto> {
  const flow = await getFlowSession(flowSessionId, userId);
  const engineInput = mapFlowToEngineInput(flow);
  const engineOutput = evaluateAmbiguity(engineInput);

  if (engineOutput.triggeredRules.length === 0) {
    await skipClarification(flowSessionId, userId);
    return {
      clarificationSessionId: null,
      firedRules: [],
      triggeredRules: [],
      journeys: [],
      maxJourneys: 0,
      extendedMode: false,
      priority: null,
      accommodation: {
        latency_penalty_disabled: Boolean(flow.accommodation?.latency_penalty_disabled),
        time_multiplier: Number(flow.accommodation?.time_multiplier ?? 1.0)
      },
      canSkip: true,
      skipped: true,
      explainability: engineOutput.explainability,
      version: API_CONTRACT_VERSION
    };
  }

  const journeys: JourneyMetaDto[] = engineOutput.journeysToRun.map((journey) => ({
    journeyId: journey.journeyId,
    name: journey.name,
    priority: journey.priority,
    forced: journey.forced,
    triggeredBy: journey.triggeredBy,
    itemsPlanned: journey.itemsPlanned,
    simInjection: journey.simInjection,
    simSubstitution: journey.simSubstitution ? { U17: journey.simSubstitution } : null
  }));

  const clar = await createClarificationSession(flowSessionId, userId, {
    firedRules: engineOutput.triggeredRules.map((rule) => rule.ruleId),
    journeys,
    maxJourneys: engineOutput.maxJourneys,
    accommodation: engineOutput.modifiers
  });

  const firedRules = engineOutput.triggeredRules.map((rule) => rule.ruleId);

  return {
    clarificationSessionId: objectIdToString(clar.id),
    firedRules,
    triggeredRules: engineOutput.triggeredRules.map((rule) => ({
      ruleId: rule.ruleId,
      name: rule.name,
      message: rule.message,
      priority: rule.priority,
      forced: rule.forced,
      journeys: rule.journeys[0] === "ALL" ? [] : [...rule.journeys]
    })),
    journeys,
    maxJourneys: engineOutput.maxJourneys,
    extendedMode: engineOutput.extendedMode,
    priority: engineOutput.priority,
    accommodation: {
      U15_active: firedRules.includes("U15"),
      latency_penalty_disabled: Boolean(
        engineOutput.modifiers.latency_penalty_disabled ??
          flow.accommodation?.latency_penalty_disabled
      ),
      time_multiplier: Number(
        engineOutput.modifiers.timed_sim_multiplier ??
          flow.accommodation?.time_multiplier ??
          1.0
      ),
      extended_time: Boolean(flow.accommodation?.extended_time)
    },
    canSkip: false,
    skipped: false,
    explainability: engineOutput.explainability,
    version: API_CONTRACT_VERSION
  };
}
