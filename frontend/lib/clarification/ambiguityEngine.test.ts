import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  evaluateAmbiguity,
  RULE_COUNT,
  JOURNEY_COUNT
} from "./ambiguityEngine";
import { journeysOverlap } from "./ambiguityRules";
import {
  evaluateAllRules,
  evaluateRule,
  RULE_EVALUATORS,
  type RuleEvaluatorInput
} from "./ruleEvaluator";

function baseInput(overrides: Partial<RuleEvaluatorInput> = {}): RuleEvaluatorInput {
  return {
    constructScores: {
      COMM: 0.5,
      EQ: 0.5,
      TEAM: 0.7,
      CONF: 0.7,
      "BIG5-C": 0.8,
      "NEG-SKILL": 0.8,
      LRN: 0.8,
      APT: 0.6,
      "SS-PS": 0.6
    },
    confidenceScores: {
      COMM: 0.9,
      EQ: 0.9,
      TEAM: 0.9,
      CONF: 0.9,
      "BIG5-C": 0.9,
      "NEG-SKILL": 0.9,
      LRN: 0.9,
      APT: 0.9,
      "SS-PS": 0.9
    },
    telemetry: {},
    simulationResults: {
      "SIM-NEGOTIATION-NPC-V2": {
        simId: "SIM-NEGOTIATION-NPC-V2",
        compositeScore: 0.7,
        telemetry: { rounds: 3 }
      }
    },
    aptitudeResults: {},
    validityFlags: { validity_band: "high" },
    ...overrides
  };
}

describe("ambiguityRules registry", () => {
  it("defines 17 rules and 9 journeys", () => {
    assert.equal(RULE_COUNT, 17);
    assert.equal(JOURNEY_COUNT, 9);
  });

  it("detects construct overlap when journeys share constructs", () => {
    assert.equal(journeysOverlap("J3", "J2"), false);
    assert.equal(journeysOverlap("J4", "J4"), true);
  });
});

describe("ruleEvaluator", () => {
  it("evaluates U1 on COMM/EQ divergence", () => {
    const input = baseInput({
      constructScores: { COMM: 0.9, EQ: 0.2 },
      confidenceScores: { COMM: 0.5, EQ: 0.5 }
    });
    const r = evaluateRule("U1", input);
    assert.equal(r.triggered, true);
    assert.ok(r.details.length >= 1);
    assert.match(r.message, /ambiguity/i);
  });

  it("evaluates U10 on validity caution", () => {
    const input = baseInput({
      validityFlags: { validity_band: "interpret_with_caution" }
    });
    assert.equal(evaluateRule("U10", input).triggered, true);
  });

  it("evaluates U12 when negotiation sim missing", () => {
    const input = baseInput({
      simulationResults: {},
      telemetry: { neg_sim_telemetry_missing: true },
      confidenceScores: { "NEG-SKILL": 0.4 }
    });
    assert.equal(evaluateRule("U12", input).triggered, true);
  });

  it("evaluates all 17 rules", () => {
    const results = evaluateAllRules(baseInput());
    assert.equal(results.length, Object.keys(RULE_EVALUATORS).length);
  });
});

