import { getMergedQuestionBank } from "../config/clarificationAssets.js";
import { DEPRECATED_J2_V1_PATTERN, JOURNEY_POOL_MAP } from "../constants/clarification.constants.js";
import { ClarificationItemExposure } from "../models/ClarificationItemExposure.model.js";

const MAX_EXPOSURE = 3;

/**
 * @param {string} journeyId
 * @returns {string[]}
 */
function journeyIdToPoolKeys(journeyId) {
  const pool = JOURNEY_POOL_MAP[journeyId] ?? journeyId;
  if (journeyId === "J2-NEG") return ["J2-NEG", "NEG-V2"];
  if (journeyId === "J7") return ["J7", "J7-LRN"];
  if (journeyId === "J8") return ["J8", "J8-APT"];
  if (journeyId === "J2") return ["J2", "J2-V2"];
  return [journeyId, pool];
}

/**
 * @param {{ userId: string; journeyId: string; count?: number; excludeRecent?: string[]; region?: string; difficulty?: string }} opts
 */
export async function loadQuestionBatch(opts) {
  const bank = getMergedQuestionBank();
  const poolKeys = journeyIdToPoolKeys(opts.journeyId);

  let pool = (bank.items ?? []).filter((item) => {
    if (DEPRECATED_J2_V1_PATTERN.test(item.item_id)) return false;
    if (item.journey === opts.journeyId) return true;
    if (poolKeys.includes(item.exposure_pool)) return true;
    if (poolKeys.includes(item.journey)) return true;
    return false;
  });

  if (opts.region && opts.region !== "IN") {
    pool = pool.filter((item) => !/\b(PAN|DPDP|ONDC)\b/i.test(item.stem ?? ""));
  }

  const exposures = await ClarificationItemExposure.find({
    userId: opts.userId,
    exposureCount: { $gte: MAX_EXPOSURE }
  }).lean();

  const exhausted = new Set(exposures.map((e) => e.itemId));
  const excludeRecent = new Set(opts.excludeRecent ?? []);

  pool = pool.filter((item) => !exhausted.has(item.item_id) && !excludeRecent.has(item.item_id));

  if (opts.difficulty) {
    const tier = pool.filter((i) => i.difficulty === opts.difficulty);
    if (tier.length >= opts.count) pool = tier;
  }

  pool = stratifiedShuffle(pool, opts.userId + opts.journeyId);

  const count = opts.count ?? 1;
  return pool.slice(0, count);
}

/**
 * @param {Array<Record<string, unknown>>} items
 * @param {string} seed
 */
function stratifiedShuffle(items, seed) {
  const buckets = { beginner: [], standard: [], stretch: [] };
  for (const item of items) {
    const d = item.difficulty ?? "standard";
    (buckets[d] ?? buckets.standard).push(item);
  }

  const out = [];
  const order = ["standard", "beginner", "stretch"];
  let i = 0;
  while (out.length < items.length) {
    for (const key of order) {
      if (buckets[key].length) {
        const idx = seededIndex(seed + i, buckets[key].length);
        out.push(buckets[key].splice(idx, 1)[0]);
        i++;
      }
    }
    if (!buckets.beginner.length && !buckets.standard.length && !buckets.stretch.length) break;
  }
  return out;
}

function seededIndex(seed, max) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % max;
}

/**
 * @param {string} itemId
 */
export function getItemById(itemId) {
  const bank = getMergedQuestionBank();
  return (bank.items ?? []).find((i) => i.item_id === itemId) ?? null;
}
