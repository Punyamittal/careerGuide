import { QUESTION_CATEGORIES } from "../constants/assessment.js";
import { ASSESSMENT_PLANS } from "../constants/assessmentPlans.js";

function isResponseComplete(r, q) {
  if (!r) return false;
  if (q.category === QUESTION_CATEGORIES.WRITING) return String(r.writingText ?? "").trim().length > 0;
  if (q.useLikert && q.category === QUESTION_CATEGORIES.BIG_FIVE) {
    const lv = r.likertValue;
    return lv != null && Number(lv) >= 1 && Number(lv) <= 5;
  }
  if (q.useLikert && q.category === QUESTION_CATEGORIES.RIASEC) {
    const lv = r.likertValue;
    return lv != null && Number(lv) >= 1 && Number(lv) <= 5;
  }
  if (
    q.category === QUESTION_CATEGORIES.APTITUDE_LOGICAL ||
    q.category === QUESTION_CATEGORIES.APTITUDE_NUMERICAL ||
    q.category === QUESTION_CATEGORIES.APTITUDE_VERBAL ||
    q.category === QUESTION_CATEGORIES.MOTIVATION
  ) {
    return !!r.selectedOptionKey;
  }
  return false;
}

/**
 * @param {string} cur external_code
 * @param {object} q question row (mapped)
 * @param {object} r response
 * @param {string[]} plan
 */
export function resolveNextCode(cur, q, r, plan) {
  const edges = q.flowRules?.edges || q.flow_rules?.edges || {};
  if (r.likertValue != null) {
    const v = Number(r.likertValue);
    if (v >= 4 && edges._likertGte4) return edges._likertGte4;
    if (v <= 2 && edges._likertLte2) return edges._likertLte2;
  }
  if (r.selectedOptionKey && edges[r.selectedOptionKey]) return edges[r.selectedOptionKey];
  const idx = plan.indexOf(cur);
  if (idx >= 0 && idx + 1 < plan.length) return plan[idx + 1];
  return null;
}

/**
 * @param {string} assessmentKey
 * @param {Record<string, object>} questionsByCode external_code -> mapped question
 * @param {Map<string, object>} responsesByQuestionId
 * @returns {{ done: boolean, nextQuestion?: object, progress?: { index: number, total: number } }}
 */
export function findAdaptiveProgress(assessmentKey, questionsByCode, responsesByQuestionId) {
  const plan = ASSESSMENT_PLANS[assessmentKey];
  if (!plan?.length) return { done: true };

  let cur = plan[0];
  const seen = new Set();
  let step = 0;

  while (cur) {
    if (seen.has(cur)) {
      return { done: false, error: "adaptive_cycle", nextQuestion: questionsByCode[cur] };
    }
    seen.add(cur);
    const q = questionsByCode[cur];
    if (!q) return { done: false, error: "missing_question_code", missingCode: cur };

    const r = responsesByQuestionId.get(String(q._id ?? q.id));
    if (!isResponseComplete(r, q)) {
      const total = plan.length;
      return {
        done: false,
        nextQuestion: q,
        progress: { index: step + 1, total }
      };
    }

    const nxt = resolveNextCode(cur, q, r, plan);
    step += 1;
    if (!nxt) return { done: true };
    cur = nxt;
  }

  return { done: true };
}

export function isAssessmentComplete(assessmentKey, questionsByCode, responsesByQuestionId) {
  return findAdaptiveProgress(assessmentKey, questionsByCode, responsesByQuestionId).done === true;
}
