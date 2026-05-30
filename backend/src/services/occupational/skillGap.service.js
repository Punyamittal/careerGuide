import { StatusCodes } from "http-status-codes";
import { getSupabaseAdmin } from "../../config/supabase.js";
import { ApiError } from "../../utils/ApiError.js";
import { ONET_RATING_SCALES } from "../../constants/occupational.js";
import { getActiveRelease } from "./release.service.js";
import { riasecObjectToArray, storedVectorToRiasecArray } from "./vectorMath.js";

const RIASEC_LABELS = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional"
};

/**
 * @param {object} scores
 * @param {string} socCode
 * @param {number} [maxGaps=8]
 */
export const analyzeSkillGapsForOccupation = async (scores, socCode, maxGaps = 8) => {
  const release = await getActiveRelease();
  if (!release) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, "No active O*NET release");
  }

  const supabase = getSupabaseAdmin();
  const gaps = [];

  const { data: occVec } = await supabase
    .from("onet_occupation_vectors")
    .select("vector")
    .eq("release_id", release.id)
    .eq("soc_code", socCode)
    .eq("vector_type", "riasec")
    .maybeSingle();

  if (occVec?.vector) {
    const ria = scores?.personality?.riasec ?? {};
    const userArr = riasecObjectToArray(ria);
    const occArr = storedVectorToRiasecArray(occVec.vector);
    ["R", "I", "A", "S", "E", "C"].forEach((key, i) => {
      const userPct = (userArr[i] ?? 0) * 100;
      const occPct = (occArr[i] ?? 0) * 100;
      const delta = occPct - userPct;
      if (delta >= 12 && occPct >= 40) {
        gaps.push({
          skill: `${RIASEC_LABELS[key]} interest alignment`,
          priority: delta >= 25 ? "high" : "medium",
          rationale: `This occupation emphasizes ${RIASEC_LABELS[key]} (${Math.round(occPct)}%); your profile is around ${Math.round(userPct)}%.`,
          source: "riasec",
          elementId: `interest.${key}`
        });
      }
    });
  }

  const apt = scores?.aptitude || {};
  if ((apt.numerical ?? 0) < 55) {
    gaps.push({
      skill: "Numerical reasoning",
      priority: "high",
      rationale: "Many analytical occupations require stronger numerical reasoning.",
      source: "aptitude"
    });
  }
  if ((apt.verbal ?? 0) < 55) {
    gaps.push({
      skill: "Verbal communication",
      priority: "medium",
      rationale: "Written and verbal clarity supports collaboration and documentation-heavy roles.",
      source: "aptitude"
    });
  }
  if ((apt.logical ?? 0) < 55) {
    gaps.push({
      skill: "Logical problem solving",
      priority: "medium",
      rationale: "Structured reasoning helps in complex occupational task profiles.",
      source: "aptitude"
    });
  }

  const { data: imSkills } = await supabase
    .from("onet_occupation_ratings")
    .select("element_id, element_name, data_value")
    .eq("release_id", release.id)
    .eq("soc_code", socCode)
    .eq("scale_id", ONET_RATING_SCALES.IMPORTANCE)
    .gte("data_value", 3.5)
    .order("data_value", { ascending: false })
    .limit(5);

  for (const sk of imSkills ?? []) {
    gaps.push({
      skill: sk.element_name || sk.element_id,
      priority: Number(sk.data_value) >= 4.2 ? "high" : "low",
      rationale: `Occupation rates this as important (IM ${Number(sk.data_value).toFixed(2)}). Build targeted practice or coursework.`,
      source: "onet_element",
      elementId: sk.element_id
    });
  }

  const seen = new Set();
  const deduped = [];
  for (const g of gaps) {
    const key = g.skill;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(g);
    if (deduped.length >= maxGaps) break;
  }

  return {
    releaseId: release.id,
    socCode,
    gaps: deduped
  };
};
