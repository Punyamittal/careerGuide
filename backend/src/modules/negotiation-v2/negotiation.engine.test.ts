import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyNegotiationAction,
  createInitialState,
  scoreNegotiationV2
} from "./engines/negotiation.engine.js";

describe("negotiation V2 scoring engine", () => {
  it("rewards probe + creative trade path", () => {
    let state = createInitialState("test-1", "user-1");
    let outcome = applyNegotiationAction(state, {
      branch: "probe_interests",
      interestSummaryText: "Quality on must-haves; date is exec-driven"
    });
    state = outcome.state;
    outcome = applyNegotiationAction(state, {
      branch: "trade_scope_date",
      tradePackage: "add_contractor_day"
    });
    state = outcome.state;
    outcome = applyNegotiationAction(state, {
      branch: "trade_scope_date",
      tradePackage: "phased_launch"
    });
    const scored = scoreNegotiationV2(outcome.state);
    assert.ok(scored.dimensionScores.trust_score >= 0.5);
    assert.ok(scored.dimensionScores["NEG-INT"] >= 0.55);
    assert.ok(scored.telemetry.probe_count >= 1);
    assert.equal(scored.telemetry.batna_referenced, true);
  });

  it("flags walkaway without probe as failure", () => {
    let state = createInitialState("test-2", "user-1");
    const outcome = applyNegotiationAction(state, { branch: "walkaway" });
    const scored = scoreNegotiationV2(outcome.state);
    assert.equal(scored.success, false);
    assert.ok(scored.failureReasons.includes("walkaway_without_probe"));
  });

  it("computes composite from five dimensions", () => {
    const state = createInitialState("test-3", "user-1");
    state.probeCount = 1;
    state.batnaRevealed = true;
    state.interestSummaryText = "priorities noted";
    state.creativeTrade = true;
    state.jointValueScore = 0.9;
    state.trustSeries = [0.5, 0.72];
    state.trust = 0.72;
    const scored = scoreNegotiationV2(state);
    assert.ok(scored.composite > 0.6);
    assert.ok(scored.dimensionScores.assertiveness_score > 0);
    assert.ok(scored.dimensionScores.relationship_score > 0);
  });
});
