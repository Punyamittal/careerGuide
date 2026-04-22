import { QUESTION_CATEGORIES } from "../constants/assessment.js";
import {
  ASSESSMENT_PLANS,
  APTITUDE_CODES,
  BIG_FIVE_CODES,
  MASTER_CODE_ORDER,
  MOTIVATION_CODES,
  RIASEC_CODES,
  WRITING_CODES
} from "../constants/assessmentPlans.js";

const sortByOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

/**
 * When questions were seeded without `external_code`, the adaptive engine still needs
 * stable keys (APT_L_1, BF_O_01, RIA_R_01, MOT_01, …). Mirrors seed.mjs ordering; stems need not include codes.
 *
 * @param {string} assessmentKey
 * @param {object[]} shapedQuestions - output of mapQuestionRow + shapeQuestionForClient
 * @param {Record<string, object>} existingByCode - already keyed by DB external_code
 * @returns {Record<string, object>} merged map including hydrated entries
 */
export function hydrateQuestionCodes(assessmentKey, shapedQuestions, existingByCode = {}) {
  const plan = ASSESSMENT_PLANS[assessmentKey] ?? MASTER_CODE_ORDER;
  const need = new Set(plan);
  const byCode = { ...existingByCode };

  const logical = shapedQuestions
    .filter((q) => q.category === QUESTION_CATEGORIES.APTITUDE_LOGICAL)
    .sort(sortByOrder);
  const numerical = shapedQuestions
    .filter((q) => q.category === QUESTION_CATEGORIES.APTITUDE_NUMERICAL)
    .sort(sortByOrder);
  const verbal = shapedQuestions
    .filter((q) => q.category === QUESTION_CATEGORIES.APTITUDE_VERBAL)
    .sort(sortByOrder);
  const big5 = shapedQuestions
    .filter((q) => q.category === QUESTION_CATEGORIES.BIG_FIVE)
    .sort(sortByOrder);
  const riasec = shapedQuestions
    .filter((q) => q.category === QUESTION_CATEGORIES.RIASEC)
    .sort(sortByOrder);
  const motivation = shapedQuestions
    .filter((q) => q.category === QUESTION_CATEGORIES.MOTIVATION)
    .sort(sortByOrder);
  const writing = shapedQuestions
    .filter((q) => q.category === QUESTION_CATEGORIES.WRITING)
    .sort(sortByOrder);

  const put = (code, q) => {
    if (!need.has(code) || !q || byCode[code]) return;
    byCode[code] = { ...q, externalCode: code };
  };

  const logicalCodes = APTITUDE_CODES.filter((c) => c.startsWith("APT_L_"));
  const numericalCodes = APTITUDE_CODES.filter((c) => c.startsWith("APT_N_"));
  const verbalCodes = APTITUDE_CODES.filter((c) => c.startsWith("APT_V_"));

  const putSequential = (codes, arr) => {
    for (let i = 0; i < codes.length; i += 1) {
      if (arr[i]) put(codes[i], arr[i]);
    }
  };
  putSequential(logicalCodes, logical);
  putSequential(numericalCodes, numerical);
  putSequential(verbalCodes, verbal);

  for (const code of BIG_FIVE_CODES) {
    if (byCode[code]) continue;
    const stemMatch = big5.find(
      (q) =>
        String(q.stem).startsWith(`${code}.`) ||
        String(q.stem).startsWith(`${code} `) ||
        String(q.stem).includes(`${code}. `)
    );
    const idx = BIG_FIVE_CODES.indexOf(code);
    const q = stemMatch ?? big5[idx];
    put(code, q);
  }

  for (const code of RIASEC_CODES) {
    if (byCode[code]) continue;
    const stemMatch = riasec.find(
      (q) =>
        String(q.stem).startsWith(`${code}.`) ||
        String(q.stem).startsWith(`${code} `) ||
        String(q.stem).includes(`${code}. `)
    );
    const idx = RIASEC_CODES.indexOf(code);
    const q = stemMatch ?? riasec[idx];
    put(code, q);
  }

  for (let i = 0; i < MOTIVATION_CODES.length; i++) {
    put(MOTIVATION_CODES[i], motivation[i]);
  }

  for (const code of WRITING_CODES) {
    put(code, writing[0]);
  }

  return byCode;
}
