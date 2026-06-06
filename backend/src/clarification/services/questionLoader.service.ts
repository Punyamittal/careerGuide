import {
  API_CONTRACT_VERSION,
  CLARIFICATION_STATUS,
  DEPRECATED_J2_V1_PATTERN,
  JOURNEY_POOL_MAP
} from "../constants/clarification.constants.js";
import { listExhaustedItemIds } from "../repositories/clarificationItemExposure.repository.js";
import { getMergedQuestionBank } from "../../modules/clarification/config/clarificationAssets.js";

const MAX_EXPOSURE = 3;

export interface QuestionBankItem {
  item_id: string;
  journey?: string;
  exposure_pool?: string;
  question_type?: string;
  stem?: string;
  options?: string[];
  correct_answer?: number | string;
  construct?: string;
  difficulty?: string;
  scoring_logic?: string;
  scoring_rubric?: string;
}

function journeyIdToPoolKeys(journeyId: string): string[] {
  const pool = JOURNEY_POOL_MAP[journeyId] ?? journeyId;
  if (journeyId === "J2-NEG") return ["J2-NEG", "NEG-V2"];
  if (journeyId === "J7") return ["J7", "J7-LRN"];
  if (journeyId === "J8") return ["J8", "J8-APT"];
  if (journeyId === "J2") return ["J2", "J2-V2"];
  return [journeyId, pool];
}

export interface LoadQuestionBatchOptions {
  userId: string;
  journeyId: string;
  count?: number;
  excludeRecent?: string[];
  region?: string;
  difficulty?: string;
}

export async function loadQuestionBatch(opts: LoadQuestionBatchOptions): Promise<QuestionBankItem[]> {
  const bank = getMergedQuestionBank() as { items?: QuestionBankItem[] };
  const poolKeys = journeyIdToPoolKeys(opts.journeyId);

  let pool = (bank.items ?? []).filter((item) => {
    if (DEPRECATED_J2_V1_PATTERN.test(item.item_id)) return false;
    if (item.journey === opts.journeyId) return true;
    if (item.exposure_pool && poolKeys.includes(item.exposure_pool)) return true;
    if (item.journey && poolKeys.includes(item.journey)) return true;
    return false;
  });

  if (opts.region && opts.region !== "IN") {
    pool = pool.filter((item) => !/\b(PAN|DPDP|ONDC)\b/i.test(item.stem ?? ""));
  }

  const exhaustedIds = await listExhaustedItemIds(opts.userId);
  const exhausted = new Set(exhaustedIds);
  const excludeRecent = new Set(opts.excludeRecent ?? []);

  pool = pool.filter(
    (item) => !exhausted.has(item.item_id) && !excludeRecent.has(item.item_id)
  );

  if (opts.difficulty) {
    const tier = pool.filter((item) => item.difficulty === opts.difficulty);
    if (tier.length >= (opts.count ?? 1)) pool = tier;
  }

  pool = stratifiedShuffle(pool, opts.userId + opts.journeyId);

  const count = opts.count ?? 1;
  return pool.slice(0, count);
}

function stratifiedShuffle(items: QuestionBankItem[], seed: string): QuestionBankItem[] {
  const buckets: Record<string, QuestionBankItem[]> = {
    beginner: [],
    standard: [],
    stretch: []
  };

  for (const item of items) {
    const difficulty = item.difficulty ?? "standard";
    (buckets[difficulty] ?? buckets.standard).push(item);
  }

  const out: QuestionBankItem[] = [];
  const order = ["standard", "beginner", "stretch"];
  let i = 0;

  while (out.length < items.length) {
    let progressed = false;
    for (const key of order) {
      if (buckets[key].length) {
        const idx = seededIndex(seed + i, buckets[key].length);
        out.push(buckets[key].splice(idx, 1)[0]);
        i += 1;
        progressed = true;
      }
    }
    if (!progressed) break;
  }

  return out;
}

function seededIndex(seed: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % max;
}

export function getItemById(itemId: string): QuestionBankItem | null {
  const bank = getMergedQuestionBank() as { items?: QuestionBankItem[] };
  return (bank.items ?? []).find((item) => item.item_id === itemId) ?? null;
}

export function shuffleOptions(options: string[], seed: string): string[] {
  const arr = [...options];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  for (let i = arr.length - 1; i > 0; i -= 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const j = hash % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const QUESTION_LOADER_VERSION = API_CONTRACT_VERSION;
export { MAX_EXPOSURE, CLARIFICATION_STATUS };
