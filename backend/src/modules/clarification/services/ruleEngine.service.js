/**
 * @typedef {Object} RuleContext
 * @property {Record<string, { score?: number; confidence?: number; methods?: string[] }>} constructSnapshot
 * @property {Record<string, unknown>} telemetry
 * @property {Record<string, unknown>} validityFlags
 * @property {Record<string, unknown>} intakeMeta
 * @property {Record<string, unknown>} accommodation
 */

/**
 * @param {RuleContext} ctx
 * @returns {number}
 */
function getConstructConf(ctx, key) {
  const entry = ctx.constructSnapshot[key];
  if (!entry) return 1;
  return Number(entry.confidence ?? 1);
}

/**
 * @param {RuleContext} ctx
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function methodDivergenceZ(ctx, a, b) {
  const sa = ctx.constructSnapshot[a]?.score ?? 0;
  const sb = ctx.constructSnapshot[b]?.score ?? 0;
  const ca = ctx.constructSnapshot[a]?.confidence ?? 0.5;
  const cb = ctx.constructSnapshot[b]?.confidence ?? 0.5;
  const pooledSe = Math.sqrt((1 - ca) ** 2 + (1 - cb) ** 2) || 0.15;
  return Math.abs(sa - sb) / pooledSe;
}

/** @type {Record<string, (ctx: RuleContext) => boolean>} */
const RULE_EVALUATORS = {
  U1: (ctx) =>
    methodDivergenceZ(ctx, "COMM", "EQ") > 1.0 ||
    getConstructConf(ctx, "COMM") < 0.65 ||
    getConstructConf(ctx, "EQ") < 0.65,

  U2: (ctx) => {
    const t = ctx.telemetry;
    const style = t.conflict_branch_style;
    const coop = Number(t.team_chat_cooperation_score ?? 0);
    const z = Number(t.wst_sjt_divergence_z ?? methodDivergenceZ(ctx, "TEAM", "CONF"));
    return (
      (coop >= 0.7 && (style === "compete" || style === "avoid") && z > 1.0) ||
      getConstructConf(ctx, "TEAM") < 0.65 ||
      getConstructConf(ctx, "CONF") < 0.65
    );
  },

  U3: (ctx) => {
    const t = ctx.telemetry;
    return (
      (Number(t.in_tray_tau ?? 1) < 0.5 &&
        Number(t.trap_rank ?? 99) <= 2) ||
      getConstructConf(ctx, "BIG5-C") < 0.65
    );
  },

  U4: (ctx) => {
    const t = ctx.telemetry;
    const clues = Number(t.two_doors_clues ?? 0);
    const time = Number(t.two_doors_time_to_decide_s ?? 60);
    return (clues >= 2 && time < 8) || (clues === 0 && time > 120);
  },

  U5: (ctx) => {
    const v = ctx.validityFlags;
    return (
      Number(v.honest_dice_overreport ?? 0) > 0 ||
      Number(v.eco_d02_fake_familiarity ?? 0) >= 3.5 ||
      Number(v.resume_skill_mismatch ?? 0) >= 0.4
    );
  },

  U6: (ctx) => {
    const t = ctx.telemetry;
    return (
      Number(t.path_branch_conf ?? 1) < 0.65 ||
      Number(t.trade_off_entropy ?? 0) > 0.85 ||
      Math.abs(Number(t.ent_signal ?? 0.5) - Number(t.job_signal ?? 0.5)) < 0.12
    );
  },

  U7: (ctx) => {
    const t = ctx.telemetry;
    const v = ctx.validityFlags;
    return (
      Number(t.eco_accuracy ?? 1) < 0.6 ||
      v.resume_sector_mismatch === true ||
      Number(t.expert_challenge_accuracy ?? 1) < 0.55
    );
  },

  U8: (ctx) => {
    const t = ctx.telemetry;
    const intake = ctx.intakeMeta;
    return (
      Number(t.trend_radar_precision ?? 1) < 0.65 &&
      intake.target_sector === intake.declared_sector
    );
  },

  U9: (ctx) =>
    Number(ctx.telemetry.work_styles_arena_vector_conf ?? 1) < 0.65 ||
    Number(ctx.telemetry.wst_sjt_divergence_z ?? 0) > 1.0,

  U10: (ctx) => {
    const v = ctx.validityFlags;
    return (
      v.validity_band === "interpret_with_caution" ||
      v.attention_fail === true ||
      v.long_string_flag === true
    );
  },

  U11: (ctx) => {
    const t = ctx.telemetry;
    const crisis = Number(t.crisis_commander_accuracy ?? 0);
    const stress = Number(t.in_tray_stress_index ?? 0);
    return (
      (crisis >= 0.7 && stress < -0.3) ||
      (crisis < 0.5 && stress > 0.3)
    );
  },

  U12: (ctx) =>
    ctx.telemetry.neg_sim_telemetry_missing === true ||
    getConstructConf(ctx, "NEG-SKILL") < 0.65 ||
    ctx.validityFlags.negt_likert_used === true,

  U13: (ctx) =>
    Number(ctx.telemetry.format_lab_rule_change_gain ?? 1) < 0.15 ||
    getConstructConf(ctx, "LRN") < 0.65,

  U14: (ctx) =>
    methodDivergenceZ(ctx, "APT", "SS-PS") > 1.0 ||
    getConstructConf(ctx, "APT") < 0.65,

  U15: (ctx) =>
    ctx.accommodation?.extended_time === true ||
    ctx.accommodation?.latency_penalty_disabled === true,

  U16: () => false,

  U17: (ctx) => Number(ctx.telemetry.in_tray_tau ?? 0) >= 0.7
};

