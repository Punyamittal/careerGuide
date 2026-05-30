import { StatusCodes } from "http-status-codes";
import { getSupabaseAdmin } from "../../config/supabase.js";
import { ApiError } from "../../utils/ApiError.js";
import { getActiveRelease } from "./release.service.js";

/**
 * @param {string} socCode
 * @param {number} [limit=10]
 */
export const getRelatedOccupations = async (socCode, limit = 10) => {
  const release = await getActiveRelease();
  if (!release) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, "No active O*NET release");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("onet_related_occupations")
    .select("related_soc_code, related_title, relatedness_tier, match_index")
    .eq("release_id", release.id)
    .eq("soc_code", socCode)
    .order("match_index", { ascending: true })
    .limit(limit);

  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);

  return {
    releaseId: release.id,
    socCode,
    related: (data ?? []).map((r) => ({
      socCode: r.related_soc_code,
      title: r.related_title,
      tier: r.relatedness_tier,
      index: r.match_index
    }))
  };
};
