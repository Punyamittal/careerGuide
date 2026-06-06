import { FUSION_V3 } from "../constants/clarification.constants.js";
import { getRoutingMatrix } from "../config/clarificationAssets.js";

const JOURNEY_OVERLAP = {
  J4: new Set(["Integrity", "ECO-DOMAIN"]),
  "J2-NEG": new Set(["NEG-SKILL", "NEG-INT", "NEG-TRADE"]),
  J1: new Set(["COMM", "EQ"]),
  J7: new Set(["LRN"]),
  J2: new Set(["TEAM", "CONF", "SS-SELF"]),
  J3: new Set(["DEC", "stress", "BIG5-C"]),
  J8: new Set(["APT", "I-NUM", "I-VERB", "I-ABS"]),
  J5: new Set(["OWV", "ENT", "WST", "path_branch"]),
  J6: new Set(["ECO-SECTOR", "ECO-TOOLS", "ECO-TREND"])
};

/**
 * @param {string} journeyA
 * @param {string} journeyB
 * @returns {boolean}
 */
function journeysOverlap(journeyA, journeyB) {
  const a = JOURNEY_OVERLAP[journeyA];
  const b = JOURNEY_OVERLAP[journeyB];
  if (!a || !b) return false;
  for (const key of a) {
    if (b.has(key)) return true;
  }
  return false;
}

/**
 * @param {Array<{ rule_id: string; journeys: string[]; force?: boolean }>} ruleDetails
 * @param {string[]} firedRules
 * @param {Record<string, unknown>} modifiers
 */
export function selectJourneys(ruleDetails, firedRules, modifiers = {}) {
  const routing = getRoutingMatrix();
  const journeyDefs = routing.journeys ?? [];

  /** @type {Map<string, { journeyId: string; priority: number; forced: boolean; rules: string[] }>} */
  const candidateMap = new Map();

  for (const detail of ruleDetails) {
    for (const journeyId of detail.journeys ?? []) {
      if (journeyId === "ALL") continue;
      const def = journeyDefs.find((j) => j.journey_id === journeyId);
      if (!def) continue;

      const existing = candidateMap.get(journeyId);
      if (existing) {
        existing.rules.push(detail.rule_id);
        existing.forced = existing.forced || Boolean(detail.force);
      } else {
        candidateMap.set(journeyId, {
          journeyId,
          priority: def.priority ?? 99,
          forced: Boolean(detail.force) || (def.force_when ?? []).some((r) => firedRules.includes(r)),
          rules: [detail.rule_id]
        });
      }
    }
  }

  let maxJourneys = routing.max_journeys_per_session ?? FUSION_V3.maxJourneysDefault;
  const extendedWhen = routing.three_journey_logic?.conditions ?? [];
  const needsExtended =
    firedRules.includes("U10") ||
    (firedRules.includes("U5") && firedRules.includes("U12")) ||
    firedRules.length >= 4;

  if (needsExtended) {
    maxJourneys = routing.max_journeys_extended ?? FUSION_V3.maxJourneysExtended;
  }

  const sorted = [...candidateMap.values()].sort((a, b) => {
    if (a.forced !== b.forced) return a.forced ? -1 : 1;
    return a.priority - b.priority;
  });

  /** @type {typeof sorted} */
  const selected = [];

  for (const candidate of sorted) {
    if (selected.length >= maxJourneys) break;

    const overlaps = selected.some((s) => journeysOverlap(s.journeyId, candidate.journeyId));
    if (overlaps && !candidate.forced) continue;

    selected.push(candidate);
  }

  for (const forced of sorted.filter((c) => c.forced)) {
    if (!selected.find((s) => s.journeyId === forced.journeyId)) {
      if (selected.length >= maxJourneys) {
        const idx = selected.findIndex((s) => !s.forced);
        if (idx >= 0) selected.splice(idx, 1);
      }
      if (selected.length < maxJourneys) selected.push(forced);
    }
  }

  selected.sort((a, b) => a.priority - b.priority);

  return {
    journeys: selected.map((s) => {
      const def = journeyDefs.find((j) => j.journey_id === s.journeyId);
      return {
        journeyId: s.journeyId,
        name: def?.name ?? s.journeyId,
        priority: s.priority,
        forced: s.forced,
        triggeredBy: s.rules,
        itemsPlanned: def?.items_per_session ?? { min: 4, max: 12 },
        simInjection: def?.sim_injection ?? [],
        simSubstitution: modifiers.sim_substitution === "U17" ? def?.sim_substitution : null
      };
    }),
    maxJourneys,
    extendedMode: needsExtended
  };
}
