export {
  AMBIGUITY_RULES,
  CONFIDENCE_FLOOR,
  JOURNEY_CONSTRUCT_OVERLAP,
  JOURNEY_DEFINITIONS,
  MULTI_TRIGGER_POLICY,
  getJourneyDefinition,
  getRuleDefinition,
  journeysOverlap,
  type AmbiguityRuleDefinition,
  type JourneyDefinition,
  type JourneyId,
  type MultiTriggerPolicy,
  type RuleId
} from "./ambiguityRules";

export {
  RULE_EVALUATORS,
  evaluateAllRules,
  evaluateRule,
  type AccommodationFlags,
  type AptitudeResults,
  type ExposureState,
  type IntakeMeta,
  type RuleEvaluationDetail,
  type RuleEvaluationResult,
  type RuleEvaluatorInput,
  type SimulationResultEntry,
  type SimulationResults,
  type TelemetrySnapshot,
  type ValidityFlags
} from "./ruleEvaluator";

export {
  JOURNEY_COUNT,
  RULE_COUNT,
  evaluateAmbiguity,
  type AmbiguityEngineInput,
  type AmbiguityEngineOptions,
  type AmbiguityEngineOutput,
  type ExplainabilityLog,
  type JourneyAssignment,
  type TriggeredRule
} from "./ambiguityEngine";

export * from "./api";
export * from "./types";
export { useClarificationFlow, useClarificationStore } from "./hooks";
