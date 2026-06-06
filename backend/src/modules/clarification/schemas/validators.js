import {
  AMBIGUITY_RULE_IDS,
  JOURNEY_IDS,
  MAX_ITEM_EXPOSURE
} from "./constants.js";

const RULE_SET = new Set(AMBIGUITY_RULE_IDS);
const JOURNEY_SET = new Set(JOURNEY_IDS);

/** @param {unknown} v */
export function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

/** @param {unknown} v @param {number} min @param {number} max */
export function isNumberInRange(v, min, max) {
  return typeof v === "number" && !Number.isNaN(v) && v >= min && v <= max;
}

/** Mongoose validator factory for score/confidence 0–1. */
export function unitIntervalValidator(message = "Must be between 0 and 1") {
  return {
    validator(v) {
      return v == null || isNumberInRange(v, 0, 1);
    },
    message
  };
}

/** @param {unknown} v */
export function isValidRuleId(v) {
  return typeof v === "string" && RULE_SET.has(v);
}

/** @param {unknown[]} arr */
export function areValidRuleIds(arr) {
  return Array.isArray(arr) && arr.every(isValidRuleId);
}

/** @param {unknown} v */
export function isValidJourneyId(v) {
  return typeof v === "string" && JOURNEY_SET.has(v);
}

/** @param {unknown} v */
export function isValidClarItemId(v) {
  return typeof v === "string" && /^CLAR-[A-Z0-9-]+$/i.test(v);
}

/** @param {unknown} v */
export function isValidSimId(v) {
  return typeof v === "string" && /^SIM-[A-Z0-9-]+$/i.test(v);
}

/** @param {unknown} v */
export function isValidUserId(v) {
  return isNonEmptyString(v) && v.length <= 128;
}

/** @param {unknown} v */
export function isValidExposureCount(v) {
  return Number.isInteger(v) && v >= 0 && v <= MAX_ITEM_EXPOSURE + 10;
}

export const validators = {
  isNonEmptyString,
  isNumberInRange,
  unitIntervalValidator,
  isValidRuleId,
  areValidRuleIds,
  isValidJourneyId,
  isValidClarItemId,
  isValidSimId,
  isValidUserId,
  isValidExposureCount
};
