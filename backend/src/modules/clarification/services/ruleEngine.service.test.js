import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateAmbiguityRules, buildRuleContext } from "./ruleEngine.service.js";
import { selectJourneys } from "./journeySelector.service.js";

describe("clarification ruleEngine", () => {
  it("fires U10 on validity caution", () => {
    const ctx = {
      constructSnapshot: {},
      telemetry: {},
      validityFlags: { validity_band: "interpret_with_caution" },
      intakeMeta: {},
      accommodation: {}
    };
    const { firedRules } = evaluateAmbiguityRules(ctx);
    assert.ok(firedRules.includes("U10"));
  });

  it("fires U12 when negotiation sim missing", () => {
    const ctx = {
      constructSnapshot: { "NEG-SKILL": { score: 0.5, confidence: 0.5 } },
      telemetry: { neg_sim_telemetry_missing: true },
      validityFlags: {},
      intakeMeta: {},
      accommodation: {}
    };
    const { firedRules } = evaluateAmbiguityRules(ctx);
    assert.ok(firedRules.includes("U12"));
  });

  it("selectJourneys forces J4 on U10", () => {
    const ruleDetails = [
      { rule_id: "U10", name: "Validity", journeys: ["J4"], force: true },
      { rule_id: "U1", name: "Comm", journeys: ["J1"] }
    ];
    const { journeys } = selectJourneys(ruleDetails, ["U10", "U1"], {});
    assert.ok(journeys.some((j) => j.journeyId === "J4"));
  });
});

describe("buildRuleContext", () => {
  it("maps construct snapshot from plain object", () => {
    const flow = {
      constructSnapshot: { COMM: { score: 0.7, confidence: 0.6 } },
      telemetry: {},
      validityFlags: {},
      intakeMeta: {},
      accommodation: {}
    };
    const ctx = buildRuleContext(flow);
    assert.equal(ctx.constructSnapshot.COMM.score, 0.7);
  });
});
