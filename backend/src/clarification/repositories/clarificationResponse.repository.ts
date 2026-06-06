import type { ClarificationResponseRow } from "../types/entities.js";
import { mapClarificationResponse } from "../types/entities.js";
import { assertNoError, clarificationDb } from "./base.repository.js";

export async function upsertClarificationResponse(input: {
  clarificationSessionId: string;
  userId: string;
  journeyId: string;
  itemId: string;
  itemVersion?: number;
  questionType: string;
  responseValue: Record<string, unknown>;
  responseCorrect: boolean | null;
  partialScore: number;
  responseTimeMs?: number | null;
  answerChangeCount?: number;
  scoringRubric?: string;
  clientSeq?: number | null;
}) {
  const row = {
    clarification_session_id: input.clarificationSessionId,
    user_id: input.userId,
    journey_id: input.journeyId,
    item_id: input.itemId,
    item_version: input.itemVersion ?? 2,
    question_type: input.questionType,
    response_value: input.responseValue,
    response_correct: input.responseCorrect,
    partial_score: input.partialScore,
    response_time_ms: input.responseTimeMs ?? null,
    answer_change_count: input.answerChangeCount ?? 0,
    scoring_rubric: input.scoringRubric ?? null,
    client_seq: input.clientSeq ?? null
  };

  const { data, error } = await clarificationDb()
    .from("clarification_responses")
    .upsert(row, { onConflict: "clarification_session_id,journey_id,item_id" })
    .select("*")
    .single();

  assertNoError(error, "upsertClarificationResponse");
  return mapClarificationResponse(data as ClarificationResponseRow);
}

export async function countClarificationResponses(
  clarificationSessionId: string
): Promise<number> {
  const { count, error } = await clarificationDb()
    .from("clarification_responses")
    .select("id", { count: "exact", head: true })
    .eq("clarification_session_id", clarificationSessionId);

  assertNoError(error, "countClarificationResponses");
  return count ?? 0;
}

export async function listClarificationResponses(clarificationSessionId: string) {
  const { data, error } = await clarificationDb()
    .from("clarification_responses")
    .select("*")
    .eq("clarification_session_id", clarificationSessionId);

  assertNoError(error, "listClarificationResponses");
  return (data ?? []).map((row: ClarificationResponseRow) => mapClarificationResponse(row));
}

export async function findNegotiationSimResult(clarificationSessionId: string) {
  const { data, error } = await clarificationDb()
    .from("clarification_sim_results")
    .select("*")
    .eq("clarification_session_id", clarificationSessionId)
    .ilike("sim_id", "%NEGOTIATION%")
    .maybeSingle();

  assertNoError(error, "findNegotiationSimResult");
  return data;
}
