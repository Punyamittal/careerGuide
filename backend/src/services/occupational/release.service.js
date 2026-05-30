import { getSupabaseAdmin } from "../../config/supabase.js";
import { env } from "../../config/env.js";

let cachedRelease = null;
let cachedAt = 0;

/**
 * Resolves the active O*NET release (env override or DB flag).
 * @returns {Promise<{ id: string, versionLabel: string } | null>}
 */
export const getActiveRelease = async () => {
  const ttl = env.occupational.catalogCacheTtlMs;
  const now = Date.now();
  if (cachedRelease && now - cachedAt < ttl) {
    return cachedRelease;
  }

  const supabase = getSupabaseAdmin();
  const forcedId = env.occupational.activeReleaseId;

  if (forcedId) {
    const { data, error } = await supabase
      .from("onet_releases")
      .select("id, version_label")
      .eq("id", forcedId)
      .maybeSingle();
    if (error || !data) return null;
    cachedRelease = { id: data.id, versionLabel: data.version_label };
    cachedAt = now;
    return cachedRelease;
  }

  const { data, error } = await supabase
    .from("onet_releases")
    .select("id, version_label")
    .eq("is_active", true)
    .order("imported_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  cachedRelease = { id: data.id, versionLabel: data.version_label };
  cachedAt = now;
  return cachedRelease;
};

export const clearReleaseCache = () => {
  cachedRelease = null;
  cachedAt = 0;
};

export const isOccupationalDataAvailable = async () => {
  const release = await getActiveRelease();
  if (!release) return false;
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("onet_occupation_vectors")
    .select("*", { count: "exact", head: true })
    .eq("release_id", release.id)
    .eq("vector_type", "riasec");
  return !error && (count ?? 0) > 0;
};
