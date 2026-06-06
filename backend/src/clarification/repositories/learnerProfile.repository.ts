import { assertNoError, clarificationDb } from "./base.repository.js";

export async function upsertLearnerProfileAfterClarification(
  userId: string,
  input: {
    constructScores: Record<string, unknown>;
    validityBand: string;
    clarificationSummary: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await clarificationDb()
    .from("learner_mbs_profile")
    .upsert(
      {
        user_id: userId,
        construct_scores: input.constructScores,
        validity_band: input.validityBand,
        clarification_summary: input.clarificationSummary,
        source_summary: {
          clarification_v2: true,
          finalized_at: new Date().toISOString()
        }
      },
      { onConflict: "user_id" }
    );

  assertNoError(error, "upsertLearnerProfileAfterClarification");
}
