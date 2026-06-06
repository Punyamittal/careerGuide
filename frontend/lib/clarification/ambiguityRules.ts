/**
 * Frozen U1–U17 ambiguity rule registry (MBS Clarification V2).
 * Source: backend/exports/archive/MBS_Ambiguity_Rules_U1_U17.json
 */

export type RuleId =
  | "U1"
  | "U2"
  | "U3"
  | "U4"
  | "U5"
  | "U6"
  | "U7"
  | "U8"
  | "U9"
  | "U10"
  | "U11"
  | "U12"
  | "U13"
  | "U14"
  | "U15"
  | "U16"
  | "U17";

export type JourneyId =
  | "J1"
  | "J2"
  | "J2-NEG"
  | "J3"
  | "J4"
  | "J5"
  | "J6"
  | "J7"
  | "J8";

export interface AmbiguityRuleDefinition {
  ruleId: RuleId;
  name: string;
  /** Lower number = higher routing priority among journeys (1 is highest). */
  priority: number;
  journeys: JourneyId[] | ["ALL"];
  force?: boolean;
  forceWhen?: RuleId[];
  action?: string;
  modifiers?: Record<string, unknown>;
  blockReportIf?: string;
  why: string;
}

export interface JourneyDefinition {
  journeyId: JourneyId;
  name: string;
  priority: number;
  ambiguityRules: RuleId[];
  forceWhen?: RuleId[];
  simInjection: string[];
  itemsPerSession: { min: number; max: number };
  simSubstitution?: { U17?: string[]; default?: string[] };
}

export interface MultiTriggerPolicy {
  maxJourneysDefault: number;
  maxJourneysExtended: number;
  extendedWhen: {
    u10: boolean;
    u5AndU12: boolean;
    u4AndU11AndU10: boolean;
    firedRuleCountGte: number;
  };
}

/** Construct families used for journey overlap / conflict resolution. */
export const JOURNEY_CONSTRUCT_OVERLAP: Record<JourneyId, readonly string[]> = {
  J4: ["Integrity", "ECO-DOMAIN"],
  "J2-NEG": ["NEG-SKILL", "NEG-INT", "NEG-TRADE", "NEG-REL", "NEG-JV"],
  J1: ["COMM", "EQ"],
  J7: ["LRN"],
  J2: ["TEAM", "CONF", "SS-SELF"],
  J3: ["DEC", "stress", "BIG5-C"],
  J8: ["APT", "I-NUM", "I-VERB", "I-ABS", "SS-PS"],
  J5: ["OWV", "ENT", "WST", "path_branch"],
  J6: ["ECO-SECTOR", "ECO-TOOLS", "ECO-TREND", "ECO-COMPLIANCE"]
};

export const CONFIDENCE_FLOOR = 0.65;

export const AMBIGUITY_RULES: readonly AmbiguityRuleDefinition[] = [
  {
    ruleId: "U1",
    name: "Cross-method divergence",
    priority: 2,
    journeys: ["J1"],
    why: "COMM/EQ methods disagree or confidence below floor"
  },
  {
    ruleId: "U2",
    name: "Sim vs rubric conflict",
    priority: 3,
    journeys: ["J2"],
    why: "Team cooperation vs conflict style divergence"
  },
  {
    ruleId: "U3",
    name: "Speed vs quality",
    priority: 4,
    journeys: ["J3"],
    why: "Fast in-tray with wrong trap priority"
  },
  {
    ruleId: "U4",
    name: "Deliberation paradox",
    priority: 4,
    journeys: ["J3"],
    why: "Two Doors clue/time paradox"
  },
  {
    ruleId: "U5",
    name: "Integrity vs resume boast",
    priority: 1,
    journeys: ["J4"],
    why: "Integrity signals conflict with resume claims"
  },
  {
    ruleId: "U6",
    name: "Values/path ambiguous",
    priority: 5,
    journeys: ["J5"],
    why: "Flat values allocation or ambiguous path signal"
  },
  {
    ruleId: "U7",
    name: "Domain vs resume",
    priority: 6,
    journeys: ["J6"],
    why: "Applied domain knowledge vs resume sector mismatch"
  },
  {
    ruleId: "U8",
    name: "Ecosystem trend misalignment",
    priority: 6,
    journeys: ["J6"],
    why: "Trend radar precision low for declared sector"
  },
  {
    ruleId: "U9",
    name: "Work style triangulation gap",
    priority: 5,
    journeys: ["J5"],
    why: "Work Styles Arena vs SJT divergence"
  },
  {
    ruleId: "U10",
    name: "Validity band caution",
    priority: 1,
    journeys: ["J4"],
    force: true,
    why: "Careless or impression-managed responding"
  },
  {
    ruleId: "U11",
    name: "Stress construct split",
    priority: 4,
    journeys: ["J3"],
    why: "Crisis Commander vs in-tray stress divergence"
  },
  {
    ruleId: "U12",
    name: "Negotiation unknown",
    priority: 2,
    journeys: ["J2-NEG"],
    forceWhen: ["U12"],
    why: "Negotiation sim missing or NEG-SKILL confidence low"
  },
  {
    ruleId: "U13",
    name: "Learning agility rule-change failure",
    priority: 3,
    journeys: ["J7"],
    why: "Format Lab rule-change gain below threshold"
  },
  {
    ruleId: "U14",
    name: "Aptitude vs problem-solving split",
    priority: 4,
    journeys: ["J8"],
    why: "CAT aptitude diverges from applied problem-solving"
  },
  {
    ruleId: "U15",
    name: "Accommodation required",
    priority: 0,
    journeys: ["ALL"],
    modifiers: {
      latency_penalty_disabled: true,
      timed_sim_multiplier: 1.5,
      crisis_commander_use_tap_rank: true,
      min_item_time_floor_sec: 3
    },
    why: "Accommodation flags active — global modifiers only"
  },
  {
    ruleId: "U16",
    name: "Item exposure limit",
    priority: 0,
    journeys: ["ALL"],
    action: "exclude_item_force_alternate_pool",
    why: "Item exposure cap reached — pool rotation"
  },
  {
    ruleId: "U17",
    name: "Simulation repetition guard",
    priority: 4,
    journeys: ["J3"],
    action: "substitute_sim",
    why: "Primary in-tray strong — substitute clar sim"
  }
] as const;

