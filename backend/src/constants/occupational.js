import { PROFILE_VECTOR_KEYS, RIASEC_KEYS } from "./assessment.js";

/** O*NET interest element names → RIASEC keys */
export const ONET_INTEREST_TO_RIASEC = {
  Realistic: "R",
  Investigative: "I",
  Artistic: "A",
  Social: "S",
  Enterprising: "E",
  Conventional: "C"
};

export const VECTOR_TYPES = {
  RIASEC: "riasec",
  PROFILE_V1: "profile_v1"
};

/** Default blend when both vectors exist */
export const MATCH_WEIGHTS = {
  riasec: 0.65,
  profile_v1: 0.35
};

/** Scales imported for ratings (IM=importance, OI=occupational interests, LV=level) */
export const ONET_RATING_SCALES = {
  IMPORTANCE: "IM",
  LEVEL: "LV",
  OCCUPATIONAL_INTERESTS: "OI"
};

/** Domains for element classification during ETL */
export const ONET_ELEMENT_DOMAINS = {
  ABILITY: "ability",
  KNOWLEDGE: "knowledge",
  SKILL: "skill",
  INTEREST: "interest",
  WORK_ACTIVITY: "work_activity",
  WORK_CONTEXT: "work_context",
  WORK_STYLE: "work_style",
  WORK_VALUE: "work_value",
  OTHER: "other"
};

export const RIASEC_VECTOR_KEYS = RIASEC_KEYS.map((k) => `ria_${k}`);

export { PROFILE_VECTOR_KEYS, RIASEC_KEYS };
