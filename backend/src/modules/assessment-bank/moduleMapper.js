/**
 * Maps assessment module IDs → archive item selection rules.
 * Tags use official archive `constructs_fed` codes (e.g. MCC-N-ACH, HZ-MOT, DWECK-GR).
 */
export const MODULE_ITEM_RULES = {
  M01: {
    constructTags: ["MASLOW", "SDT-REL", "SDT-COM", "SDT-AUT", "JCM-MM"],
    idPrefixes: ["M-00"],
    excludeConstructTags: ["HZ-", "EQT-", "MCC-N"]
  },
  M02: {
    constructTags: [
      "MCCLELLAND",
      "MCC-",
      "MCC-N-ACH",
      "MCC-N-POW",
      "MCC-N-AFF",
      "WST-ACH",
      "OWV-ACH",
      "ACHIEVE",
      "POWER",
      "AFFIL"
    ],
    idPrefixes: ["M-005"]
  },
  M03: {
    constructTags: ["DWECK", "DWECK-GR", "MINDSET", "GROWTH", "FIXED"]
  },
  M04: {
    constructTags: ["HERZBERG", "HZ-MOT", "HZ-HYG", "HYGIENE", "HYG"],
    idPrefixes: ["M-005", "M-006"],
    pools: ["game:m4"]
  },
  M05: {
    constructTags: ["EQUITY", "EQT-", "EQT-S", "EQU"],
    idPrefixes: ["M-006"]
  },
  M06: {
    constructTags: ["REINFORCEMENT", "REINFOR", "OPERANT", "SKINNER", "BEHAV"]
  },
  M07: {
    constructTags: ["ATTRIBUTION", "LOCUS", "WEINER", "ATT-LOC", "ATT-INT"],
    pools: ["game:m7"],
    excludeConstructTags: ["ATT-S", "ATTACHMENT"]
  },
  M08: {
    constructTags: ["VROOM", "EXPECT", "EXPECTANCY", "VALENCE", "INSTRUMENT"]
  },
  OB01: {
    constructTags: ["OB-PS", "OB-OCB", "OB-022", "OB-SC", "OB-"]
  },
  OB16: {
    constructTags: ["OB-PS", "OB-OCB", "OB-022", "OB-SC", "OB-"]
  },
  L01: {
    constructTags: ["LEAD", "TRANSFORM", "L-TRANS", "WST-INIT"],
    idPrefixes: ["L-"]
  },
  L02: {
    constructTags: ["LEAD", "TRANSACT", "L-TRANS"],
    idPrefixes: ["L-"]
  },
  L11: {
    constructTags: ["LEAD", "KATZ", "WST-"],
    idPrefixes: ["WST-", "L11-"]
  },
  L12: {
    constructTags: ["LEAD", "ACTION", "L-MED"],
    idPrefixes: ["L-"]
  },
  I06: {
    constructTags: ["BIAS", "COGNITIVE"],
    idPrefixes: ["I06-", "DEC-"]
  },
  LEN01: { constructTags: ["MASLOW", "MASLOW-"], idPrefixes: ["M-00", "W-"] },
  LEN02: { constructTags: ["HERZBERG", "HZ-"], idPrefixes: ["M-00"] },
  LEN03: { constructTags: ["EQUITY", "EQT-"], idPrefixes: ["M-00"] },
  LEN04: { constructTags: ["REINFOR", "REINFORCEMENT"], idPrefixes: ["M-00"] },
  M09: {
    constructTags: [
      "PSYCAP",
      "GRIT",
      "GRIT-PE",
      "HOPE",
      "OPTIM",
      "RESILI",
      "WST-PER",
      "NEG-PES",
      "PSYCAP-O",
      "PSYCAP-R"
    ]
  },
  P01: { constructTags: ["BIG5-O", "OPENNESS"], idPrefixes: ["P-"] },
  P02: { constructTags: ["BIG5-C", "CONSCIENT"], idPrefixes: ["P-"] },
  P03: { constructTags: ["BIG5-E", "EXTRAV"], idPrefixes: ["P-"] },
  P04: { constructTags: ["BIG5-A", "AGREE"], idPrefixes: ["P-"] },
  P05: { constructTags: ["BIG5-N", "NEUROT"], idPrefixes: ["P-"] },
  I01: { constructTags: ["GARDNER", "GMI"], idPrefixes: ["I-"] },
  I03: { constructTags: ["REASONING", "RAVEN", "MATRIX"], idPrefixes: ["I-"] },
  I09: { constructTags: ["VERBAL"], idPrefixes: ["I-"] },
  I10: { constructTags: ["NUMERICAL", "QUANT"], idPrefixes: ["I-"] },
  SS01: { constructTags: ["SELF_MANAGEMENT", "SS-"], idPrefixes: ["SS-"] },
  SS02: { pools: ["comm"], idPrefixes: ["COMM-"], constructTags: ["COMM", "SS-COMM"] },
  SS03: {
    pools: ["teamwork", "team", "collab"],
    idPrefixes: ["TEAM-"],
    constructTags: ["TEAM", "COLLAB"]
  },
  SS04: { constructTags: ["PROBLEM", "DEC-"], idPrefixes: ["DEC-", "SC-"] },
  W01: { idPrefixes: ["W-"], constructTags: ["W-EMO", "WELLBEING", "W-FIN", "W-SPI", "W-SOC"] },
  LR01: { constructTags: ["LRN", "LEARNING", "LRND"], idPrefixes: ["LRND-"] },
  SC01: { constructTags: ["STRATEG", "STAKE", "SC-"], idPrefixes: ["SC-"] },
  ECO01: { idPrefixes: ["ECO-"], constructTags: ["ECO-"] },
  ECO: { idPrefixes: ["ECO-"], constructTags: ["ECO-"] }
};

