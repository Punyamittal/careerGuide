import { PROFILE_VECTOR_KEYS } from "../../constants/occupational.js";
import { scoresToProfileObject } from "../vector.util.js";
import { getSupabaseAdmin } from "../../config/supabase.js";
import { env } from "../../config/env.js";
import { getActiveRelease, isOccupationalDataAvailable } from "./release.service.js";
import {
  blendedOccupationSimilarity,
  riasecObjectToArray,
  similarityToMatchScore,
  storedVectorToRiasecArray
} from "./vectorMath.js";

let vectorCache = null;
let vectorCacheReleaseId = null;
let vectorCacheAt = 0;

const loadOccupationVectors = async (releaseId) => {
  const ttl = env.occupational.catalogCacheTtlMs;
  if (vectorCache && vectorCacheReleaseId === releaseId && Date.now() - vectorCacheAt < ttl) {
    return vectorCache;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("onet_occupation_vectors")
    .select("soc_code, vector_type, vector")
    .eq("release_id", releaseId);

  if (error) throw new Error(error.message);

  const bySoc = new Map();
  for (const row of data ?? []) {
    if (!bySoc.has(row.soc_code)) {
      bySoc.set(row.soc_code, { socCode: row.soc_code, vectors: {} });
    }
    bySoc.get(row.soc_code).vectors[row.vector_type] = row.vector;
  }

  const { data: occRows } = await supabase
    .from("onet_occupations")
    .select("soc_code, title, job_zone")
    .eq("release_id", releaseId);

  for (const occ of occRows ?? []) {
    const entry = bySoc.get(occ.soc_code);
    if (entry) {
      entry.title = occ.title;
      entry.jobZone = occ.job_zone;
    }
  }

  vectorCache = [...bySoc.values()].filter((e) => e.vectors?.riasec);
  vectorCacheReleaseId = releaseId;
  vectorCacheAt = Date.now();
  return vectorCache;
};

export const clearOccupationVectorCache = () => {
  vectorCache = null;
  vectorCacheReleaseId = null;
  vectorCacheAt = 0;
};

/**
 * @param {object} scores - scoring.service output
 * @param {number} [limit]
 */
export const matchOccupationsFromScores = async (scores, limit = env.occupational.defaultMatchLimit) => {
  if (!env.occupational.matchingEnabled) {
    return { release: null, matches: [], enabled: false };
  }

  const available = await isOccupationalDataAvailable();
  if (!available) {
    return { release: null, matches: [], enabled: true, reason: "no_active_release_data" };
  }

  const release = await getActiveRelease();
  if (!release) {
    return { release: null, matches: [], enabled: true, reason: "no_active_release" };
  }

  const profileObj = scoresToProfileObject(scores);
  const ria = scores?.personality?.riasec ?? {};
  const userVectors = {
    riasec: Object.fromEntries(
      ["R", "I", "A", "S", "E", "C"].map((k) => [`ria_${k}`, (Number(ria[k] ?? 0) > 1 ? Number(ria[k]) / 100 : Number(ria[k] ?? 0))])
    ),
    profile_v1: profileObj
  };

  const occupations = await loadOccupationVectors(release.id);
  const ranked = [];

  for (const occ of occupations) {
    const result = blendedOccupationSimilarity(userVectors, occ.vectors, PROFILE_VECTOR_KEYS);
    const matchScore = similarityToMatchScore(result.combined);
    ranked.push({
      socCode: occ.socCode,
      title: occ.title ?? occ.socCode,
      jobZone: occ.jobZone ?? null,
      matchScore,
      confidenceScore: Math.round(matchScore * 10) / 10,
      explanation: {
        riasecSimilarity: Math.round((result.riasecSim ?? 0) * 1000) / 10,
        profileSimilarity:
          result.profileSim !== null ? Math.round(result.profileSim * 1000) / 10 : null,
        ...result.explain
      }
    });
  }

  ranked.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return (a.title || "").localeCompare(b.title || "");
  });

  return {
    release,
    matches: ranked.slice(0, limit),
    enabled: true,
    userRiasecPreview: riasecObjectToArray(ria)
  };
};
