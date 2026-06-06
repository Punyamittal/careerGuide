/**
 * Maps assessment module IDs → archive item selection rules.
 * Uses construct tags, item ID prefixes, and block construct_pool values.
 */
export const MODULE_ITEM_RULES = {
  M01: { constructTags: ["MASLOW"], idPrefixes: ["M-"] },
  M02: { constructTags: ["MCCLELLAND", "ACHIEVE", "POWER", "AFFIL"] },
  M03: { constructTags: ["DWECK", "MINDSET", "GROWTH"] },
  M04: { constructTags: ["HERZBERG", "HYGIENE"], pools: ["game:m4"] },
  M05: { constructTags: ["EQUITY"], pools: ["game:m5"] },
  M06: { constructTags: ["REINFORCEMENT"] },
  M07: { constructTags: ["ATTRIBUTION", "ATT-"], pools: ["game:m7"] },
  M08: { constructTags: ["VROOM", "EXPECT"] },
  M09: { constructTags: ["PSYCAP", "GRIT", "HOPE", "OPTIM", "RESILI"] },
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
  SS02: { pools: ["comm"], idPrefixes: ["COMM-"], constructTags: ["COMM"] },
  SS03: { pools: ["teamwork", "team", "collab"], idPrefixes: ["TEAM-"], constructTags: ["TEAM"] },
  SS04: { constructTags: ["PROBLEM", "DEC-"], idPrefixes: ["DEC-", "SC-"] },
  W01: { idPrefixes: ["W-"], constructTags: ["W-EMO", "WELLBEING", "W-FIN", "W-SPI"] },
  LR01: { constructTags: ["LRN", "LEARNING", "LRND"], idPrefixes: ["LRND-"] },
  SC01: { constructTags: ["STRATEG", "STAKE", "SC-"], idPrefixes: ["SC-"] },
  /** Ecosystem knowledge — flat ECO-* items */
  ECO01: { idPrefixes: ["ECO-"], constructTags: ["ECO-"] },
  ECO: { idPrefixes: ["ECO-"], constructTags: ["ECO-"] }
};

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

  if (rules.idPrefixes?.some((p) => itemId.startsWith(p.toUpperCase()))) return true;

  if (rules.pools?.some((p) => pool === p.toLowerCase() || pool.includes(p.toLowerCase()))) {
    return true;
  }

  if (rules.constructTags?.some((tag) => constructs.includes(tag.toUpperCase()))) {
    return true;
  }

  return false;
}
