import { getModuleById } from "../../constants/mbsModuleRegistry.js";
import { PROCEDURAL_MODULE_IDS } from "./constants.js";
import { getGlobalItemIndex } from "./loader.js";
import { getModuleRules, itemMatchesRules } from "./moduleMapper.js";
import {
  inferLikertType,
  defaultScaleLabels,
  parseConstructsFed
} from "./parseConstructs.js";
import { getStaticModuleConfig } from "./staticModuleFallbacks.js";

/** @typedef {import('./loader.js').ArchiveItem} ArchiveItem */

/**
 * @param {ArchiveItem} item
 */
function resolveItemStem(item) {
  const raw = item.stem ?? item.prompt ?? item.text ?? item.question ?? "";
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * @param {ArchiveItem} item
 */
export function isRenderableLikertItem(item) {
  const t = (item.native_type ?? "").toLowerCase();
  if (
    t.includes("file upload") ||
    t.includes("free text") ||
    t.includes("short-answer") ||
    t.includes("numeric") ||
    t.includes("dropdown") ||
    t.includes("survey") ||
    t.includes("narrative") ||
    t.includes("game/simulation") ||
    t.includes("ai-scored")
  ) {
    return false;
  }
  if (t.includes("ranking") && !item.options?.length) return false;
  if ((t.includes("matching") || t.includes("ordering")) && !item.options?.length) {
    return false;
  }
  return Boolean(resolveItemStem(item));
}

/**
 * @param {ArchiveItem} item
 */
function primaryConstructCategory(item) {
  const weights = parseConstructsFed(item.constructs_fed ?? "");
  const top = Object.entries(weights).sort((a, b) => b[1] - a[1])[0];
  return top?.[0] ?? "general";
}

/**
 * @param {ArchiveItem} item
 */
function inferDifficulty(item) {
  const t = (item.native_type ?? "").toLowerCase();
  if (t.includes("forced-choice") || t.includes("ipsative")) return 2;
  if (t.includes("semantic") || t.includes("bipolar")) return 3;
  if (t.includes("sjt") || item.options?.length >= 4) return 3;
  if (t.includes("attention") || t.includes("infrequency")) return 1;
  return 2;
}

/**
 * @param {ArchiveItem} item
 */
export function archiveItemToLikert(item) {
  const type = inferLikertType(item.native_type ?? "");
  const category = primaryConstructCategory(item);
  const scoringWeight = parseConstructsFed(item.constructs_fed ?? "");
  const reversed = Boolean(item.reverse_for?.trim());

  /** @type {Record<string, unknown>} */
  const likert = {
    id: item.item_id,
    type,
    prompt: resolveItemStem(item),
    category,
    difficulty: inferDifficulty(item),
    telemetryTags: [category, item.construct_pool ?? "archive"].filter(Boolean),
    scoringWeight,
    adaptiveTags: inferDifficulty(item) <= 2 ? ["simple"] : ["complex"],
    reverse: reversed,
    archiveMeta: {
      native_type: item.native_type,
      userFlow: item.userFlow,
      source: item.source ?? item.bankKey
    }
  };

  if (item.options?.length) {
    likert.scaleLabels = item.options;
    likert.type = "frequency";
  } else if (type === "frequency") {
    likert.scaleLabels = defaultScaleLabels(item.native_type ?? "");
  }

  if (type === "binary") {
    likert.binaryLabels = ["Option A", "Option B"];
  }

  if (item.key != null && typeof item.key === "number") {
    likert.idealIndex = Number(item.key) + 1;
  }

  return likert;
}

/**
 * @param {string} moduleId
 * @param {ArchiveItem[]} [pool]
 */
export function getModuleArchiveItems(moduleId, pool) {
  const rules = getModuleRules(moduleId);
  if (!rules) return [];
  const items = pool ?? getGlobalItemIndex();
  return items.filter((item) => itemMatchesRules(item, rules) && isRenderableLikertItem(item));
}

/**
 * Build frontend-compatible Likert module config from archive.
 * @param {string} moduleId
 * @param {{ shuffle?: boolean; seed?: string; adaptiveDifficulty?: number; userFlow?: string; limit?: number }} [opts]
 */
export function buildLikertModuleConfig(moduleId, opts = {}) {
  const mod = getModuleById(moduleId);
  const normalizedId = mod?.id ?? moduleId.toUpperCase();

  if (PROCEDURAL_MODULE_IDS.has(normalizedId)) {
    return null;
  }

  let items = getModuleArchiveItems(normalizedId);
  if (opts.userFlow) {
    const flow = opts.userFlow.replace(/^user-/, "user-");
    items = items.filter((i) => i.userFlow === flow || i.userFlow === opts.userFlow);
  }

  if (!items.length) {
    const staticCfg = getStaticModuleConfig(normalizedId);
    if (staticCfg) return staticCfg;
    return null;
  }

  if (opts.shuffle) {
    items = randomizeItems(items, { seed: opts.seed, limit: opts.limit });
  } else if (opts.limit) {
    items = items.slice(0, opts.limit);
  }

  const likertItems = items.map(archiveItemToLikert);
  const ordered =
    opts.adaptiveDifficulty != null
      ? orderForAdaptive(likertItems, opts.adaptiveDifficulty)
      : likertItems;

  const constructs = mod?.constructTags ?? [];
  return {
    moduleId: normalizedId,
    engineType: "likert",
    title: mod?.title ?? normalizedId,
    estimatedMinutes: mod?.estimatedMinutes ?? Math.ceil(ordered.length * 0.4),
    scoring: {
      provider: "rule",
      constructs: [...constructs]
    },
    fastResponseMs: 5500,
    hesitationMs: 11000,
    checkpointInterval: 5,
    autoAdvanceOnSelect: true,
    items: ordered,
    source: "archive",
    bankVersion: "mbs-archive-v1.0.0"
  };
}

/**
 * SS02/SS03 archive items are flat Likert/frequency stems — use likert engine.
 * @param {string} moduleId
 */
export function resolveEngineType(moduleId) {
  const mod = getModuleById(moduleId);
  const normalizedId = mod?.id ?? moduleId.toUpperCase();
  if (PROCEDURAL_MODULE_IDS.has(normalizedId)) return mod?.engineType ?? "likert";

  const archiveItems = getModuleArchiveItems(normalizedId);
  if (archiveItems.length > 0) {
    if (normalizedId === "SS02" || normalizedId === "SS03") return "likert";
    return mod?.engineType === "branching" ? "likert" : mod?.engineType ?? "likert";
  }
  return mod?.engineType ?? "likert";
}

/**
 * Scoring catalog slice for ruleScoring.service
 * @param {string} moduleId
 */
export function buildScoringRules(moduleId) {
  const config = buildLikertModuleConfig(moduleId);
  if (!config) return null;
  return {
    engineType: config.engineType,
    constructs: config.scoring.constructs,
    items: config.items.map((item) => ({
      id: item.id,
      type: item.type,
      reverse: item.reverse,
      idealIndex: item.idealIndex,
      scoringWeight: item.scoringWeight
    }))
  };
}
