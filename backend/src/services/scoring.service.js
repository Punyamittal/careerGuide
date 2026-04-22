import { StatusCodes } from "http-status-codes";
import {
  BIG_FIVE_KEYS,
  MOTIVATION_KEYS,
  QUESTION_CATEGORIES,
  RIASEC_KEYS
} from "../constants/assessment.js";
import { mapQuestionRow } from "../db/mappers.js";
import { getSupabaseAdmin } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";

const likertToPercent = (v) => ((Number(v) - 1) / 4) * 100;

const emptyCounts = (keys) => Object.fromEntries(keys.map((k) => [k, { sum: 0, n: 0 }]));

const finalizeAverages = (acc, keys) => {
  const out = {};
  for (const k of keys) {
    const { sum, n } = acc[k];
    out[k] = n > 0 ? Math.round((sum / n) * 100) / 100 : 0;
  }
  return out;
};

const maxSum = (acc) => {
  let m = 0;
  for (const k of Object.keys(acc)) {
    m = Math.max(m, acc[k].sum);
  }
  return m || 1;
};

const normalizeRiasecMotivation = (acc, keys) => {
  const m = maxSum(acc);
  const out = {};
  for (const k of keys) {
    out[k] = Math.round(((acc[k].sum / m) * 100 + Number.EPSILON) * 100) / 100;
  }
  return out;
};

/**
 * @param {string[]} questionIds
 * @param {Array<{ questionId: unknown, category: string, selectedOptionKey?: string, likertValue?: number }>} responses
 */
export const scoreAttempt = async (questionIds, responses) => {
  const supabase = getSupabaseAdmin();
  const { data: rows, error } = await supabase.from("questions").select("*").in("id", questionIds);

  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);

  const questions = (rows ?? []).map(mapQuestionRow);
  const byId = new Map(questions.map((q) => [String(q._id), q]));

  const riasecQs = questions.filter((q) => q.category === QUESTION_CATEGORIES.RIASEC);
  const riasecUsesLikertAvg =
    riasecQs.length > 0 &&
    riasecQs.every((q) => q.useLikert && q.riasecKey && RIASEC_KEYS.includes(q.riasecKey));

  const aptitudeBuckets = {
    [QUESTION_CATEGORIES.APTITUDE_LOGICAL]: { correct: 0, total: 0 },
    [QUESTION_CATEGORIES.APTITUDE_NUMERICAL]: { correct: 0, total: 0 },
    [QUESTION_CATEGORIES.APTITUDE_VERBAL]: { correct: 0, total: 0 }
  };

  const bigFiveAcc = emptyCounts(BIG_FIVE_KEYS);
  const riasecMcqAcc = emptyCounts(RIASEC_KEYS);
  const riasecLikertAcc = emptyCounts(RIASEC_KEYS);
  const motAcc = emptyCounts(MOTIVATION_KEYS);

  for (const r of responses) {
    const q = byId.get(String(r.questionId));
    if (!q) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Unknown question: ${r.questionId}`);
    }

    if (
      q.category === QUESTION_CATEGORIES.APTITUDE_LOGICAL ||
      q.category === QUESTION_CATEGORIES.APTITUDE_NUMERICAL ||
      q.category === QUESTION_CATEGORIES.APTITUDE_VERBAL
    ) {
      const bucket = aptitudeBuckets[q.category];
      bucket.total += 1;
      const opt = q.options?.find((o) => o.key === r.selectedOptionKey);
      if (opt?.isCorrect) bucket.correct += 1;
    } else if (q.category === QUESTION_CATEGORIES.BIG_FIVE) {
      const key = q.bigFiveKey;
      if (!key || !BIG_FIVE_KEYS.includes(key)) continue;
      if (!r.likertValue) continue;
      let lv = Number(r.likertValue);
      if (q.likertReverse) {
        lv = 6 - lv;
      }
      bigFiveAcc[key].sum += likertToPercent(lv);
      bigFiveAcc[key].n += 1;
    } else if (q.category === QUESTION_CATEGORIES.RIASEC) {
      if (q.useLikert && q.riasecKey && RIASEC_KEYS.includes(q.riasecKey)) {
        if (!r.likertValue) continue;
        riasecLikertAcc[q.riasecKey].sum += likertToPercent(Number(r.likertValue));
        riasecLikertAcc[q.riasecKey].n += 1;
      } else {
        const opt = q.options?.find((o) => o.key === r.selectedOptionKey);
        const w = opt?.weights && typeof opt.weights === "object" ? opt.weights : {};
        for (const letter of RIASEC_KEYS) {
          if (w[letter]) riasecMcqAcc[letter].sum += Number(w[letter]) || 0;
        }
      }
    } else if (q.category === QUESTION_CATEGORIES.MOTIVATION) {
      const opt = q.options?.find((o) => o.key === r.selectedOptionKey);
      const w = opt?.weights && typeof opt.weights === "object" ? opt.weights : {};
      for (const mk of MOTIVATION_KEYS) {
        if (w[mk]) motAcc[mk].sum += Number(w[mk]) || 0;
      }
      const tw = opt?.traitWeights && typeof opt.traitWeights === "object" ? opt.traitWeights : {};
      for (const bf of BIG_FIVE_KEYS) {
        const raw = Number(tw[bf] ?? 0);
        if (!Number.isFinite(raw) || raw === 0) continue;
        // Forced-choice trait signal in [-1, 1] converted to pseudo-percent for aggregation.
        bigFiveAcc[bf].sum += Math.max(0, Math.min(100, 50 + raw * 50));
        bigFiveAcc[bf].n += 1;
      }
    }
  }

  const pct = (bucket) =>
    bucket.total === 0 ? 0 : Math.round((bucket.correct / bucket.total) * 10000) / 100;

  const raw = {
    aptitude: {
      logical: pct(aptitudeBuckets[QUESTION_CATEGORIES.APTITUDE_LOGICAL]),
      numerical: pct(aptitudeBuckets[QUESTION_CATEGORIES.APTITUDE_NUMERICAL]),
      verbal: pct(aptitudeBuckets[QUESTION_CATEGORIES.APTITUDE_VERBAL])
    },
    personality: {
      bigFive: finalizeAverages(bigFiveAcc, BIG_FIVE_KEYS),
      riasec: riasecUsesLikertAvg
        ? finalizeAverages(riasecLikertAcc, RIASEC_KEYS)
        : normalizeRiasecMotivation(riasecMcqAcc, RIASEC_KEYS)
    },
    motivation: normalizeRiasecMotivation(motAcc, MOTIVATION_KEYS)
  };

  return normalizeScores(raw);
};

/** Clamp all scalar scores to [0, 100] (2 decimal places) for API consistency. */
export function normalizeScores(scores) {
  const clamp = (n) => {
    const x = Number(n);
    if (Number.isNaN(x)) return 0;
    return Math.min(100, Math.max(0, Math.round(x * 100) / 100));
  };

  const clampMap = (obj, keys) => {
    const o = {};
    for (const k of keys) {
      o[k] = clamp(obj?.[k] ?? 0);
    }
    return o;
  };

  return {
    aptitude: clampMap(scores.aptitude || {}, ["logical", "numerical", "verbal"]),
    personality: {
      bigFive: clampMap(scores.personality?.bigFive || {}, BIG_FIVE_KEYS),
      riasec: clampMap(scores.personality?.riasec || {}, RIASEC_KEYS)
    },
    motivation: clampMap(scores.motivation || {}, MOTIVATION_KEYS)
  };
}
