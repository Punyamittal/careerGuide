import {
  CONFIDENCE_FLOOR,
  type RuleId
} from "./ambiguityRules.js";

export interface TelemetrySnapshot {
  in_tray_tau?: number;
  in_tray_time_to_first_action_ms?: number;
  trap_rank?: number;
  two_doors_clues?: number;
  two_doors_time_to_decide_s?: number;
  crisis_commander_accuracy?: number;
  in_tray_stress_index?: number;
  team_chat_cooperation_score?: number;
  conflict_branch_style?: "compete" | "collaborate" | "avoid" | "accommodate" | "compromise";
  format_lab_rule_change_gain?: number;
  lrn_primary_format_delta?: number;
  trend_radar_precision?: number;
  expert_challenge_accuracy?: number;
  eco_accuracy?: number;
  ent_signal?: number;
  job_signal?: number;
  trade_off_entropy?: number;
  path_branch_conf?: number;
  neg_sim_telemetry_missing?: boolean;
  work_styles_arena_vector_conf?: number;
  wst_sjt_divergence_z?: number;
  in_tray_completed_primary?: boolean;
  sim_completed_in_tray?: boolean;
}

export interface ValidityFlags {
  validity_band?: "high" | "interpret_with_caution";
  attention_fail?: boolean;
  long_string_flag?: boolean;
  honest_dice_overreport?: number;
  eco_d02_fake_familiarity?: number;
  resume_skill_mismatch?: number;
  resume_sector_mismatch?: boolean;
  negt_likert_used_for_negotiation?: boolean;
}

export interface SimulationResultEntry {
  simId: string;
  compositeScore?: number;
  dimensionScores?: Record<string, number>;
  telemetry?: Record<string, unknown>;
  success?: boolean;
}

export type SimulationResults = Record<string, SimulationResultEntry>;

export interface AptitudeResults {
  theta_verbal?: number;
  theta_numerical?: number;
  theta_abstract?: number;
  se_verbal?: number;
  se_numerical?: number;
  se_abstract?: number;
  ss_ps_verbal?: number;
  ss_ps_numerical?: number;
  method_divergence_z?: number;
}

export interface IntakeMeta {
  target_sector?: string;
  declared_sector?: string;
  region?: string;
}

export interface AccommodationFlags {
  intake_accommodation_flag?: boolean;
  latency_waiver_requested?: boolean;
  extended_time?: boolean;
}

export interface ExposureState {
  maxItemExposure?: number;
  itemsAtCap?: string[];
  stem_hash_seen_in_cohort?: number;
}

export interface RuleEvaluatorInput {
  constructScores: Record<string, number>;
  confidenceScores: Record<string, number>;
  telemetry: TelemetrySnapshot;
  simulationResults: SimulationResults;
  aptitudeResults: AptitudeResults;
  validityFlags: ValidityFlags;
  intakeMeta?: IntakeMeta;
  accommodation?: AccommodationFlags;
  exposure?: ExposureState;
}

export interface RuleEvaluationDetail {
  field: string;
  observed: unknown;
  threshold?: unknown;
  passed: boolean;
}

export interface RuleEvaluationResult {
  ruleId: RuleId;
  triggered: boolean;
  details: RuleEvaluationDetail[];
  message: string;
}

function conf(input: RuleEvaluatorInput, construct: string): number {
  return input.confidenceScores[construct] ?? 1;
}

function score(input: RuleEvaluatorInput, construct: string): number {
  return input.constructScores[construct] ?? 0;
}

function methodDivergenceZ(
  input: RuleEvaluatorInput,
  a: string,
  b: string
): number {
  const sa = score(input, a);
  const sb = score(input, b);
  const ca = conf(input, a);
  const cb = conf(input, b);
  const pooledSe = Math.sqrt((1 - ca) ** 2 + (1 - cb) ** 2) || 0.15;
  return Math.abs(sa - sb) / pooledSe;
}

function negSimMissing(input: RuleEvaluatorInput): boolean {
  if (input.telemetry.neg_sim_telemetry_missing === true) return true;
  const negSim = input.simulationResults["SIM-NEGOTIATION-NPC-V2"] ??
    input.simulationResults["SIM-NEGOTIATION-NPC"];
  return !negSim?.telemetry && negSim?.compositeScore == null;
}

type RuleEvaluatorFn = (input: RuleEvaluatorInput) => RuleEvaluationResult;

function result(
  ruleId: RuleId,
  triggered: boolean,
  details: RuleEvaluationDetail[],
  message: string
): RuleEvaluationResult {
  return { ruleId, triggered, details, message };
}

