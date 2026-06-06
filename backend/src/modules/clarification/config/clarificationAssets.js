import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { env } from "../../../config/env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ARCHIVE_ROOT = join(__dirname, "../../../../exports/archive");

/** @type {Record<string, unknown> | null} */
let _ambiguityRules = null;
/** @type {Record<string, unknown> | null} */
let _routingMatrix = null;
/** @type {Record<string, unknown> | null} */
let _scoringMatrix = null;
/** @type {Record<string, unknown> | null} */
let _simLibrary = null;
/** @type {Record<string, unknown> | null} */
let _mergedBank = null;

function readJson(relativePath) {
  const customRoot = env.clarification.assetsDir;
  const path = customRoot
    ? join(customRoot, relativePath)
    : join(ARCHIVE_ROOT, relativePath);
  if (!existsSync(path)) {
    throw new Error(`Clarification asset not found: ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

export function getAmbiguityRules() {
  if (!_ambiguityRules) {
    _ambiguityRules = readJson("MBS_Ambiguity_Rules_U1_U17.json");
  }
  return _ambiguityRules;
}

export function getRoutingMatrix() {
  if (!_routingMatrix) {
    _routingMatrix = readJson("MBS_Clarification_Routing_Matrix_V2.json");
  }
  return _routingMatrix;
}

export function getScoringMatrix() {
  if (!_scoringMatrix) {
    _scoringMatrix = readJson("MBS_Clarification_Scoring_Matrix_V2.json");
  }
  return _scoringMatrix;
}

export function getSimulationLibrary() {
  if (!_simLibrary) {
    const base = readJson("MBS_Clarification_Simulation_Library.json");
    const v2 = readJson("MBS_Clarification_Simulation_Library_V2.json");
    _simLibrary = {
      ...base,
      ...v2.new_and_updated
    };
  }
  return _simLibrary;
}

function mergeBanks() {
  const v1 = readJson("MBS_QBank_User_6_Clarification.json");
  const v2 = readJson("MBS_QBank_User_6_Clarification_V2_Supplement.json");

  const v1Items = (v1.items ?? []).filter(
    (item) => !/^CLAR-J2-(0[1-9]|[12][0-9]|3[0-5])$/.test(item.item_id)
  );

  const supplementItems = [
    ...(v2.j2_v2_replacement ?? []),
    ...(v2.negotiation ?? []),
    ...(v2.learning_agility ?? []),
    ...(v2.aptitude ?? [])
  ];

  const byId = new Map();
  for (const item of v1Items) {
    byId.set(item.item_id, item);
  }
  for (const item of supplementItems) {
    byId.set(item.item_id, item);
  }

  return {
    meta: {
      version: 2,
      total: byId.size,
      v1_count: v1Items.length,
      v2_supplement_count: supplementItems.length
    },
    items: [...byId.values()],
    journeys: v1.journeys ?? [],
    journeys_added: v2.journeys_added ?? [],
    simulation_library: v1.simulation_library ?? {}
  };
}

export function getMergedQuestionBank() {
  if (!_mergedBank) {
    _mergedBank = mergeBanks();
  }
  return _mergedBank;
}

export function reloadClarificationAssets() {
  _ambiguityRules = null;
  _routingMatrix = null;
  _scoringMatrix = null;
  _simLibrary = null;
  _mergedBank = null;
}
