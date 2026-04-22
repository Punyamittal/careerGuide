import { getSupabaseAdmin } from "../config/supabase.js";
import { cosineSimilarity, mapToVectorArray, scoresToProfileObject } from "./vector.util.js";

/**
 * Cosine similarity in [0,1] → matchScore (0–100 int) and confidenceScore (0–100, one decimal).
 * confidenceScore here reflects vector alignment strength (same source as match quality).
 */
function similarityToScores(sim) {
  const s = Math.min(1, Math.max(0, Number(sim) || 0));
  return {
    matchScore: Math.round(s * 100),
    confidenceScore: Math.round(s * 1000) / 10,
    /** @deprecated use confidenceScore */
    confidence: Math.round(s * 1000) / 10
  };
}

/**
 * Stable ranking: matchScore desc, then title, then id.
 * @param {object} scores - output of scoring.service
 * @param {number} [limit=10]
 */
export const matchCareers = async (scores, limit = 10) => {
  const profileObj = scoresToProfileObject(scores);
  const userNorm = mapToVectorArray(profileObj);

  const supabase = getSupabaseAdmin();
  const { data: rows, error } = await supabase.from("career_patterns").select("*").eq("active", true);

  if (error) throw new Error(error.message);

  const ranked = (rows ?? []).map((p) => {
    const vecMap = p.vector && typeof p.vector === "object" ? p.vector : {};
    const patVec = mapToVectorArray(vecMap);
    const sim = cosineSimilarity(userNorm, patVec);
    const { matchScore, confidenceScore, confidence } = similarityToScores(sim);
    return {
      careerPatternId: p.id,
      title: p.title,
      slug: p.slug,
      matchScore,
      confidenceScore,
      confidence
    };
  });

  ranked.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    const ta = a.title || "";
    const tb = b.title || "";
    if (ta !== tb) return ta.localeCompare(tb);
    return String(a.careerPatternId).localeCompare(String(b.careerPatternId));
  });

  return ranked.slice(0, limit);
};