const evaluateU1: RuleEvaluatorFn = (input) => {
  const z = methodDivergenceZ(input, "COMM", "EQ");
  const commLow = conf(input, "COMM") < CONFIDENCE_FLOOR;
  const eqLow = conf(input, "EQ") < CONFIDENCE_FLOOR;
  const triggered = z > 1.0 || commLow || eqLow;
  return result(
    "U1",
    triggered,
    [
      { field: "method_divergence_z(COMM,EQ)", observed: z, threshold: 1.0, passed: z > 1.0 },
      { field: "conf(COMM)", observed: conf(input, "COMM"), threshold: CONFIDENCE_FLOOR, passed: commLow },
      { field: "conf(EQ)", observed: conf(input, "EQ"), threshold: CONFIDENCE_FLOOR, passed: eqLow }
    ],
    triggered
      ? "Communication/EQ cross-method ambiguity detected"
      : "COMM/EQ methods aligned above confidence floor"
  );
};

const evaluateU2: RuleEvaluatorFn = (input) => {
  const t = input.telemetry;
  const style = t.conflict_branch_style;
  const coop = t.team_chat_cooperation_score ?? 0;
  const z = t.wst_sjt_divergence_z ?? methodDivergenceZ(input, "TEAM", "CONF");
  const simConflict =
    coop >= 0.7 && (style === "compete" || style === "avoid") && z > 1.0;
  const teamLow = conf(input, "TEAM") < CONFIDENCE_FLOOR;
  const confLow = conf(input, "CONF") < CONFIDENCE_FLOOR;
  const triggered = simConflict || teamLow || confLow;
  return result(
    "U2",
    triggered,
    [
      { field: "team_chat_cooperation_score", observed: coop, threshold: 0.7, passed: coop >= 0.7 },
      { field: "conflict_branch_style", observed: style, passed: style === "compete" || style === "avoid" },
      { field: "z_diff(TEAM,CONF)", observed: z, threshold: 1.0, passed: z > 1.0 }
    ],
    triggered ? "Collaboration/conflict style ambiguity" : "Team/conflict signals consistent"
  );
};

const evaluateU3: RuleEvaluatorFn = (input) => {
  const tau = input.telemetry.in_tray_tau ?? 1;
  const trap = input.telemetry.trap_rank ?? 99;
  const speedQuality = tau < 0.5 && trap <= 2;
  const cLow = conf(input, "BIG5-C") < CONFIDENCE_FLOOR;
  const triggered = speedQuality || cLow;
  return result(
    "U3",
    triggered,
    [
      { field: "in_tray_tau", observed: tau, threshold: 0.5, passed: tau < 0.5 },
      { field: "trap_rank", observed: trap, threshold: 2, passed: trap <= 2 }
    ],
    triggered ? "In-tray speed/quality split" : "In-tray prioritisation acceptable"
  );
};

const evaluateU4: RuleEvaluatorFn = (input) => {
  const clues = input.telemetry.two_doors_clues ?? 0;
  const time = input.telemetry.two_doors_time_to_decide_s ?? 60;
  const paradoxA = clues >= 2 && time < 8;
  const paradoxB = clues === 0 && time > 120;
  const triggered = paradoxA || paradoxB;
  return result(
    "U4",
    triggered,
    [
      { field: "two_doors_clues", observed: clues, passed: clues >= 2 || clues === 0 },
      { field: "two_doors_time_to_decide_s", observed: time, passed: time < 8 || time > 120 }
    ],
    triggered ? "Two Doors deliberation paradox" : "Two Doors decision pattern normal"
  );
};

const evaluateU5: RuleEvaluatorFn = (input) => {
  const v = input.validityFlags;
  const over = (v.honest_dice_overreport ?? 0) > 0;
  const fake = (v.eco_d02_fake_familiarity ?? 0) >= 3.5;
  const resume = (v.resume_skill_mismatch ?? 0) >= 0.4;
  const triggered = over || fake || resume;
  return result(
    "U5",
    triggered,
    [
      { field: "honest_dice_overreport", observed: v.honest_dice_overreport, passed: over },
      { field: "eco_d02_fake_familiarity", observed: v.eco_d02_fake_familiarity, threshold: 3.5, passed: fake },
      { field: "resume_skill_mismatch", observed: v.resume_skill_mismatch, threshold: 0.4, passed: resume }
    ],
    triggered ? "Integrity vs resume claim conflict" : "Integrity evidence consistent"
  );
};

