import { StatusCodes } from "http-status-codes";
import { getSupabaseAdmin } from "../../config/supabase.js";
import { ApiError } from "../../utils/ApiError.js";
import { ONET_RATING_SCALES } from "../../constants/occupational.js";
import { scoresToProfileObject } from "../vector.util.js";
import { getActiveRelease } from "./release.service.js";
import { riasecObjectToArray, storedVectorToRiasecArray } from "./vectorMath.js";

/**
 * Aspirant vs occupation RIASEC profile + top required skills (IM) benchmark.
 * @param {object} scores - scoring.service output
 * @param {string} socCode
 */
export const benchmarkUserAgainstOccupation = async (scores, socCode) => {
  const release = await getActiveRelease();
  if (!release) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, "No active O*NET release");
  }

  const supabase = getSupabaseAdmin();
  const { data: occVec, error: vecErr } = await supabase
    .from("onet_occupation_vectors")
    .select("vector")
    .eq("release_id", release.id)
    .eq("soc_code", socCode)
    .eq("vector_type", "riasec")
    .maybeSingle();

  if (vecErr) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, vecErr.message);
  if (!occVec) throw new ApiError(StatusCodes.NOT_FOUND, "Occupation vector not found");

  const ria = scores?.personality?.riasec ?? {};
  const userArr = riasecObjectToArray(ria);
  const occArr = storedVectorToRiasecArray(occVec.vector);
  const dimensions = ["R", "I", "A", "S", "E", "C"].map((key, i) => {
    const userPct = Math.round((userArr[i] ?? 0) * 100);
    const occPct = Math.round((occArr[i] ?? 0) * 100);
    const gap = occPct - userPct;
    const readiness =
      occPct <= 0 ? 100 : Math.max(0, Math.min(100, Math.round((userPct / occPct) * 100)));
    return { dimension: key, userPct, occupationPct: occPct, gap, readinessPct: readiness };
  });

  const overallReadiness = Math.round(
    dimensions.reduce((s, d) => s + d.readinessPct, 0) / Math.max(1, dimensions.length)
  );

  const { data: topSkills, error: skErr } = await supabase
    .from("onet_occupation_ratings")
    .select("element_id, element_name, data_value")
    .eq("release_id", release.id)
    .eq("soc_code", socCode)
    .eq("scale_id", ONET_RATING_SCALES.IMPORTANCE)
    .order("data_value", { ascending: false })
    .limit(8);

  if (skErr) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, skErr.message);

  const profileObj = scoresToProfileObject(scores);
  const cognitiveAvg =
    ((profileObj.apt_logical ?? 0) + (profileObj.apt_numerical ?? 0) + (profileObj.apt_verbal ?? 0)) / 3;

  const skillBenchmarks = (topSkills ?? []).map((sk) => ({
    elementId: sk.element_id,
    elementName: sk.element_name,
    occupationImportance: Number(sk.data_value),
    aspirantSignal: Math.round(cognitiveAvg * 100) / 100,
    note: "Aspirant signal uses composite aptitude vs occupation skill importance (proxy until element-level assessment exists)."
  }));

  return {
    releaseId: release.id,
    versionLabel: release.versionLabel,
    socCode,
    overallReadinessPct: overallReadiness,
    riasecDimensions: dimensions,
    topRequiredSkills: skillBenchmarks
  };
};
