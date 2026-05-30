import { getSupabaseAdmin } from "../../config/supabase.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { getActiveRelease } from "./release.service.js";

/**
 * @param {string} releaseId
 * @param {string} q
 * @param {{ limit?: number, offset?: number }} opts
 */
export const searchOccupations = async (releaseId, q, opts = {}) => {
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
  const offset = Math.max(0, opts.offset ?? 0);
  const supabase = getSupabaseAdmin();
  const term = String(q || "").trim();

  if (!term) {
    const { data, error, count } = await supabase
      .from("onet_occupations")
      .select("soc_code, title, description, job_zone", { count: "exact" })
      .eq("release_id", releaseId)
      .order("title")
      .range(offset, offset + limit - 1);
    if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    return { items: data ?? [], total: count ?? 0, limit, offset };
  }

  const { data: occHits, error: occErr } = await supabase
    .from("onet_occupations")
    .select("soc_code, title, description, job_zone")
    .eq("release_id", releaseId)
    .ilike("title", `%${term}%`)
    .limit(limit);

  if (occErr) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, occErr.message);

  const { data: altHits, error: altErr } = await supabase
    .from("onet_alternate_titles")
    .select("soc_code, title")
    .eq("release_id", releaseId)
    .ilike("title", `%${term}%`)
    .limit(limit);

  if (altErr) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, altErr.message);

  const bySoc = new Map();
  for (const row of occHits ?? []) {
    bySoc.set(row.soc_code, { ...row, matchedVia: "title" });
  }
  for (const row of altHits ?? []) {
    if (!bySoc.has(row.soc_code)) {
      bySoc.set(row.soc_code, {
        soc_code: row.soc_code,
        title: row.title,
        matchedVia: "alternate_title"
      });
    }
  }

  const items = [...bySoc.values()].slice(0, limit);
  return { items, total: items.length, limit, offset: 0 };
};

export const getOccupationBySoc = async (releaseId, socCode) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("onet_occupations")
    .select("soc_code, title, description, job_zone")
    .eq("release_id", releaseId)
    .eq("soc_code", socCode)
    .maybeSingle();

  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  if (!data) throw new ApiError(StatusCodes.NOT_FOUND, "Occupation not found");
  return data;
};

export const listOccupationsPaginated = async (opts = {}) => {
  const release = await getActiveRelease();
  if (!release) {
    return { release: null, items: [], total: 0, limit: opts.limit ?? 20, offset: opts.offset ?? 0 };
  }
  return {
    release,
    ...(await searchOccupations(release.id, opts.q ?? "", opts))
  };
};