const evaluateU6: RuleEvaluatorFn = (input) => {
  const t = input.telemetry;
  const pathLow = (t.path_branch_conf ?? 1) < CONFIDENCE_FLOOR;
  const entropyHigh = (t.trade_off_entropy ?? 0) > 0.85;
  const ent = t.ent_signal;
  const job = t.job_signal;
  const entJobClose =
    ent != null &&
    job != null &&
    Math.abs(ent - job) < 0.12;
  const triggered = pathLow || entropyHigh || entJobClose;
  return result("U6", triggered, [
    { field: "path_branch_conf", observed: t.path_branch_conf, threshold: CONFIDENCE_FLOOR, passed: pathLow },
    { field: "trade_off_entropy", observed: t.trade_off_entropy, threshold: 0.85, passed: entropyHigh }
  ], triggered ? "Career path / values ambiguous" : "Career path signal clear");
};

const evaluateU7: RuleEvaluatorFn = (input) => {
  const t = input.telemetry;
  const v = input.validityFlags;
  const ecoLow = (t.eco_accuracy ?? 1) < 0.6;
  const sector = v.resume_sector_mismatch === true;
  const expertLow = (t.expert_challenge_accuracy ?? 1) < 0.55;
  const triggered = ecoLow || sector || expertLow;
  return result("U7", triggered, [
    { field: "eco_accuracy", observed: t.eco_accuracy, threshold: 0.6, passed: ecoLow },
    { field: "resume_sector_mismatch", observed: sector, passed: sector }
  ], triggered ? "Domain knowledge vs resume mismatch" : "Domain evidence aligned");
};

const evaluateU8: RuleEvaluatorFn = (input) => {
  const t = input.telemetry;
  const intake = input.intakeMeta ?? {};
  const precisionLow = (t.trend_radar_precision ?? 1) < 0.65;
  const sameSector = intake.target_sector === intake.declared_sector;
  const triggered = precisionLow && Boolean(sameSector);
  return result("U8", triggered, [
    { field: "trend_radar_precision", observed: t.trend_radar_precision, threshold: 0.65, passed: precisionLow }
  ], triggered ? "Sector trend literacy gap" : "Trend radar acceptable");
};

const evaluateU9: RuleEvaluatorFn = (input) => {
  const arenaLow = (input.telemetry.work_styles_arena_vector_conf ?? 1) < CONFIDENCE_FLOOR;
  const z = input.telemetry.wst_sjt_divergence_z ?? 0;
  const triggered = arenaLow || z > 1.0;
  return result("U9", triggered, [
    { field: "work_styles_arena_vector_conf", observed: input.telemetry.work_styles_arena_vector_conf, passed: arenaLow },
    { field: "wst_sjt_divergence_z", observed: z, threshold: 1.0, passed: z > 1.0 }
  ], triggered ? "Work style triangulation gap" : "Work style signals aligned");
};

const evaluateU10: RuleEvaluatorFn = (input) => {
  const v = input.validityFlags;
  const triggered =
    v.validity_band === "interpret_with_caution" ||
    v.attention_fail === true ||
    v.long_string_flag === true;
  return result("U10", triggered, [
    { field: "validity_band", observed: v.validity_band, passed: v.validity_band === "interpret_with_caution" },
    { field: "attention_fail", observed: v.attention_fail, passed: v.attention_fail === true }
  ], triggered ? "Validity caution — forced integrity journey" : "Validity band high");
};

const evaluateU11: RuleEvaluatorFn = (input) => {
  const t = input.telemetry;
  const crisis = t.crisis_commander_accuracy ?? 0;
  const stress = t.in_tray_stress_index ?? 0;
  const patternA = crisis >= 0.7 && stress < -0.3;
  const patternB = crisis < 0.5 && stress > 0.3;
  const triggered = patternA || patternB;
  return result("U11", triggered, [
    { field: "crisis_commander_accuracy", observed: crisis, passed: patternA || patternB },
    { field: "in_tray_stress_index", observed: stress, passed: patternA || patternB }
  ], triggered ? "Stress construct split" : "Stress measures consistent");
};

const evaluateU12: RuleEvaluatorFn = (input) => {
  const missing = negSimMissing(input);
  const negLow = conf(input, "NEG-SKILL") < CONFIDENCE_FLOOR;
  const negtUsed = input.validityFlags.negt_likert_used_for_negotiation === true;
  const triggered = missing || negLow || negtUsed;
  return result("U12", triggered, [
    { field: "neg_sim_telemetry_missing", observed: missing, passed: missing },
    { field: "conf(NEG-SKILL)", observed: conf(input, "NEG-SKILL"), threshold: CONFIDENCE_FLOOR, passed: negLow },
    { field: "negt_likert_used", observed: negtUsed, passed: negtUsed }
  ], triggered ? "Negotiation evidence insufficient" : "Negotiation sim evidence present");
};

