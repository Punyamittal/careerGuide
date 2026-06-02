import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CONSTRUCT_DOMAIN_WEIGHTS } from "./constructDomainWeights.js";

describe("constructDomainWeights", () => {
  it("maps core constructs to MBS domains", () => {
    assert.ok(CONSTRUCT_DOMAIN_WEIGHTS.MASLOW["MBS-20"]);
    assert.ok(CONSTRUCT_DOMAIN_WEIGHTS.COMMUNICATION["MBS-11"]);
    assert.ok(CONSTRUCT_DOMAIN_WEIGHTS.COORDINATION["MBS-02"]);
  });
});
