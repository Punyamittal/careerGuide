import {
  listUserFlowBanks,
  getUserFlowBank,
  getEcosystemBank,
  getBankVersion,
  verifyBankIntegrity,
  getGlobalItemIndex
} from "../modules/assessment-bank/loader.js";
import {
  buildLikertModuleConfig,
  buildScoringRules,
  resolveEngineType,
  getModuleArchiveItems
} from "../modules/assessment-bank/likertAdapter.js";
import {
  listUserFlowSpecs,
  resolveUserFlow,
  getUserFlowBlockContent,
  getUserFlowBlockContentByModuleId,
  verifyUserFlows
} from "../modules/assessment-bank/userFlowLoader.js";
import { parseFlowBlockModuleId } from "../modules/assessment-bank/userFlowConstants.js";
import { getModuleById } from "../constants/mbsModuleRegistry.js";
import { MODULE_ITEM_RULES } from "../modules/assessment-bank/moduleMapper.js";
import { PROCEDURAL_MODULE_IDS } from "../modules/assessment-bank/constants.js";

export function listBanks() {
  return {
    version: getBankVersion(),
    userFlows: listUserFlowBanks(),
    ecosystem: {
      itemCount: getEcosystemBank().items.length,
      meta: getEcosystemBank().meta
    },
    globalItemCount: getGlobalItemIndex().length
  };
}

/**
 * @param {string} userFlowKey
 */
export function getBankByUserFlow(userFlowKey) {
  return getUserFlowBank(userFlowKey);
}

export function getEcosystemItems() {
  return getEcosystemBank();
}

export function listUserFlows() {
  return {
    version: getBankVersion(),
    flows: listUserFlowSpecs()
  };
}

/**
 * @param {string} userFlowKey
 */
export function getUserFlow(userFlowKey) {
  return resolveUserFlow(userFlowKey);
}

/**
 * @param {string} userFlowKey
 * @param {number} phaseIndex
 * @param {number} blockIndex
 */
export function getFlowBlockContent(userFlowKey, phaseIndex, blockIndex) {
  return getUserFlowBlockContent(userFlowKey, phaseIndex, blockIndex);
}

export function runUserFlowVerification() {
  return verifyUserFlows();
}

/**
 * @param {string} moduleId
 * @param {{ shuffle?: boolean; seed?: string; adaptiveDifficulty?: number; userFlow?: string; limit?: number }} [opts]
 */
export function getModuleContent(moduleId, opts = {}) {
  if (parseFlowBlockModuleId(moduleId)) {
    const block = getUserFlowBlockContentByModuleId(moduleId);
    if (!block) return null;
    return {
      moduleId: block.moduleId,
      engineType: block.engineType ?? "likert",
      source: block.source ?? "archive",
      config: block.config,
      itemCount: block.itemCount ?? 0,
      bankVersion: getBankVersion(),
      userFlowMeta: block.config?.userFlowMeta ?? null
    };
  }
  const mod = getModuleById(moduleId);
  if (!mod) return null;

  const normalizedId = mod.id;
  if (PROCEDURAL_MODULE_IDS.has(normalizedId)) {
    return {
      moduleId: normalizedId,
      engineType: mod.engineType,
      source: "procedural",
      config: null,
      itemCount: 0,
      bankVersion: getBankVersion()
    };
  }

  const config = buildLikertModuleConfig(normalizedId, opts);
  const engineType = config ? resolveEngineType(normalizedId) : mod.engineType;

  return {
    moduleId: normalizedId,
    engineType,
    source: config ? "archive" : "static_fallback",
    config,
    itemCount: config?.items?.length ?? 0,
    bankVersion: getBankVersion(),
    archiveItemIds: getModuleArchiveItems(normalizedId).map((i) => i.item_id)
  };
}

/**
 * @param {string} moduleId
 */
export function getModuleScoringFromBank(moduleId) {
  if (parseFlowBlockModuleId(moduleId)) {
    const block = getUserFlowBlockContentByModuleId(moduleId);
    if (!block?.config?.items?.length) return null;
    return {
      engineType: "likert",
      constructs: block.config.scoring?.constructs ?? [],
      items: block.config.items.map((item) => ({
        id: item.id,
        type: item.type,
        reverse: item.reverse,
        idealIndex: item.idealIndex,
        scoringWeight: item.scoringWeight
      }))
    };
  }
  return buildScoringRules(moduleId);
}

export function runVerification() {
  const integrity = verifyBankIntegrity();
  const globalItems = getGlobalItemIndex();
  const warnings = [];

  const moduleCoverage = {};
  for (const moduleId of Object.keys(MODULE_ITEM_RULES)) {
    const items = getModuleArchiveItems(moduleId);
    moduleCoverage[moduleId] = items.length;
    if (items.length === 0) {
      warnings.push(`Module ${moduleId} has mapping rules but 0 archive items`);
    }
  }

  const itemsMissingConstructs = globalItems
    .filter((item) => !item.constructs_fed?.trim())
    .map((item) => item.item_id);

  return {
    ...integrity,
    moduleCoverage,
    warnings,
    itemsMissingConstructs: itemsMissingConstructs.slice(0, 50),
    itemsMissingConstructsCount: itemsMissingConstructs.length
  };
}
