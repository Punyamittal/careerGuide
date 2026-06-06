import type { ClarificationSimResultRow } from "../types/entities.js";
import { mapClarificationSimResult } from "../types/entities.js";
import { assertNoError, clarificationDb } from "./base.repository.js";

export async function upsertClarificationSimResult(input: {
  clarificationSessionId: string;
  userId: string;
  journeyId: string;
  simId: string;
  telemetry: Record<string, unknown>;
  compositeScore: number;
  dimensionScores: Record<string, number>;
  success: boolean;
  durationMs?: number | null;
}) {
  const row = {
    clarification_session_id: input.clarificationSessionId,
    user_id: input.userId,
    journey_id: input.journeyId,
    sim_id: input.simId,
    telemetry: input.telemetry,
    composite_score: input.compositeScore,
    dimension_scores: input.dimensionScores,
    success: input.success,
    duration_ms: input.durationMs ?? null
  };

  const { data, error } = await clarificationDb()
    .from("clarification_sim_results")
    .upsert(row, { onConflict: "clarification_session_id,sim_id" })
    .select("*")
    .single();

  assertNoError(error, "upsertClarificationSimResult");
  return mapClarificationSimResult(data as ClarificationSimResultRow);
}

export async function listClarificationSimResults(clarificationSessionId: string) {
  const { data, error } = await clarificationDb()
    .from("clarification_sim_results")
    .select("*")
    .eq("clarification_session_id", clarificationSessionId);

  assertNoError(error, "listClarificationSimResults");
  return (data ?? []).map((row: ClarificationSimResultRow) => mapClarificationSimResult(row));
}