/** Motivation modules that may supplement from static TS configs when archive is sparse. */
export const MOTIVATION_MODULE_IDS = new Set([
  "M01",
  "M02",
  "M03",
  "M04",
  "M05",
  "M06",
  "M07",
  "M08",
  "M09"
]);

/**
 * @param {string} moduleId
 */
export function getModuleRules(moduleId) {
  const id = String(moduleId).trim().toUpperCase();
  const aliases = {
    M1: "M01",
    M2: "M02",
    M3: "M03",
    M4: "M04",
    M5: "M05",
    M6: "M06",
    M7: "M07",
    M8: "M08",
    M9: "M09",
    M11: "SS02",
    M12: "SS03"
  };
  const key = aliases[id] ?? id;
  return MODULE_ITEM_RULES[key] ?? null;
}

/**
 * @param {import('./loader.js').ArchiveItem} item
 * @param {ReturnType<typeof getModuleRules>} rules
 */
export function itemMatchesRules(item, rules) {
  if (!rules) return false;

  const itemId = String(item.item_id ?? "").toUpperCase();
  const pool = String(item.construct_pool ?? "").toLowerCase();
  const constructs = String(item.constructs_fed ?? "").toUpperCase();

  if (rules.excludeConstructTags?.some((tag) => constructs.includes(tag.toUpperCase()))) {
    return false;
  }

  if (rules.idPrefixes?.some((p) => itemId.startsWith(p.toUpperCase()))) return true;

  if (rules.pools?.some((p) => pool === p.toLowerCase() || pool.includes(p.toLowerCase()))) {
    return true;
  }

  if (rules.constructTags?.some((tag) => constructs.includes(tag.toUpperCase()))) {
    return true;
  }

  return false;
}

export function isMotivationModuleId(moduleId) {
  const rules = getModuleRules(moduleId);
  if (!rules) return false;
  const id = String(moduleId).trim().toUpperCase();
  const key = id.startsWith("M0") ? id : `M0${id.replace(/^M/, "")}`;
  return MOTIVATION_MODULE_IDS.has(key) || MOTIVATION_MODULE_IDS.has(id);
}