describe("evaluateAmbiguity", () => {
  it("returns empty journeys when no rules fire", () => {
    const out = evaluateAmbiguity(baseInput(), {
      now: () => new Date("2026-06-04T12:00:00.000Z")
    });
    assert.equal(out.triggeredRules.length, 0);
    assert.equal(out.journeysToRun.length, 0);
    assert.equal(out.priority, null);
    assert.equal(out.maxJourneys, 0);
    assert.ok(out.explainability.some((l) => l.step === "no_clarification"));
  });

  it("routes U1 to J1 with explainability", () => {
    const out = evaluateAmbiguity(
      baseInput({
        constructScores: { COMM: 0.95, EQ: 0.1 },
        confidenceScores: { COMM: 0.5, EQ: 0.5 }
      })
    );
    assert.ok(out.triggeredRules.some((r) => r.ruleId === "U1"));
    assert.ok(out.journeysToRun.some((j) => j.journeyId === "J1"));
    assert.equal(out.priority, 2);
    assert.ok(out.explainability.length >= 3);
  });

  it("forces J4 on U10 and reserves a slot", () => {
    const out = evaluateAmbiguity(
      baseInput({
        validityFlags: { attention_fail: true }
      })
    );
    const j4 = out.journeysToRun.find((j) => j.journeyId === "J4");
    assert.ok(j4);
    assert.equal(j4?.forced, true);
    assert.equal(out.priority, 1);
  });

  it("enters extended mode for U5 + U12 and selects up to 3 journeys", () => {
    const out = evaluateAmbiguity(
      baseInput({
        validityFlags: {
          honest_dice_overreport: 1,
          negt_likert_used_for_negotiation: true
        },
        simulationResults: {},
        telemetry: { neg_sim_telemetry_missing: true },
        confidenceScores: { "NEG-SKILL": 0.4 }
      })
    );
    assert.equal(out.extendedMode, true);
    assert.equal(out.maxJourneys, 3);
    assert.ok(out.journeysToRun.some((j) => j.journeyId === "J4"));
    assert.ok(out.journeysToRun.some((j) => j.journeyId === "J2-NEG"));
  });

  it("enters extended mode when four or more rules fire", () => {
    const out = evaluateAmbiguity(
      baseInput({
        constructScores: {
          COMM: 0.95,
          EQ: 0.1,
          TEAM: 0.9,
          CONF: 0.1,
          "BIG5-C": 0.2,
          LRN: 0.1
        },
        confidenceScores: {
          COMM: 0.5,
          EQ: 0.5,
          TEAM: 0.5,
          CONF: 0.5,
          "BIG5-C": 0.5,
          LRN: 0.5
        },
        telemetry: {
          in_tray_tau: 0.2,
          trap_rank: 1,
          format_lab_rule_change_gain: 0.05,
          two_doors_clues: 3,
          two_doors_time_to_decide_s: 5
        },
        validityFlags: { honest_dice_overreport: 1 }
      })
    );
    assert.ok(out.triggeredRules.length >= 4);
    assert.equal(out.extendedMode, true);
    assert.ok(out.journeysToRun.length <= 3);
  });

  it("applies U15 modifiers without allocating a journey", () => {
    const out = evaluateAmbiguity(
      baseInput({
        accommodation: { intake_accommodation_flag: true }
      })
    );
    const u15 = out.triggeredRules.find((r) => r.ruleId === "U15");
    assert.ok(u15);
    assert.equal(u15?.journeys[0], "ALL");
    assert.equal(out.modifiers.latency_penalty_disabled, true);
    assert.equal(out.modifiers.timed_sim_multiplier, 1.5);
  });

  it("substitutes J3 sim when U17 fires", () => {
    const out = evaluateAmbiguity(
      baseInput({
        telemetry: {
          sim_completed_in_tray: true,
          in_tray_tau: 0.85,
          in_tray_stress_index: 0.5,
          crisis_commander_accuracy: 0.3
        }
      })
    );
    assert.ok(out.triggeredRules.some((r) => r.ruleId === "U17"));
    const j3 = out.journeysToRun.find((j) => j.journeyId === "J3");
    if (j3) {
      assert.deepEqual(j3.simInjection, [
        "SIM-PRESSURE-COOKER-CLAR",
        "SIM-SPOT-THE-BREAK-CLAR"
      ]);
    } else {
      assert.ok(out.modifiers.sim_substitution === "U17");
    }
  });

  it("supports injected evaluators for unit isolation", () => {
    const silentEvaluators = Object.fromEntries(
      (Object.keys(RULE_EVALUATORS) as (keyof typeof RULE_EVALUATORS)[]).map((id) => [
        id,
        () => ({
          ruleId: id,
          triggered: false,
          details: [],
          message: "mock off"
        })
      ])
    ) as typeof RULE_EVALUATORS;

    const out = evaluateAmbiguity(baseInput(), {
      evaluators: {
        ...silentEvaluators,
        U1: () => ({
          ruleId: "U1",
          triggered: true,
          details: [],
          message: "mock"
        })
      }
    });
    assert.equal(out.triggeredRules.length, 1);
    assert.equal(out.triggeredRules[0].ruleId, "U1");
  });

  it("deduplicates multiple rules targeting the same journey", () => {
    const out = evaluateAmbiguity(
      baseInput({
        telemetry: {
          eco_accuracy: 0.4,
          trend_radar_precision: 0.5
        },
        intakeMeta: { target_sector: "fintech", declared_sector: "fintech" },
        validityFlags: { resume_sector_mismatch: true }
      })
    );
    const j6Count = out.journeysToRun.filter((j) => j.journeyId === "J6").length;
    assert.equal(j6Count, 1);
    const j6 = out.journeysToRun.find((j) => j.journeyId === "J6");
    assert.ok(j6?.triggeredBy.includes("U7"));
    assert.ok(j6?.triggeredBy.includes("U8"));
  });

  it("caps default mode at two journeys", () => {
    const mockOn = (id: "U1" | "U2") => ({
      ruleId: id,
      triggered: true,
      details: [],
      message: `mock ${id}`
    });

    const out = evaluateAmbiguity(baseInput(), {
      evaluators: {
        ...Object.fromEntries(
          (Object.keys(RULE_EVALUATORS) as (keyof typeof RULE_EVALUATORS)[]).map((id) => [
            id,
            () => ({
              ruleId: id,
              triggered: false,
              details: [],
              message: "off"
            })
          ])
        ),
        U1: () => mockOn("U1"),
        U2: () => mockOn("U2")
      } as typeof RULE_EVALUATORS
    });

    assert.equal(out.triggeredRules.length, 2);
    assert.equal(out.extendedMode, false);
    assert.equal(out.maxJourneys, 2);
    assert.equal(out.journeysToRun.length, 2);
  });
});
