import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  ARCHIVE_ROOT,
  BANK_VERSION,
  USER_FLOW_BANKS,
  ECOSYSTEM_BANK_FILE
} from "./constants.js";
import { validateBankSchema, findDuplicateItemIds } from "./schema.js";

/** @typedef {Object} ArchiveItem
 * @property {string} item_id
 * @property {string} stem
 * @property {string} native_type
 * @property {string} constructs_fed
 * @property {string} [reverse_for]
 * @property {string[]} [options]
 * @property {unknown} [key]
 * @property {string} [source]
 * @property {string} [phase]
 * @property {string} [block]
 * @property {string} [construct_pool]
 * @property {string} [delivery_format]
 * @property {string} [userFlow]
 * @property {string} [bankKey]
 */

/** @type {Map<string, unknown> | null} */
let _bankCache = null;
/** @type {ArchiveItem[] | null} */
let _flatIndex = null;

function readJson(relativePath) {
  const path = join(ARCHIVE_ROOT, relativePath);
  if (!existsSync(path)) {
    throw new Error(`Assessment bank asset not found: ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * @param {Record<string, unknown>} bank
 * @param {string} bankKey
 * @param {string} userFlow
 */
function flattenPhaseBank(bank, bankKey, userFlow) {
  /** @type {ArchiveItem[]} */
  const items = [];
  for (const phase of bank.phases ?? []) {
    for (const block of phase.blocks ?? []) {
      for (const raw of block.items ?? []) {
        items.push({
          ...raw,
          phase: phase.phase,
          block: block.block,
          construct_pool: block.construct_pool,
          delivery_format: block.delivery_format,
          userFlow,
          bankKey
        });
      }
    }
  }
  return items;
}

/**
 * @param {Record<string, unknown>} bank
 * @param {string} bankKey
 */
function flattenFlatBank(bank, bankKey) {
  return (bank.items ?? []).map((raw) => ({
    ...raw,
    construct_pool: "ecosystem",
    userFlow: "user-6",
    bankKey
  }));
}

function loadAllBanks() {
  if (_bankCache) return _bankCache;

  /** @type {Record<string, { meta: unknown; items: ArchiveItem[]; path: string }>} */
  const banks = {};

  for (const [key, spec] of Object.entries(USER_FLOW_BANKS)) {
    const raw = readJson(spec.file);
    const validation = validateBankSchema(raw, { kind: "phase_bank" });
    if (!validation.valid) {
      throw new Error(`Invalid bank ${spec.file}: ${validation.errors.join("; ")}`);
    }
    banks[key] = {
      meta: raw.meta,
      path: spec.file,
      items: flattenPhaseBank(raw, key, spec.userFlow)
    };
  }

  const ecoRaw = readJson(ECOSYSTEM_BANK_FILE);
  const ecoValidation = validateBankSchema(ecoRaw, { kind: "flat_bank" });
  if (!ecoValidation.valid) {
    throw new Error(`Invalid ecosystem bank: ${ecoValidation.errors.join("; ")}`);
  }
  banks.ecosystem = {
    meta: ecoRaw.meta,
    path: ECOSYSTEM_BANK_FILE,
    items: flattenFlatBank(ecoRaw, "ecosystem")
  };

  _bankCache = banks;
  return banks;
}

/**
 * Global deduplicated item index (later banks override earlier on same item_id).
 * @returns {ArchiveItem[]}
 */
export function getGlobalItemIndex() {
  if (_flatIndex) return _flatIndex;

  const banks = loadAllBanks();
  const order = ["user1", "user2", "user3", "user4", "user5", "user6", "ecosystem"];
  const byId = new Map();

  for (const key of order) {
    const bank = banks[key];
    if (!bank) continue;
    for (const item of bank.items) {
      byId.set(item.item_id, item);
    }
  }

  _flatIndex = [...byId.values()];
  return _flatIndex;
}

export function getBankVersion() {
  return BANK_VERSION;
}

export function listUserFlowBanks() {
  const banks = loadAllBanks();
  return Object.entries(USER_FLOW_BANKS).map(([key, spec]) => ({
    key,
    userFlow: spec.userFlow,
    label: spec.label,
    file: spec.file,
    itemCount: banks[key]?.items?.length ?? 0,
    meta: banks[key]?.meta ?? null
  }));
}

/**
 * @param {string} userFlowKey e.g. user6 or user-6
 */
export function getUserFlowBank(userFlowKey) {
  const normalized = userFlowKey.replace(/^user-/, "user");
  const banks = loadAllBanks();
  const spec = USER_FLOW_BANKS[normalized];
  if (!spec) return null;
  return {
    ...spec,
    key: normalized,
    version: BANK_VERSION,
    items: banks[normalized]?.items ?? [],
    meta: banks[normalized]?.meta ?? null,
    ecosystem: normalized === "user6" ? banks.ecosystem?.items ?? [] : []
  };
}

export function getEcosystemBank() {
  const banks = loadAllBanks();
  return {
    version: BANK_VERSION,
    meta: banks.ecosystem?.meta ?? null,
    items: banks.ecosystem?.items ?? []
  };
}

export function clearBankCache() {
  _bankCache = null;
  _flatIndex = null;
}

/**
 * Full integrity report for CI / verify script.
 */
export function verifyBankIntegrity() {
  const banks = loadAllBanks();
  const globalItems = getGlobalItemIndex();
  const duplicateIds = findDuplicateItemIds(
    Object.values(banks).flatMap((b) => b.items)
  );

  const perBankDuplicates = {};
  for (const [key, bank] of Object.entries(banks)) {
    perBankDuplicates[key] = findDuplicateItemIds(bank.items);
  }

  return {
    version: BANK_VERSION,
    archiveRoot: ARCHIVE_ROOT,
    bankCounts: Object.fromEntries(
      Object.entries(banks).map(([k, b]) => [k, b.items.length])
    ),
    globalUniqueItems: globalItems.length,
    crossBankDuplicateIds: duplicateIds,
    perBankDuplicateIds: perBankDuplicates,
    loaded: true
  };
}

export { ARCHIVE_ROOT };
