import type { NegotiationTelemetry } from "./types";

/** Build clarification `/clarify/sim/complete` telemetry payload from result. */
export function toClarificationSimPayload(
  result: {
    telemetry: NegotiationTelemetry;
    composite: number;
    dimension_subscores: Record<string, number>;
    success: boolean;
  },
  journeyId = "J2-NEG"
) {
  return {
    journeyId,
    simId: "SIM-NEGOTIATION-NPC-V2",
    telemetry: result.telemetry,
    compositeScore: result.composite,
    dimensionScores: result.dimension_subscores,
    success: result.success,
    durationMs: result.telemetry.duration_ms
  };
}
