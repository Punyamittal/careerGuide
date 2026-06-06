import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";

import {
  clarifyNextQuerySchema,
  clarifyResponseBodySchema,
  clarifySimCompleteBodySchema,
  flowSessionIdParamsSchema
} from "./validators/clarify.validator.js";
import { ClarificationError, clarificationStatusCode } from "./errors/clarification.errors.js";
import { scoreItemResponse } from "./services/itemScoring.service.js";
import { mapFlowToEngineInput } from "./services/flowMapper.service.js";
import { evaluateAmbiguity } from "./engine/ambiguityEngine.js";

describe("clarify validators", () => {
  it("validates evaluate params", () => {
    const parsed = flowSessionIdParamsSchema.parse({
      params: { flowSessionId: "abc123" }
    });
    assert.equal(parsed.params.flowSessionId, "abc123");
  });

  it("rejects missing clarificationSessionId on response body", () => {
    assert.throws(() =>
      clarifyResponseBodySchema.parse({
        params: { flowSessionId: "flow1" },
        body: {
          journeyId: "J1",
          itemId: "CLAR-J1-001",
          selectedOption: 0
        }
      })
    );
  });

  it("validates sim complete payload", () => {
    const parsed = clarifySimCompleteBodySchema.parse({
      params: { flowSessionId: "flow1" },
      body: {
        clarificationSessionId: "clar1",
        journeyId: "J2-NEG",
        simId: "SIM-NEGOTIATION-NPC-V2",
        telemetry: { probe_count: 2, joint_value_score: 0.7 }
      }
    });
    assert.equal(parsed.body.simId, "SIM-NEGOTIATION-NPC-V2");
  });

  it("coerces batchSize on next query", () => {
    const parsed = clarifyNextQuerySchema.parse({
      params: { flowSessionId: "flow1" },
      query: { batchSize: "3" }
    });
    assert.equal(parsed.query.batchSize, 3);
  });
});

describe("clarification errors", () => {
  it("maps CLAR_006 to 404", () => {
    const err = new ClarificationError("SESSION_NOT_FOUND");
    assert.equal(err.code, "CLAR_006");
    assert.equal(clarificationStatusCode(err), 404);
  });

  it("maps CLAR_002 to 409", () => {
    const err = new ClarificationError("NOT_EVALUATED");
    assert.equal(clarificationStatusCode(err), 409);
  });
});

describe("clarification services (pure)", () => {
    it("maps flow snapshot to ambiguity engine input", () => {
    const input = mapFlowToEngineInput({
      constructSnapshot: {
        COMM: { score: 0.9, confidence: 0.5 },
        EQ: { score: 0.1, confidence: 0.5 }
      },
      telemetry: {},
      validityFlags: { validity_band: "high" }
    });

    const out = evaluateAmbiguity(input);
    assert.ok(out.triggeredRules.some((rule) => rule.ruleId === "U1"));
  });

  it("scores unknown items as zero", () => {
    const scored = scoreItemResponse("NONEXISTENT-ITEM", 0);
    assert.equal(scored.partialScore, 0);
    assert.equal(scored.questionType, "unknown");
  });
});

describe("DTO contract sanity", () => {
  it("accepts standard API envelope shape", () => {
    const envelope = z.object({
      success: z.literal(true),
      data: z.unknown(),
      error: z.null()
    });

    const sample = envelope.parse({
      success: true,
      data: { clarificationSessionId: "x", firedRules: ["U1"] },
      error: null
    });

    assert.equal(sample.success, true);
  });
});