const evaluateU13: RuleEvaluatorFn = (input) => {
  const gain = input.telemetry.format_lab_rule_change_gain ?? 1;
  const delta = input.telemetry.lrn_primary_format_delta ?? 1;
  const lrnLow = conf(input, "LRN") < CONFIDENCE_FLOOR;
  const triggered = gain < 0.15 || lrnLow || delta < 0.2;
  return result("U13", triggered, [
    { field: "format_lab_rule_change_gain", observed: gain, threshold: 0.15, passed: gain < 0.15 },
    { field: "conf(LRN)", observed: conf(input, "LRN"), passed: lrnLow }
  ], triggered ? "Learning agility adaptation gap" : "Learning agility evidence sufficient");
};

const evaluateU14: RuleEvaluatorFn = (input) => {
  const apt = input.aptitudeResults;
  const z = apt.method_divergence_z ?? methodDivergenceZ(input, "APT", "SS-PS");
  const verbalSplit =
    apt.theta_verbal != null &&
    apt.ss_ps_verbal != null &&
    Math.abs(apt.theta_verbal - apt.ss_ps_verbal) / (apt.se_verbal || 0.15) > 1.2;
  const aptLow = conf(input, "APT") < CONFIDENCE_FLOOR;
  const triggered = z > 1.0 || verbalSplit || aptLow;
  return result("U14", triggered, [
    { field: "method_divergence_z(APT,SS-PS)", observed: z, threshold: 1.0, passed: z > 1.0 },
    { field: "verbal_theta_split", observed: verbalSplit, passed: Boolean(verbalSplit) }
  ], triggered ? "Aptitude vs problem-solving split" : "Aptitude measures aligned");
};

const evaluateU15: RuleEvaluatorFn = (input) => {
  const a = input.accommodation ?? {};
  const triggered =
    a.intake_accommodation_flag === true || a.latency_waiver_requested === true;
  return result("U15", triggered, [
    { field: "intake_accommodation_flag", observed: a.intake_accommodation_flag, passed: triggered }
  ], triggered ? "Accommodation modifiers apply" : "No accommodation modifiers");
};

const evaluateU16: RuleEvaluatorFn = (input) => {
  const exp = input.exposure ?? {};
  const cap = exp.maxItemExposure ?? 3;
  const atCap = (exp.itemsAtCap?.length ?? 0) > 0;
  const cohort = (exp.stem_hash_seen_in_cohort ?? 0) >= 0.02;
  const triggered = atCap || cohort;
  return result("U16", triggered, [
    { field: "items_at_exposure_cap", observed: exp.itemsAtCap?.length ?? 0, threshold: cap, passed: atCap }
  ], triggered ? "Item pool rotation required" : "Exposure within limits");
};

const evaluateU17: RuleEvaluatorFn = (input) => {
  const t = input.telemetry;
  const completed = t.sim_completed_in_tray === true || t.in_tray_completed_primary === true;
  const tau = t.in_tray_tau ?? 0;
  const triggered = completed && tau >= 0.7;
  return result("U17", triggered, [
    { field: "in_tray_tau", observed: tau, threshold: 0.7, passed: tau >= 0.7 },
    { field: "sim_completed_in_tray", observed: completed, passed: completed }
  ], triggered ? "Skip in-tray re-run — use substitute sim" : "In-tray clar re-run allowed");
};

/** Pure evaluators keyed by rule ID — injectable for tests. */
export const RULE_EVALUATORS: Record<RuleId, RuleEvaluatorFn> = {
  U1: evaluateU1,
  U2: evaluateU2,
  U3: evaluateU3,
  U4: evaluateU4,
  U5: evaluateU5,
  U6: evaluateU6,
  U7: evaluateU7,
  U8: evaluateU8,
  U9: evaluateU9,
  U10: evaluateU10,
  U11: evaluateU11,
  U12: evaluateU12,
  U13: evaluateU13,
  U14: evaluateU14,
  U15: evaluateU15,
  U16: evaluateU16,
  U17: evaluateU17
};

/**
 * Evaluate a single rule with full explainability payload.
 */
export function evaluateRule(
  ruleId: RuleId,
  input: RuleEvaluatorInput,
  evaluators: Record<RuleId, RuleEvaluatorFn> = RULE_EVALUATORS
): RuleEvaluationResult {
  const fn = evaluators[ruleId];
  if (!fn) {
    return result(ruleId, false, [], `Unknown rule ${ruleId}`);
  }
  return fn(input);
}

/**
 * Evaluate all U1–U17 rules.
 */
export function evaluateAllRules(
  input: RuleEvaluatorInput,
  evaluators: Record<RuleId, RuleEvaluatorFn> = RULE_EVALUATORS
): RuleEvaluationResult[] {
  return (Object.keys(evaluators) as RuleId[]).map((id) => evaluateRule(id, input, evaluators));
}
