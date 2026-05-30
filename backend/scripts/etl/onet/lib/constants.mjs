/** ETL-local constants (mirrors backend/src/constants/occupational.js) */

export const ONET_INTEREST_TO_RIASEC = {
  Realistic: "R",
  Investigative: "I",
  Artistic: "A",
  Social: "S",
  Enterprising: "E",
  Conventional: "C"
};

export const SCALE = {
  IMPORTANCE: "IM",
  LEVEL: "LV",
  OCCUPATIONAL_INTERESTS: "OI"
};

export const VECTOR_TYPE = {
  RIASEC: "riasec",
  PROFILE_V1: "profile_v1"
};

export const RATING_FILES_CORE = [
  { file: "Abilities.xlsx", domain: "ability" },
  { file: "Knowledge.xlsx", domain: "knowledge" },
  { file: "Skills.xlsx", domain: "skill" },
  { file: "Interests.xlsx", domain: "interest" },
  { file: "Work Styles.xlsx", domain: "work_style" }
];

export const RATING_FILES_EXTENDED = [
  { file: "Work Activities.xlsx", domain: "work_activity" },
  { file: "Work Context.xlsx", domain: "work_context" }
];

export const IM_SCALE_MAX = 5;
export const OI_SCALE_MAX = 7;
export const LV_SCALE_MAX = 7;

export const PROFILE_VECTOR_KEYS = [
  "apt_logical",
  "apt_numerical",
  "apt_verbal",
  "bf_O",
  "bf_C",
  "bf_E",
  "bf_A",
  "bf_N",
  "ria_R",
  "ria_I",
  "ria_A",
  "ria_S",
  "ria_E",
  "ria_C",
  "mot_people",
  "mot_data",
  "mot_ideas",
  "mot_things"
];
