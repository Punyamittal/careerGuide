import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normaliseLikertValue,
  scoreAssessmentFromTelemetry
} from "./ruleScoring.service.js";

describe("ruleScoring.service", () => {
  it("normalises frequency likert 1-5 to 0-1", () => {
    assert.equal(normaliseLikertValue({ type: "frequency" }, 1), 0);
    assert.equal(normaliseLikertValue({ type: "frequency" }, 5), 1);
  });

  it("applies reverse coding", () => {
    assert.equal(normaliseLikertValue({ type: "frequency", reverse: true }, 5), 0);
  });

  it("scores likert telemetry into construct facets", () => {
    const module = {
      id: "M03",
      engineType: "likert",
      constructTags: ["DWECK"]
    };
    const events = [
      {
        event_type: "response",
        item_id: "M3-F01",
        response_value: { response: 5 },
        response_time_ms: 2000
      },
      {
        event_type: "response",
        item_id: "M3-SD01",
        response_value: { response: 4 },
        response_time_ms: 2500
      }
    ];
    const result = scoreAssessmentFromTelemetry(module, events);
    assert.ok(result.constructScores.DWECK != null || result.constructScores.growth_motivation != null);
    assert.ok(result.summary.itemsAnswered >= 1);
    assert.ok(result.confidence > 0);
  });

  it("scores branching telemetry into communication constructs", () => {
    const module = { id: "SS02", engineType: "branching", constructTags: ["COMMUNICATION"] };
    const events = [
      {
        event_type: "response",
        item_id: "S1-N2",
        response_value: { empathySignal: 0.9, escalationScore: 0.1, selectedOption: "B" },
        response_time_ms: 3000
      }
    ];
    const result = scoreAssessmentFromTelemetry(module, events);
    assert.ok(result.constructScores.COMMUNICATION != null);
  });

  it("scores tracing trials", () => {
    const module = { id: "T4", engineType: "tracing", constructTags: ["COORDINATION"] };
    const events = [
      {
        event_type: "response",
        item_id: "trial-1",
        response_value: { pathAccuracy: 0.8, completionSpeed: 0.6 },
        response_correct: true,
        response_time_ms: 4000
      }
    ];
    const result = scoreAssessmentFromTelemetry(module, events);
    assert.equal(result.constructScores.COORDINATION, 0.72);
  });

  it("scores reaction_time stroop trials", () => {
    const module = { id: "T5", engineType: "reaction_time", constructTags: ["ATTENTION"] };
    const events = [
      {
        event_type: "response",
        item_id: "stroop-1",
        response_value: { correct: true },
        response_correct: true,
        response_time_ms: 600
      },
      {
        event_type: "response",
        item_id: "stroop-2",
        response_value: { correct: false },
        response_correct: false,
        response_time_ms: 900
      }
    ];
    const result = scoreAssessmentFromTelemetry(module, events);
    assert.ok(result.constructScores.ATTENTION != null);
  });
});
