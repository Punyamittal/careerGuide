import type { ConstructEntry } from "../types/entities.js";
import type { AmbiguityEngineInput } from "../engine/ambiguityEngine.js";
import type { RuleEvaluatorInput } from "../engine/ruleEvaluator.js";

export interface FlowSessionLike {
  constructSnapshot?: Record<string, ConstructEntry>;
  telemetry?: Record<string, unknown>;
  validityFlags?: RuleEvaluatorInput["validityFlags"];
  intakeMeta?: RuleEvaluatorInput["intakeMeta"];
  accommodation?: RuleEvaluatorInput["accommodation"];
}

export function mapConstructSnapshot(snapshot: FlowSessionLike["constructSnapshot"]): {
  constructScores: Record<string, number>;
  confidenceScores: Record<string, number>;
} {
  const constructScores: Record<string, number> = {};
  const confidenceScores: Record<string, number> = {};

  for (const [key, value] of Object.entries(snapshot ?? {})) {
    constructScores[key] = Number(value?.score ?? 0);
    confidenceScores[key] = Number(value?.confidence ?? 1);
  }

  return { constructScores, confidenceScores };
}

export function mapFlowToEngineInput(flow: FlowSessionLike): AmbiguityEngineInput {
  const { constructScores, confidenceScores } = mapConstructSnapshot(flow.constructSnapshot);

  return {
    constructScores,
    confidenceScores,
    telemetry: (flow.telemetry ?? {}) as AmbiguityEngineInput["telemetry"],
    simulationResults: {},
    aptitudeResults: {},
    validityFlags: flow.validityFlags ?? {},
    intakeMeta: flow.intakeMeta,
    accommodation: flow.accommodation
  };
}

export function objectIdToString(id: string | { toString(): string }): string {
  return typeof id === "string" ? id : id.toString();
}

export type { ConstructEntry };
