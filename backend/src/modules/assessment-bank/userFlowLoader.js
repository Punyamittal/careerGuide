import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { ARCHIVE_ROOT } from "./constants.js";
import { getUserFlowBank } from "./loader.js";
import { archiveItemToLikert, isRenderableLikertItem } from "./likertAdapter.js";
import {
  USER_FLOW_SPECS,
  USER_FLOW_INDEX_FILE,
  normalizeUserFlowKey,
  flowBlockModuleId,
  parseFlowBlockModuleId
} from "./userFlowConstants.js";

/** @type {Record<string, unknown> | null} */
let _indexCache = null;
/** @type {Map<string, unknown>} */
const _specCache = new Map();

function readJson(relativePath) {
  const path = join(ARCHIVE_ROOT, relativePath);
  if (!existsSync(path)) throw new Error(`User flow asset not found: ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

export function getUserFlowIndex() {
  if (!_indexCache) _indexCache = readJson(USER_FLOW_INDEX_FILE);
  return _indexCache;
}

/**
 * @param {string} userFlowKey
 */
export function loadUserFlowSpec(userFlowKey) {
  const key = normalizeUserFlowKey(userFlowKey);
  const spec = USER_FLOW_SPECS[key];
  if (!spec) return null;

  if (!_specCache.has(key)) {
    _specCache.set(key, readJson(spec.file));
  }

  return {
    ...spec,
    spec: _specCache.get(key)
  };
}

export function listUserFlowSpecs() {
  const index = getUserFlowIndex();
  return Object.values(USER_FLOW_SPECS).map((entry) => {
    const loaded = loadUserFlowSpec(entry.key);
    const meta = loaded?.spec ?? {};
    return {
      key: entry.key,
      userFlow: entry.userFlow,
      label: entry.label,
      grade: entry.grade,
      file: entry.file,
      user: meta.user ?? entry.label,
      durationMin: meta.duration_min ?? null,
      targetItems: meta.target_items ?? null,
      selectedItems: meta._selected_item_count ?? null,
      purpose: meta.purpose ?? null,
      delivery: meta.delivery ?? null,
      phaseCount: meta.phases?.length ?? 0
    };
  });
}

/**
 * @param {Record<string, unknown>} block
 */
export function classifyBlockDelivery(block) {
  const format = String(block.format ?? "").toLowerCase();
  const pool = String(block.pool ?? block.construct_pool ?? "").toLowerCase();
  const module = String(block.module ?? block.game_module ?? "").trim();
  const itemIds = block.item_ids ?? [];

  if (format.includes("clarification") || pool.includes("clarification")) {
    return "clarification";
  }
  if (
    (module || pool.startsWith("game:")) &&
    (!Array.isArray(itemIds) || itemIds.length === 0) &&
    (format.includes("simulation") ||
      format.includes("timed game") ||
      (format.includes("performance task") && !itemIds.length))
  ) {
    return "game";
  }
  if (format.includes("narrative") || format.includes("unscored")) {
    return "narrative";
  }
  if (format.includes("survey") || format.includes("file upload") || format.includes("dropdown")) {
    return "intake";
  }
  if (Array.isArray(itemIds) && itemIds.length > 0) {
    return "items";
  }
  return "placeholder";
}

/**
 * @param {string} userFlowKey
 */
export function resolveUserFlow(userFlowKey) {
  const loaded = loadUserFlowSpec(userFlowKey);
  if (!loaded) return null;

  const bank = getUserFlowBank(loaded.bankKey);
  const itemById = new Map((bank?.items ?? []).map((item) => [item.item_id, item]));

  /** @type {Array<Record<string, unknown>>} */
  const phases = [];

  for (let pi = 0; pi < (loaded.spec.phases ?? []).length; pi += 1) {
    const phase = loaded.spec.phases[pi];
    /** @type {Array<Record<string, unknown>>} */
    const blocks = [];

    for (let bi = 0; bi < (phase.blocks ?? []).length; bi += 1) {
      const block = phase.blocks[bi];
      const itemIds = block.item_ids ?? [];
      const resolvedItems = [];
      const missingIds = [];

      for (const id of itemIds) {
        const item = itemById.get(id);
        if (item) resolvedItems.push(item);
        else missingIds.push(id);
      }

      const renderableItems = resolvedItems.filter(isRenderableLikertItem);
      const deliveryType = classifyBlockDelivery(block);

      blocks.push({
        blockIndex: bi,
        blockKey: `${pi}-${bi}`,
        moduleId: flowBlockModuleId(loaded.key, pi, bi),
        phase: phase.phase,
        block: block.block,
        format: block.format,
        pool: block.pool ?? block.construct_pool ?? null,
        gameModule: block.module ?? block.game_module ?? null,
        targetCount: block.target_count ?? itemIds.length,
        itemIds,
        itemsResolved: resolvedItems.length,
        itemsRenderable: renderableItems.length,
        missingIds,
        deliveryType,
        adaptive: block.adaptive ?? null,
        antiBias: block.anti_bias ?? block.antiBias ?? null,
        playable: deliveryType === "items" && renderableItems.length > 0
      });
    }

    phases.push({
      phaseIndex: pi,
      phase: phase.phase,
      blocks
    });
  }

  const stats = {
    totalBlocks: phases.reduce((n, p) => n + p.blocks.length, 0),
    playableBlocks: phases.reduce(
      (n, p) => n + p.blocks.filter((b) => b.playable).length,
      0
    ),
    gameBlocks: phases.reduce(
      (n, p) => n + p.blocks.filter((b) => b.deliveryType === "game").length,
      0
    ),
    clarificationBlocks: phases.reduce(
      (n, p) => n + p.blocks.filter((b) => b.deliveryType === "clarification").length,
      0
    ),
    missingItemRefs: phases.reduce(
      (n, p) => n + p.blocks.reduce((m, b) => m + b.missingIds.length, 0),
      0
    )
  };

  return {
    key: loaded.key,
    userFlow: loaded.userFlow,
    label: loaded.label,
    grade: loaded.grade,
    user: loaded.spec.user,
    purpose: loaded.spec.purpose,
    delivery: loaded.spec.delivery,
    durationMin: loaded.spec.duration_min,
    targetItems: loaded.spec.target_items,
    adaptiveRules: loaded.spec.adaptive_rules ?? null,
    biasControls: loaded.spec.bias_controls ?? null,
    report: loaded.spec.report ?? null,
    phases,
    stats
  };
}

/**
 * @param {string} userFlowKey
 * @param {number} phaseIndex
 * @param {number} blockIndex
 */
export function getUserFlowBlockContent(userFlowKey, phaseIndex, blockIndex) {
  const flow = resolveUserFlow(userFlowKey);
  if (!flow) return null;

  const phase = flow.phases[phaseIndex];
  if (!phase) return null;
  const block = phase.blocks[blockIndex];
  if (!block) return null;

  const loaded = loadUserFlowSpec(userFlowKey);
  const bank = getUserFlowBank(loaded.bankKey);
  const itemById = new Map((bank?.items ?? []).map((item) => [item.item_id, item]));

  const items = (block.itemIds ?? [])
    .map((id) => itemById.get(id))
    .filter(Boolean)
    .filter(isRenderableLikertItem)
    .map(archiveItemToLikert);

  if (!items.length) {
    return {
      moduleId: block.moduleId,
      userFlow: flow.userFlow,
      phaseIndex,
      blockIndex,
      deliveryType: block.deliveryType,
      engineType: null,
      source: "archive",
      config: null,
      itemCount: 0
    };
  }

  return {
    moduleId: block.moduleId,
    userFlow: flow.userFlow,
    phaseIndex,
    blockIndex,
    phase: block.phase,
    block: block.block,
    deliveryType: "items",
    engineType: "likert",
    source: "archive",
    config: {
      moduleId: block.moduleId,
      engineType: "likert",
      title: `${block.block}`,
      estimatedMinutes: Math.max(3, Math.ceil(items.length * 0.4)),
      scoring: { provider: "rule", constructs: [block.pool ?? "USER_FLOW"].filter(Boolean) },
      fastResponseMs: 5500,
      hesitationMs: 11000,
      checkpointInterval: 5,
      autoAdvanceOnSelect: true,
      items,
      source: "archive",
      userFlowMeta: {
        userFlow: flow.userFlow,
        phase: block.phase,
        block: block.block,
        pool: block.pool
      }
    },
    itemCount: items.length
  };
}

/**
 * @param {string} moduleId UF-user3-p1-b0
 */
export function getUserFlowBlockContentByModuleId(moduleId) {
  const parsed = parseFlowBlockModuleId(moduleId);
  if (!parsed) return null;
  return getUserFlowBlockContent(parsed.userFlowKey, parsed.phaseIndex, parsed.blockIndex);
}

export function verifyUserFlows() {
  const reports = [];
  for (const key of Object.keys(USER_FLOW_SPECS)) {
    const flow = resolveUserFlow(key);
    if (!flow) {
      reports.push({ key, error: "Failed to load" });
      continue;
    }
    reports.push({
      key,
      userFlow: flow.userFlow,
      label: flow.label,
      phases: flow.phases.length,
      stats: flow.stats
    });
  }
  return reports;
}

export function clearUserFlowCache() {
  _indexCache = null;
  _specCache.clear();
}
