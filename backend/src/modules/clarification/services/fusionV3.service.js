import {
  FUSION_V3,
  METHOD_WEIGHTS,
  NEG_LIKERT_CONSTRUCTS
} from "../constants/clarification.constants.js";
import { getScoringMatrix } from "../config/clarificationAssets.js";
import { ClarificationResponse } from "../models/ClarificationResponse.model.js";
import { ClarificationSimResult } from "../models/ClarificationSimResult.model.js";

/**
 * @param {number} score
 */
function bandForScore(score) {
  if (score < 0.45) return "developing";
  if (score < 0.72) return "capable";
  return "strong";
}

/**
 * @param {Record<string, { score?: number; confidence?: number; methods?: string[] }>} prior
 * @param {Array<{ construct: string; score: number; weight: number; method: string }>} clarEvidence
 * @param {Record<string, unknown>} [opts]
 */
export function fuseConstructScoresV3(prior, clarEvidence, opts = {}) {
  const matrix = getScoringMatrix();
  const boostCap = matrix.FUSION_V3?.boostCap ?? FUSION_V3.boostCap;

  /** @type {Record<string, { score: number; confidence: number; band: string; evidence: string[]; blocked?: boolean }>} */
  const result = {};

  const constructs = new Set([
    ...Object.keys(prior),
    ...clarEvidence.map((e) => e.construct)
  ]);

  for (const construct of constructs) {
    if (NEG_LIKERT_CONSTRUCTS.has(construct)) continue;

    const priorEntry = prior[construct] ?? { score: 0.5, confidence: 0.5, methods: [] };
    let score = Number(priorEntry.score ?? 0.5);
    let confidence = Number(priorEntry.confidence ?? 0.5);
    const evidence = [...(priorEntry.methods ?? [])];

    const clarItems = clarEvidence.filter(
      (e) => e.construct === construct || e.construct.startsWith(construct.split("-")[0])
    );

    if (clarItems.length) {
      let weightedSum = 0;
      let weightTotal = 0;
      for (const item of clarItems) {
        const mw = METHOD_WEIGHTS[item.method] ?? 0.8;
        weightedSum += item.score * mw;
        weightTotal += mw;
        evidence.push(`clar:${item.method}`);
      }
      const clarScore = weightTotal ? weightedSum / weightTotal : score;
      const evidenceQuality = Math.min(1, weightTotal / clarItems.length);
      const boost = boostCap * (1 - confidence) * evidenceQuality;
      score = Math.min(1, score + boost * (clarScore - score));
      confidence = Math.min(0.95, confidence + boost);
    }

    result[construct] = {
      score: round4(score),
      confidence: round4(confidence),
      band: bandForScore(score),
      evidence: [...new Set(evidence)]
    };
  }

  if (opts.negSimMissing && result["NEG-SKILL"]) {
    result["NEG-SKILL"].blocked = true;
    result["NEG-SKILL"].confidence = Math.min(result["NEG-SKILL"].confidence, 0.55);
  }

  const validityBand =
    opts.validityFlags?.validity_band === "interpret_with_caution" ||
    opts.firedRules?.includes("U10")
      ? "interpret_with_caution"
      : "high";

  return {
    constructScores: result,
    validityBand,
    boostApplied: round4(boostCap),
    fusion: "confidence_weighted_v3"
  };
}

/**
 * @param {import("mongoose").Types.ObjectId} clarificationSessionId
 * @param {Record<string, unknown>} flowConstructSnapshot
 * @param {{ firedRules?: string[]; validityFlags?: Record<string, unknown>; negSimMissing?: boolean }} meta
 */
export async function buildClarEvidenceAndFuse(clarificationSessionId, flowConstructSnapshot, meta = {}) {
  /** @type {Record<string, { score?: number; confidence?: number; methods?: string[] }>} */
  const prior = {};

  if (flowConstructSnapshot instanceof Map) {
    for (const [k, v] of flowConstructSnapshot.entries()) prior[k] = v;
  } else {
    Object.assign(prior, flowConstructSnapshot);
  }

  const responses = await ClarificationResponse.find({ clarificationSessionId }).lean();
  const sims = await ClarificationSimResult.find({ clarificationSessionId }).lean();

  /** @type {Array<{ construct: string; score: number; weight: number; method: string }>} */
  const clarEvidence = [];

  for (const r of responses) {
    const itemConstructs = await resolveConstructsFromResponse(r);
    for (const c of itemConstructs) {
      clarEvidence.push({
        construct: c,
        score: Number(r.partialScore ?? 0),
        weight: 1,
        method: r.questionType === "micro-CAT" ? "micro_cat" : "sjt_v2_rubric"
      });
    }
  }

  for (const sim of sims) {
    const method = "simulation";
    clarEvidence.push({
      construct: sim.simId.includes("NEG") ? "NEG-SKILL" : "LRN",
      score: Number(sim.compositeScore ?? 0),
      weight: 1.2,
      method
    });
    for (const [dim, val] of Object.entries(sim.dimensionScores ?? {})) {
      clarEvidence.push({
        construct: dim,
        score: Number(val),
        weight: 1,
        method
      });
    }
  }

  return fuseConstructScoresV3(prior, clarEvidence, meta);
}

/**
 * @param {Record<string, unknown>} responseRow
 */
async function resolveConstructsFromResponse(responseRow) {
  const { getItemById } = await import("./questionLoader.service.js");
  const item = getItemById(responseRow.itemId);
  if (!item) return [];
  return String(item.construct ?? "")
    .split("|")
    .map((p) => p.split(":")[0].trim())
    .filter(Boolean);
}

function round4(n) {
  return Math.round(n * 10_000) / 10_000;
}
