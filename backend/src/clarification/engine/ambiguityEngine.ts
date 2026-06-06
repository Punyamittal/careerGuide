import {
  AMBIGUITY_RULES,
  getJourneyDefinition,
  getRuleDefinition,
  JOURNEY_DEFINITIONS,
  journeysOverlap,
  MULTI_TRIGGER_POLICY,
  type JourneyId,
  type RuleId
} from "./ambiguityRules.js";
import {
  evaluateAllRules,
  type RuleEvaluationResult,
  type RuleEvaluatorInput
} from "./ruleEvaluator.js";

export interface AmbiguityEngineInput extends RuleEvaluatorInput {}

export interface TriggeredRule {
  ruleId: RuleId;
  name: string;
  priority: number;
  journeys: JourneyId[] | ["ALL"];
  forced: boolean;
  message: string;
  details: RuleEvaluationResult["details"];
  action?: string;
  modifiers?: Record<string, unknown>;
}

export interface JourneyAssignment {
  journeyId: JourneyId;
  name: string;
  priority: number;
  forced: boolean;
  triggeredBy: RuleId[];
  itemsPlanned: { min: number; max: number };
  simInjection: string[];
  simSubstitution?: string[];
}

export interface ExplainabilityLog {
  timestamp: string;
  step: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface AmbiguityEngineOutput {
  triggeredRules: TriggeredRule[];
  /** Minimum journey priority among selected journeys (1 = most urgent). */
  priority: number | null;
  journeysToRun: JourneyAssignment[];
  explainability: ExplainabilityLog[];
  modifiers: Record<string, unknown>;
  extendedMode: boolean;
  maxJourneys: number;
  skippedDueToConflict: JourneyId[];
}

export interface AmbiguityEngineOptions {
  /** Override evaluators for unit tests. */
  evaluators?: Parameters<typeof evaluateAllRules>[1];
  now?: () => Date;
}

function log(
  logs: ExplainabilityLog[],
  step: string,
  message: string,
  data?: Record<string, unknown>,
  now: () => Date = () => new Date()
): void {
  logs.push({
    timestamp: now().toISOString(),
    step,
    message,
    data
  });
}

function isJourneyRoutingRule(ruleId: RuleId): boolean {
  return ruleId !== "U15" && ruleId !== "U16";
}

function buildTriggeredRules(
  results: RuleEvaluationResult[]
): TriggeredRule[] {
  return results
    .filter((r) => r.triggered)
    .map((r) => {
      const def = getRuleDefinition(r.ruleId)!;
      const forced =
        def.force === true ||
        (def.forceWhen?.includes(r.ruleId) ?? false) ||
        r.ruleId === "U10";
      return {
        ruleId: r.ruleId,
        name: def.name,
        priority: def.priority,
        journeys: def.journeys[0] === "ALL" ? (["ALL"] as ["ALL"]) : (def.journeys as JourneyId[]),
        forced: forced || r.ruleId === "U10" || r.ruleId === "U12",
        message: r.message,
        details: r.details,
        action: def.action,
        modifiers: def.modifiers
      };
    });
}

function collectModifiers(triggered: TriggeredRule[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const rule of triggered) {
    if (rule.modifiers) Object.assign(out, rule.modifiers);
    if (rule.ruleId === "U17") out.sim_substitution = "U17";
  }
  return out;
}

function needsExtendedMode(firedIds: RuleId[]): boolean {
  const p = MULTI_TRIGGER_POLICY.extendedWhen;
  return (
    (p.u10 && firedIds.includes("U10")) ||
    (p.u5AndU12 && firedIds.includes("U5") && firedIds.includes("U12")) ||
    (p.u4AndU11AndU10 &&
      firedIds.includes("U4") &&
      firedIds.includes("U11") &&
      firedIds.includes("U10")) ||
    firedIds.length >= p.firedRuleCountGte
  );
}

interface JourneyCandidate {
  journeyId: JourneyId;
  priority: number;
  forced: boolean;
  rules: RuleId[];
}

function buildJourneyCandidates(triggered: TriggeredRule[]): JourneyCandidate[] {
  const map = new Map<JourneyId, JourneyCandidate>();

  for (const rule of triggered) {
    if (!isJourneyRoutingRule(rule.ruleId)) continue;
    if (rule.journeys[0] === "ALL") continue;

    for (const journeyId of rule.journeys as JourneyId[]) {
      const def = getJourneyDefinition(journeyId);
      const existing = map.get(journeyId);
      if (existing) {
        existing.rules.push(rule.ruleId);
        existing.forced = existing.forced || rule.forced;
        existing.priority = Math.min(existing.priority, def?.priority ?? rule.priority);
      } else {
        map.set(journeyId, {
          journeyId,
          priority: def?.priority ?? rule.priority,
          forced: rule.forced,
          rules: [rule.ruleId]
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => {
    if (a.forced !== b.forced) return a.forced ? -1 : 1;
    return a.priority - b.priority;
  });
}

function resolveJourneyConflicts(
  candidates: JourneyCandidate[],
  maxSlots: number,
  logs: ExplainabilityLog[],
  now: () => Date
): { selected: JourneyCandidate[]; skipped: JourneyId[] } {
  const selected: JourneyCandidate[] = [];
  const skipped: JourneyId[] = [];

  for (const candidate of candidates) {
    if (selected.length >= maxSlots) {
      skipped.push(candidate.journeyId);
      continue;
    }

    const overlaps = selected.some(
      (s) =>
        s.journeyId !== candidate.journeyId &&
        journeysOverlap(s.journeyId, candidate.journeyId)
    );

    if (overlaps && !candidate.forced) {
      skipped.push(candidate.journeyId);
      log(logs, "conflict_resolution", `Skipped ${candidate.journeyId} — construct overlap`, {
        candidate: candidate.journeyId,
        selected: selected.map((s) => s.journeyId)
      }, now);
      continue;
    }

    if (overlaps && candidate.forced) {
      const idx = selected.findIndex(
        (s) => !s.forced && journeysOverlap(s.journeyId, candidate.journeyId)
      );
      if (idx >= 0) {
        skipped.push(selected[idx].journeyId);
        selected.splice(idx, 1);
        log(logs, "conflict_resolution", `Replaced journey slot for forced ${candidate.journeyId}`, {
          replaced: skipped[skipped.length - 1]
        }, now);
      }
    }

    selected.push(candidate);
  }

  for (const forced of candidates.filter((c) => c.forced)) {
    if (!selected.find((s) => s.journeyId === forced.journeyId)) {
      if (selected.length >= maxSlots) {
        const idx = selected.findIndex((s) => !s.forced);
        if (idx >= 0) {
          skipped.push(selected[idx].journeyId);
          selected.splice(idx, 1);
        }
      }
      if (selected.length < maxSlots) selected.push(forced);
    }
  }

  selected.sort((a, b) => a.priority - b.priority);
  return { selected, skipped };
}

function toJourneyAssignments(
  selected: JourneyCandidate[],
  modifiers: Record<string, unknown>,
  firedRules: RuleId[]
): JourneyAssignment[] {
  return selected.map((c) => {
    const def = getJourneyDefinition(c.journeyId)!;
    let simInjection = [...def.simInjection];
    let simSubstitution: string[] | undefined;

    if (c.journeyId === "J3" && modifiers.sim_substitution === "U17" && def.simSubstitution?.U17) {
      simSubstitution = def.simSubstitution.U17;
      simInjection = simSubstitution;
    }

    if (firedRules.includes("U12") && c.journeyId === "J2-NEG") {
      simInjection = ["SIM-NEGOTIATION-NPC-V2"];
    }

    return {
      journeyId: c.journeyId,
      name: def.name,
      priority: c.priority,
      forced: c.forced,
      triggeredBy: c.rules,
      itemsPlanned: def.itemsPerSession,
      simInjection,
      simSubstitution
    };
  });
}

/**
 * Main entry: evaluate U1–U17, resolve conflicts, select clarification journeys.
 */
export function evaluateAmbiguity(
  input: AmbiguityEngineInput,
  options: AmbiguityEngineOptions = {}
): AmbiguityEngineOutput {
  const now = options.now ?? (() => new Date());
  const explainability: ExplainabilityLog[] = [];

  log(explainability, "input_received", "Evaluating ambiguity engine input", {
    constructCount: Object.keys(input.constructScores).length,
    telemetryKeys: Object.keys(input.telemetry).length
  }, now);

  const ruleResults = evaluateAllRules(input, options.evaluators);
  const triggeredRules = buildTriggeredRules(ruleResults);

  log(explainability, "rules_evaluated", `${triggeredRules.length} rules triggered`, {
    ruleIds: triggeredRules.map((r) => r.ruleId)
  }, now);

  const firedIds = triggeredRules.map((r) => r.ruleId) as RuleId[];
  const modifiers = collectModifiers(triggeredRules);
  const extendedMode = needsExtendedMode(firedIds);
  const maxJourneys = extendedMode
    ? MULTI_TRIGGER_POLICY.maxJourneysExtended
    : MULTI_TRIGGER_POLICY.maxJourneysDefault;

  if (triggeredRules.length === 0) {
    log(explainability, "no_clarification", "No ambiguity rules fired — skip Phase 7.5", {}, now);
    return {
      triggeredRules: [],
      priority: null,
      journeysToRun: [],
      explainability,
      modifiers,
      extendedMode: false,
      maxJourneys: 0,
      skippedDueToConflict: []
    };
  }

  const candidates = buildJourneyCandidates(triggeredRules);
  log(explainability, "journey_candidates", `${candidates.length} journey candidates`, {
    journeys: candidates.map((c) => c.journeyId)
  }, now);

  const { selected, skipped } = resolveJourneyConflicts(
    candidates,
    maxJourneys,
    explainability,
    now
  );

  const journeysToRun = toJourneyAssignments(selected, modifiers, firedIds);
  const priority =
    journeysToRun.length > 0
      ? Math.min(...journeysToRun.map((j) => j.priority))
      : null;

  log(explainability, "journeys_selected", `${journeysToRun.length} journeys allocated`, {
    journeys: journeysToRun.map((j) => j.journeyId),
    extendedMode,
    maxJourneys
  }, now);

  return {
    triggeredRules,
    priority,
    journeysToRun,
    explainability,
    modifiers,
    extendedMode,
    maxJourneys,
    skippedDueToConflict: skipped
  };
}

/** Re-export rule registry count for sanity checks. */
export const RULE_COUNT = AMBIGUITY_RULES.length;
export const JOURNEY_COUNT = JOURNEY_DEFINITIONS.length;
