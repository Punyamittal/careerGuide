import { getItemById } from "./questionLoader.service.js";

/**
 * @param {string} itemId
 * @param {number|string} selectedOption
 * @param {Record<string, unknown>} [meta]
 */
export function scoreItemResponse(itemId, selectedOption, meta = {}) {
  const item = getItemById(itemId);
  if (!item) {
    return {
      correct: false,
      partialScore: 0,
      constructUpdates: {},
      questionType: "unknown",
      scoringRubric: null
    };
  }

  const key = Number(item.correct_answer);
  const selected = Number(selectedOption);
  const correct = !Number.isNaN(key) && key === selected;

  let partialScore = correct ? 1.0 : 0.2;

  if (!correct && item.scoring_logic?.includes("partial")) {
    partialScore = 0.4;
  }

  if (item.question_type === "forced-choice" && item.correct_answer === "ipsative_score") {
    partialScore = 0.5;
  }

  if (item.question_type === "micro-CAT") {
    partialScore = correct ? 1.0 : 0.0;
  }

  /** @type {Record<string, number>} */
  const constructUpdates = {};
  for (const part of String(item.construct ?? "").split("|")) {
    const c = part.split(":")[0].trim();
    if (c) constructUpdates[c] = partialScore;
  }

  return {
    correct,
    partialScore,
    constructUpdates,
    questionType: item.question_type,
    scoringRubric: item.scoring_rubric ?? null
  };
}
