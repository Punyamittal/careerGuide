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

/**
 * Legacy rows may lack `external_code`. Never map by array index — only explicit codes
 * or stem prefixes that embed the code (e.g. "RIA_R_03. …").
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

  for (const q of shapedQuestions) {
    const code = q.externalCode;
    if (code && need.has(code) && !byCode[code]) {
      byCode[code] = q;
    }
  }

  const stemMatchesCode = (q, code) => {
    const stem = String(q.stem ?? "");
    return (
      stem.startsWith(`${code}.`) ||
      stem.startsWith(`${code} `) ||
      stem.includes(`${code}. `)
    );
  };

  const hydrateByStem = (codes, category) => {
    for (const code of codes) {
      if (byCode[code]) continue;
      const match = shapedQuestions.find((q) => q.category === category && stemMatchesCode(q, code));
      if (match) byCode[code] = { ...match, externalCode: code };
    }
  };

  hydrateByStem(
    APTITUDE_CODES.filter((c) => c.startsWith("APT_L_")),
    QUESTION_CATEGORIES.APTITUDE_LOGICAL
  );
  hydrateByStem(
    APTITUDE_CODES.filter((c) => c.startsWith("APT_N_")),
    QUESTION_CATEGORIES.APTITUDE_NUMERICAL
  );
  hydrateByStem(
    APTITUDE_CODES.filter((c) => c.startsWith("APT_V_")),
    QUESTION_CATEGORIES.APTITUDE_VERBAL
  );
  hydrateByStem(BIG_FIVE_CODES, QUESTION_CATEGORIES.BIG_FIVE);
  hydrateByStem(RIASEC_CODES, QUESTION_CATEGORIES.RIASEC);
  hydrateByStem(MOTIVATION_CODES, QUESTION_CATEGORIES.MOTIVATION);
  hydrateByStem(WRITING_CODES, QUESTION_CATEGORIES.WRITING);

  return byCode;
}
