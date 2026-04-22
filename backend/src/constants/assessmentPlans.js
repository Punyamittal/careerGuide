import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "../../../frontend/data");
const bigFivePath = join(dataDir, "psychometric-v2-big-five.json");
const riasecPath = join(dataDir, "psychometric-v2-riasec.json");

const fallbackBigFiveCodes = [
  "BF_O_01",
  "BF_O_02",
  "BF_O_03",
  "BF_C_01",
  "BF_C_02",
  "BF_C_03",
  "BF_E_01",
  "BF_E_02",
  "BF_E_03",
  "BF_A_01",
  "BF_A_02",
  "BF_A_03",
  "BF_N_01",
  "BF_N_02",
  "BF_N_03"
];

const fallbackRiasecCodes = [
  "RIA_R_01",
  "RIA_R_02",
  "RIA_I_01",
  "RIA_I_02",
  "RIA_A_01",
  "RIA_A_02",
  "RIA_S_01",
  "RIA_S_02",
  "RIA_E_01",
  "RIA_E_02",
  "RIA_C_01",
  "RIA_C_02"
];

let bigFiveBank = [];
let riasecBank = [];

if (existsSync(bigFivePath)) {
  bigFiveBank = JSON.parse(readFileSync(bigFivePath, "utf8"));
} else {
  console.warn("[assessmentPlans] Missing psychometric-v2-big-five.json. Using fallback code list.");
}

if (existsSync(riasecPath)) {
  riasecBank = JSON.parse(readFileSync(riasecPath, "utf8"));
} else {
  console.warn("[assessmentPlans] Missing psychometric-v2-riasec.json. Using fallback code list.");
}

/** Fixed order — must match seed.mjs */
export const APTITUDE_CODES = [
  "APT_L_1",
  "APT_L_2",
  "APT_L_3",
  "APT_L_4",
  "APT_N_1",
  "APT_N_2",
  "APT_N_3",
  "APT_N_4",
  "APT_V_1",
  "APT_V_2",
  "APT_V_3",
  "APT_V_4"
];

export const BIG_FIVE_CODES = bigFiveBank.length
  ? bigFiveBank.map((row) => row.code)
  : fallbackBigFiveCodes;
export const RIASEC_CODES = riasecBank.length
  ? riasecBank.map((row) => row.code)
  : fallbackRiasecCodes;

export const MOTIVATION_CODES = [
  "MOT_01",
  "MOT_02",
  "MOT_03",
  "MOT_04",
  "MOT_05",
  "MOT_06",
  "MOT_07",
  "MOT_08",
  "MOT_09",
  "MOT_10",
  "MOT_11",
  "MOT_12",
  "MOT_13",
  "MOT_14",
  "MOT_15",
  "MOT_16",
  "MOT_17",
  "MOT_18",
  "MOT_19",
  "MOT_20",
  "MOT_21",
  "MOT_22",
  "MOT_23",
  "MOT_24",
  "MOT_25",
  "MOT_26",
  "MOT_27",
  "MOT_28"
];

export const WRITING_CODES = ["WRI_1"];

export const MASTER_CODE_ORDER = [
  ...APTITUDE_CODES,
  ...BIG_FIVE_CODES,
  ...RIASEC_CODES,
  ...MOTIVATION_CODES,
  ...WRITING_CODES
];

/** @type {Record<string, string[]>} */
export const ASSESSMENT_PLANS = {
  /** D — flagship: full redesigned bank */
  career_g11: [...MASTER_CODE_ORDER],
  /** C — stream choice: strong core, shorter personality/interests + motivation slice */
  stream_g910: [
    ...APTITUDE_CODES,
    ...BIG_FIVE_CODES.slice(0, 12),
    ...RIASEC_CODES.slice(0, 15),
    ...MOTIVATION_CODES.slice(0, 10),
    ...WRITING_CODES
  ],
  /** B — middle school snapshot */
  middle_g8: [
    ...APTITUDE_CODES,
    ...BIG_FIVE_CODES.slice(0, 14),
    ...RIASEC_CODES.slice(0, 14),
    ...MOTIVATION_CODES.slice(0, 6),
    ...WRITING_CODES
  ],
  /** A — early learner: short path */
  early_g5: [
    ...APTITUDE_CODES.slice(0, 4),
    ...BIG_FIVE_CODES.slice(0, 10),
    ...RIASEC_CODES.slice(0, 10),
    ...MOTIVATION_CODES.slice(0, 2),
    ...WRITING_CODES
  ]
};

export const ASSESSMENT_LABELS = {
  early_g5: "Early Learner Snapshot (Grade 5)",
  middle_g8: "Middle Learner Snapshot (Grade 8)",
  stream_g910: "Stream Suggestion (Grades 9–10)",
  career_g11: "Career Guidance (Grades 11–12 & undergrad)"
};

export const ASSESSMENT_KEYS = Object.keys(ASSESSMENT_PLANS);

/**
 * Which assessment_keys[] should include this external_code (for Supabase filtering).
 * @param {string} code
 */
export function assessmentKeysForCode(code) {
  const set = new Set();
  for (const [key, plan] of Object.entries(ASSESSMENT_PLANS)) {
    if (plan.includes(code)) set.add(key);
  }
  return [...set];
}
