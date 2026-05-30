import { MATCH_WEIGHTS } from "../../constants/occupational.js";
import { cosineSimilarity } from "../vector.util.js";

const RIASEC_ORDER = ["R", "I", "A", "S", "E", "C"];

/**
 * @param {Record<string, number>} riasecObj - keys R,I,A,S,E,C (0-100 or 0-1)
 */
export const riasecObjectToArray = (riasecObj) =>
  RIASEC_ORDER.map((k) => {
    const v = Number(riasecObj?.[k] ?? 0);
    return v > 1 ? v / 100 : v;
  });

/**
 * @param {Record<string, number>} stored - keys ria_R etc or R
 */
export const storedVectorToRiasecArray = (stored) => {
  if (!stored || typeof stored !== "object") return RIASEC_ORDER.map(() => 0);
  const out = RIASEC_ORDER.map((k) => {
    const v = Number(stored[`ria_${k}`] ?? stored[k] ?? 0);
    return v > 1 ? v / 100 : v;
  });
  return out;
};

/**
 * @param {number[]} userArr
 * @param {number[]} occArr
 */
export const explainRiasecMatch = (userArr, occArr) => {
  const contributions = RIASEC_ORDER.map((key, i) => {
    const u = userArr[i] ?? 0;
    const o = occArr[i] ?? 0;
    const alignment = 1 - Math.abs(u - o);
    return {
      dimension: key,
      userValue: Math.round(u * 1000) / 10,
      occupationValue: Math.round(o * 1000) / 10,
      alignmentScore: Math.round(alignment * 1000) / 10
    };
  });
  contributions.sort((a, b) => b.alignmentScore - a.alignmentScore);
  return {
    topAligned: contributions.slice(0, 3),
    growthAreas: [...contributions].sort((a, b) => a.alignmentScore - b.alignmentScore).slice(0, 2)
  };
};

/**
 * @param {Record<string, number>} userProfile - PROFILE_VECTOR_KEYS map (0-1)
 * @param {Record<string, number>} occProfile
 */
export const profileMapsToArrays = (userProfile, occProfile, keys) => {
  const user = keys.map((k) => Number(userProfile[k] ?? 0));
  const occ = keys.map((k) => Number(occProfile[k] ?? 0));
  return { user, occ };
};

/**
 * Combined similarity with optional profile_v1 blend.
 * @param {{ riasec?: Record<string,number>, profile_v1?: Record<string,number> }} userVectors
 * @param {{ riasec?: Record<string,number>, profile_v1?: Record<string,number> }} occVectors
 * @param {string[]} profileKeys
 */
export const blendedOccupationSimilarity = (userVectors, occVectors, profileKeys) => {
  const userR = storedVectorToRiasecArray(userVectors.riasec ?? {});
  const occR = storedVectorToRiasecArray(occVectors.riasec ?? {});
  const riasecSim = cosineSimilarity(userR, occR);

  let profileSim = null;
  if (userVectors.profile_v1 && occVectors.profile_v1) {
    const { user, occ } = profileMapsToArrays(userVectors.profile_v1, occVectors.profile_v1, profileKeys);
    profileSim = cosineSimilarity(user, occ);
  }

  const hasProfile = profileSim !== null && Number.isFinite(profileSim);
  const wR = hasProfile ? MATCH_WEIGHTS.riasec : 1;
  const wP = hasProfile ? MATCH_WEIGHTS.profile_v1 : 0;
  const combined = hasProfile ? wR * riasecSim + wP * profileSim : riasecSim;

  return {
    combined: Math.min(1, Math.max(0, combined)),
    riasecSim,
    profileSim,
    explain: explainRiasecMatch(userR, occR)
  };
};

export const similarityToMatchScore = (sim) => Math.round(Math.min(1, Math.max(0, sim)) * 100);
