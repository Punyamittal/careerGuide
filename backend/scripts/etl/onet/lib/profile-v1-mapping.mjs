import { IM_SCALE_MAX, PROFILE_VECTOR_KEYS } from "./constants.mjs";

/** Substring patterns on Element Name (case-insensitive) → profile key */
export const IM_ELEMENT_PATTERNS = {
  apt_logical: [
    "deductive reasoning",
    "inductive reasoning",
    "problem sensitivity",
    "category flexibility",
    "fluency of ideas"
  ],
  apt_numerical: ["mathematics", "number facility", "mathematical reasoning"],
  apt_verbal: [
    "reading comprehension",
    "written comprehension",
    "written expression",
    "oral expression",
    "oral comprehension",
    "speaking",
    "writing",
    "english language"
  ],
  bf_O: ["innovation", "adaptability", "analytical thinking", "initiative"],
  bf_C: ["dependability", "attention to detail", "integrity", "persistence", "achievement"],
  bf_E: ["leadership", "social orientation", "energy level", "self-confidence"],
  bf_A: ["cooperation", "concern for others", "social orientation"],
  bf_N: ["stress tolerance", "self-control", "self control"]
};

export const createProfileAccumulator = () => new Map();

/**
 * @param {Map<string, object>} accum
 * @param {string} socCode
 */
export const ensureSocAccum = (accum, socCode) => {
  if (!accum.has(socCode)) {
    accum.set(socCode, {});
    for (const key of PROFILE_VECTOR_KEYS) {
      if (key.startsWith("apt_") || key.startsWith("bf_")) {
        accum.get(socCode)[key] = { sum: 0, n: 0 };
      }
    }
  }
  return accum.get(socCode);
};

/**
 * Record one IM rating into aptitude / Big Five buckets.
 */
export const recordImForProfile = (accum, socCode, elementName, value) => {
  const name = String(elementName || "").toLowerCase();
  const v = Number(value);
  if (!Number.isFinite(v)) return;
  const row = ensureSocAccum(accum, socCode);
  for (const [key, patterns] of Object.entries(IM_ELEMENT_PATTERNS)) {
    if (patterns.some((p) => name.includes(p))) {
      row[key].sum += v;
      row[key].n += 1;
    }
  }
};

const avgIm = (bucket) => {
  if (!bucket?.n) return 0.5;
  return Math.min(1, Math.max(0, bucket.sum / bucket.n / IM_SCALE_MAX));
};

/**
 * @param {object} riasecVector - keys ria_R .. ria_C (0-1)
 * @param {object} accumRow - per-soc accum from recordImForProfile
 */
export const finalizeProfileV1Vector = (riasecVector, accumRow = {}) => {
  const ria = (k) => riasecVector[`ria_${k}`] ?? 0.5;
  const vector = {};

  vector.apt_logical = avgIm(accumRow.apt_logical);
  vector.apt_numerical = avgIm(accumRow.apt_numerical);
  vector.apt_verbal = avgIm(accumRow.apt_verbal);
  vector.bf_O = avgIm(accumRow.bf_O);
  vector.bf_C = avgIm(accumRow.bf_C);
  vector.bf_E = avgIm(accumRow.bf_E);
  vector.bf_A = avgIm(accumRow.bf_A);
  vector.bf_N = avgIm(accumRow.bf_N);

  for (const k of ["R", "I", "A", "S", "E", "C"]) {
    vector[`ria_${k}`] = ria(k);
  }

  vector.mot_people = Math.min(1, (ria("S") + ria("E")) / 2);
  vector.mot_data = Math.min(1, (ria("I") + ria("C")) / 2);
  vector.mot_ideas = Math.min(1, (ria("A") + ria("I")) / 2);
  vector.mot_things = Math.min(1, (ria("R") + ria("C")) / 2);

  return vector;
};