import { getAmbiguityRules } from "../config/clarificationAssets.js";

/**
 * @param {RuleContext & { rulesDoc?: Record<string, unknown> }} context
 * @returns {{ firedRules: string[]; modifiers: Record<string, unknown>; ruleDetails: Array<{ rule_id: string; name: string; journeys: string[] }> }}
 */
export function evaluateAmbiguityRules(context) {
  const rulesDoc = context.rulesDoc ?? getAmbiguityRules();
  const rules = rulesDoc?.rules ?? [];
  /** @type {string[]} */
  const firedRules = [];
  /** @type {Array<{ rule_id: string; name: string; journeys: string[]; force?: boolean }>} */
  const ruleDetails = [];
  /** @type {Record<string, unknown>} */
  const modifiers = {};

  for (const rule of rules) {
    const id = rule.rule_id;
    const evaluator = RULE_EVALUATORS[id];
    if (!evaluator) continue;

    let fired = false;
    try {
      fired = Boolean(evaluator(context));
    } catch {
      fired = false;
    }

    if (fired) {
      firedRules.push(id);
      ruleDetails.push({
        rule_id: id,
        name: rule.name,
        journeys: rule.journeys ?? [],
        force: rule.force ?? false
      });

      if (id === "U15" && rule.modifiers) {
        Object.assign(modifiers, rule.modifiers);
      }
      if (id === "U17") {
        modifiers.sim_substitution = "U17";
      }
    }
  }

  return { firedRules, modifiers, ruleDetails };
}

/**
 * Build rule context from a flow session document.
 * @param {import("../models/UserFlowSession.model.js").UserFlowSession} flowSession
 * @param {Record<string, unknown>} rulesDoc
 */
export function buildRuleContext(flowSession) {
  /** @type {Record<string, { score?: number; confidence?: number; methods?: string[] }>} */
  const constructSnapshot = {};

  if (flowSession.constructSnapshot instanceof Map) {
    for (const [k, v] of flowSession.constructSnapshot.entries()) {
      constructSnapshot[k] = v;
    }
  } else if (flowSession.constructSnapshot) {
    Object.assign(constructSnapshot, flowSession.constructSnapshot);
  }

  return {
    constructSnapshot,
    telemetry: flowSession.telemetry ?? {},
    validityFlags: flowSession.validityFlags ?? {},
    intakeMeta: flowSession.intakeMeta ?? {},
    accommodation: flowSession.accommodation ?? {}
  };
}

export { RULE_EVALUATORS };
