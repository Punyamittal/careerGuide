import { getSupabaseAdmin } from "../../config/supabase.js";
import { log } from "../../utils/logger.js";

/**
 * Persist occupation matches snapshot (idempotent per attempt).
 * @param {string} attemptId
 * @param {string} releaseId
 * @param {Array<{ socCode: string, title: string, matchScore: number, confidenceScore?: number, explanation?: object }>} matches
 */
export const snapshotAttemptOccupationMatches = async (attemptId, releaseId, matches) => {
  if (!matches?.length) return [];

  const supabase = getSupabaseAdmin();

  const { error: delErr } = await supabase
    .from("attempt_occupation_matches")
    .delete()
    .eq("attempt_id", attemptId);

  if (delErr && !/attempt_occupation_matches|does not exist|schema cache|PGRST/i.test(String(delErr.message || ""))) {
    log("warn", "snapshot_occupation_delete_failed", { attemptId, message: delErr.message });
    return [];
  }

  const rows = matches.map((m, index) => ({
    attempt_id: attemptId,
    release_id: releaseId,
    soc_code: m.socCode,
    occupation_title: m.title,
    rank: index + 1,
    match_score: m.matchScore,
    confidence_score: m.confidenceScore ?? m.matchScore,
    explanation: m.explanation ?? {}
  }));

  const { data, error } = await supabase.from("attempt_occupation_matches").insert(rows).select("*");

  if (error && !/attempt_occupation_matches|does not exist|schema cache|PGRST/i.test(String(error.message || ""))) {
    log("warn", "snapshot_occupation_insert_failed", { attemptId, message: error.message });
    return [];
  }

  return (data ?? []).map((r) => ({
    socCode: r.soc_code,
    title: r.occupation_title,
    rank: r.rank,
    matchScore: Number(r.match_score),
    confidenceScore: Number(r.confidence_score),
    explanation: r.explanation
  }));
};

/**
 * @param {string} attemptId
 */
export const getAttemptOccupationMatches = async (attemptId) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("attempt_occupation_matches")
    .select("*")
    .eq("attempt_id", attemptId)
    .order("rank", { ascending: true });

  if (error && !/attempt_occupation_matches|does not exist|schema cache|PGRST/i.test(String(error.message || ""))) {
    throw new Error(error.message);
  }

  return (data ?? []).map((r) => ({
    socCode: r.soc_code,
    title: r.occupation_title,
    rank: r.rank,
    matchScore: Number(r.match_score),
    confidenceScore: Number(r.confidence_score),
    explanation: r.explanation,
    releaseId: r.release_id
  }));
};
