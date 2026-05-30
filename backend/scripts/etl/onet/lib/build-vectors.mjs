import { ONET_INTEREST_TO_RIASEC, OI_SCALE_MAX, VECTOR_TYPE } from "./constants.mjs";
import { finalizeProfileV1Vector } from "./profile-v1-mapping.mjs";

/**
 * RIASEC vectors from Interests.xlsx OI scale.
 * Normalization: value / OI_SCALE_MAX (O*NET OI typically 1–7).
 *
 * @param {Map<string, { elementName: string, value: number }[]>} interestsBySoc
 */
export const buildRiasecVectors = (interestsBySoc) => {
  const rows = [];
  for (const [socCode, items] of interestsBySoc.entries()) {
    const vector = {};
    for (const item of items) {
      const key = ONET_INTEREST_TO_RIASEC[item.elementName];
      if (!key) continue;
      vector[`ria_${key}`] = Math.min(1, Math.max(0, Number(item.value) / OI_SCALE_MAX));
    }
    if (Object.keys(vector).length >= 4) {
      rows.push({
        soc_code: socCode,
        vector_type: VECTOR_TYPE.RIASEC,
        vector
      });
    }
  }
  return rows;
};

/**
 * profile_v1 aligns with backend PROFILE_VECTOR_KEYS (17 dimensions).
 * - Aptitude + Big Five: IM ratings from Abilities/Knowledge/Skills/Work Styles (pattern match)
 * - RIASEC + motivation: derived from RIASEC vector
 *
 * @param {Map<string, { elementName: string, value: number }[]>} interestsBySoc
 * @param {Map<string, object>} profileAccum
 * @param {ReturnType<typeof buildRiasecVectors>} riasecRows
 */
export const buildProfileV1Vectors = (interestsBySoc, profileAccum, riasecRows) => {
  const riasecBySoc = new Map(riasecRows.map((r) => [r.soc_code, r.vector]));
  const rows = [];

  const allSocs = new Set([...interestsBySoc.keys(), ...profileAccum.keys(), ...riasecBySoc.keys()]);

  for (const socCode of allSocs) {
    const riasecVector =
      riasecBySoc.get(socCode) ??
      buildRiasecVectors(new Map([[socCode, interestsBySoc.get(socCode) ?? []]]))[0]?.vector ??
      {};

    const accumRow = profileAccum.get(socCode) ?? {};
    const vector = finalizeProfileV1Vector(riasecVector, accumRow);

    rows.push({
      soc_code: socCode,
      vector_type: VECTOR_TYPE.PROFILE_V1,
      vector
    });
  }

  return rows;
};

/**
 * Optional: flatten vectors for future pgvector embedding pipeline (text → embed).
 * @param {object} occupation - { title, description }
 */
export const buildEmbeddingSeedText = (occupation) => {
  const title = occupation.title ?? "";
  const desc = (occupation.description ?? "").slice(0, 2000);
  return `${title}\n${desc}`.trim();
};
