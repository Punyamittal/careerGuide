export const QUESTION_CATEGORIES = {
  APTITUDE_LOGICAL: "aptitude_logical",
  APTITUDE_NUMERICAL: "aptitude_numerical",
  APTITUDE_VERBAL: "aptitude_verbal",
  BIG_FIVE: "big5",
  RIASEC: "riasec",
  MOTIVATION: "motivation",
  WRITING: "writing"
};

export const QUESTION_CATEGORY_VALUES = Object.values(QUESTION_CATEGORIES);

export const BIG_FIVE_KEYS = ["O", "C", "E", "A", "N"];
export const RIASEC_KEYS = ["R", "I", "A", "S", "E", "C"];
export const MOTIVATION_KEYS = ["people", "data", "ideas", "things"];

/** Order used for career pattern vectors and cosine matching */
export const PROFILE_VECTOR_KEYS = [
  "apt_logical",
  "apt_numerical",
  "apt_verbal",
  ...BIG_FIVE_KEYS.map((k) => `bf_${k}`),
  ...RIASEC_KEYS.map((k) => `ria_${k}`),
  ...MOTIVATION_KEYS.map((k) => `mot_${k}`)
];

export const ATTEMPT_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  SCORED: "scored"
};