export const JOURNEY_DEFINITIONS: readonly JourneyDefinition[] = [
  {
    journeyId: "J4",
    name: "Integrity & Evidence Validation",
    priority: 1,
    ambiguityRules: ["U5", "U10"],
    forceWhen: ["U10"],
    simInjection: ["SIM-HONEST-DICE"],
    itemsPerSession: { min: 6, max: 12 }
  },
  {
    journeyId: "J2-NEG",
    name: "Negotiation & Scope",
    priority: 2,
    ambiguityRules: ["U12"],
    forceWhen: ["U12"],
    simInjection: ["SIM-NEGOTIATION-NPC-V2"],
    itemsPerSession: { min: 4, max: 8 }
  },
  {
    journeyId: "J1",
    name: "Communication & EQ",
    priority: 2,
    ambiguityRules: ["U1"],
    simInjection: ["SIM-READ-THE-ROOM"],
    itemsPerSession: { min: 6, max: 12 }
  },
  {
    journeyId: "J7",
    name: "Learning Agility Clarification",
    priority: 3,
    ambiguityRules: ["U13"],
    simInjection: ["SIM-FORMAT-LAB-CLAR"],
    itemsPerSession: { min: 4, max: 6 }
  },
  {
    journeyId: "J2",
    name: "Collaboration & Conflict",
    priority: 3,
    ambiguityRules: ["U2"],
    simInjection: ["SIM-TEAM-CHAT-MICRO", "SIM-CONFLICT-BRANCH"],
    itemsPerSession: { min: 6, max: 10 }
  },
  {
    journeyId: "J3",
    name: "Decision Making & Stress",
    priority: 4,
    ambiguityRules: ["U3", "U4", "U11", "U17"],
    simInjection: ["SIM-IN-TRAY-MINI", "SIM-TWO-DOORS", "SIM-CRISIS-COMMANDER"],
    simSubstitution: {
      U17: ["SIM-PRESSURE-COOKER-CLAR", "SIM-SPOT-THE-BREAK-CLAR"],
      default: ["SIM-IN-TRAY-MINI"]
    },
    itemsPerSession: { min: 6, max: 12 }
  },
  {
    journeyId: "J8",
    name: "Aptitude Micro-Clarification",
    priority: 4,
    ambiguityRules: ["U14"],
    simInjection: [],
    itemsPerSession: { min: 4, max: 6 }
  },
  {
    journeyId: "J5",
    name: "Career Path Clarification",
    priority: 5,
    ambiguityRules: ["U6", "U9"],
    simInjection: ["SIM-TRADE-OFF-ISLAND", "SIM-WORK-STYLES-ARENA-CLAR"],
    itemsPerSession: { min: 6, max: 12 }
  },
  {
    journeyId: "J6",
    name: "Domain Readiness Validation",
    priority: 6,
    ambiguityRules: ["U7", "U8"],
    simInjection: [
      "SIM-SECTOR-MATCH",
      "SIM-TREND-RADAR",
      "SIM-EXPERT-CHALLENGE-CLAR"
    ],
    itemsPerSession: { min: 6, max: 10 }
  }
];

export const MULTI_TRIGGER_POLICY: MultiTriggerPolicy = {
  maxJourneysDefault: 2,
  maxJourneysExtended: 3,
  extendedWhen: {
    u10: true,
    u5AndU12: true,
    u4AndU11AndU10: true,
    firedRuleCountGte: 4
  }
};

export function getRuleDefinition(ruleId: RuleId): AmbiguityRuleDefinition | undefined {
  return AMBIGUITY_RULES.find((r) => r.ruleId === ruleId);
}

export function getJourneyDefinition(journeyId: JourneyId): JourneyDefinition | undefined {
  return JOURNEY_DEFINITIONS.find((j) => j.journeyId === journeyId);
}

export function journeysOverlap(a: JourneyId, b: JourneyId): boolean {
  const setA = new Set(JOURNEY_CONSTRUCT_OVERLAP[a] ?? []);
  const setB = new Set(JOURNEY_CONSTRUCT_OVERLAP[b] ?? []);
  for (const key of setA) {
    if (setB.has(key)) return true;
  }
  return false;
}
