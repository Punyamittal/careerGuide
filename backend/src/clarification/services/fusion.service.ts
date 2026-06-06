import {
  FUSION_V3,
  METHOD_WEIGHTS,
  NEG_LIKERT_CONSTRUCTS
} from "../constants/clarification.constants.js";
import { getScoringMatrix } from "../../modules/clarification/config/clarificationAssets.js";
import { listClarificationResponses } from "../repositories/clarificationResponse.repository.js";
import { listClarificationSimResults } from "../repositories/clarificationSimResult.repository.js";
import { getItemById } from "./questionLoader.service.js";
import type { ConstructEntry } from "../types/entities.js";

export interface ClarEvidenceItem {
  construct: string;
  score: number;
  weight: number;
  method: string;
}

export interface FusionMeta {
  firedRules?: string[];
  validityFlags?: Record<string, unknown>;
  negSimMissing?: boolean;
}

export interface FusionResult {
  constructScores: Record<
    string,
    { score: number; confidence: number; band: string; evidence: string[]; blocked?: boolean }
  >;
  validityBand: "high" | "interpret_with_caution";
  boostApplied: number;
  fusion: string;
  blockedConstructs?: string[];
}

function bandForScore(score: number): string {
  if (score < 0.45) return "developing";
  if (score < 0.72) return "capable";
  return "strong";
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export function fuseConstructScoresV3(
  prior: Record<string, ConstructEntry>,
  clarEvidence: ClarEvidenceItem[],
  meta: FusionMeta = {}
): FusionResult {
  const matrix = getScoringMatrix() as { FUSION_V3?: { boostCap?: number } };
  const boostCap = matrix.FUSION_V3?.boostCap ?? FUSION_V3.boostCap;

  const result: FusionResult["constructScores"] = {};
  const constructs = new Set([
    ...Object.keys(prior),
    ...clarEvidence.map((entry) => entry.construct)
  ]);

  for (const construct of constructs) {
    if (NEG_LIKERT_CONSTRUCTS.has(construct)) continue;

    const priorEntry = prior[construct] ?? { score: 0.5, confidence: 0.5, methods: [] };
    let score = Number(priorEntry.score ?? 0.5);
    let confidence = Number(priorEntry.confidence ?? 0.5);
    const evidence = [...(priorEntry.methods ?? [])];

    const clarItems = clarEvidence.filter(
      (entry) =>
        entry.construct === construct ||
        entry.construct.startsWith(construct.split("-")[0])
    );

    if (clarItems.length) {
      let weightedSum = 0;
      let weightTotal = 0;
      for (const item of clarItems) {
        const methodWeight = METHOD_WEIGHTS[item.method] ?? 0.8;
        weightedSum += item.score * methodWeight;
        weightTotal += methodWeight;
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

  if (meta.negSimMissing && result["NEG-SKILL"]) {
    result["NEG-SKILL"].blocked = true;
    result["NEG-SKILL"].confidence = Math.min(result["NEG-SKILL"].confidence, 0.55);
  }

  const validityBand =
    meta.validityFlags?.validity_band === "interpret_with_caution" ||
    meta.firedRules?.includes("U10")
      ? "interpret_with_caution"
      : "high";

  return {
    constructScores: result,
    validityBand,
    boostApplied: round4(boostCap),
    fusion: "confidence_weighted_v3"
  };
}

function resolveConstructsFromItemId(itemId: string): string[] {
  const item = getItemById(itemId);
  if (!item) return [];
  return String(item.construct ?? "")
    .split("|")
    .map((part) => part.split(":")[0].trim())
    .filter(Boolean);
}

export async function buildClarEvidenceAndFuse(
  clarificationSessionId: string,
  flowConstructSnapshot: Record<string, ConstructEntry>,
  meta: FusionMeta = {}
): Promise<FusionResult> {
  const prior: Record<string, ConstructEntry> = { ...flowConstructSnapshot };

  const responses = await listClarificationResponses(clarificationSessionId);
  const sims = await listClarificationSimResults(clarificationSessionId);

  const clarEvidence: ClarEvidenceItem[] = [];

  for (const response of responses) {
    const constructs = resolveConstructsFromItemId(String(response.itemId));
    for (const construct of constructs) {
      clarEvidence.push({
        construct,
        score: Number(response.partialScore ?? 0),
        weight: 1,
        method: response.questionType === "micro-CAT" ? "micro_cat" : "sjt_v2_rubric"
      });
    }
  }

  for (const sim of sims) {
    clarEvidence.push({
      construct: String(sim.simId).includes("NEG") ? "NEG-SKILL" : "LRN",
      score: Number(sim.compositeScore ?? 0),
      weight: 1.2,
      method: "simulation"
    });

    for (const [dimension, value] of Object.entries(sim.dimensionScores ?? {})) {
      clarEvidence.push({
        construct: dimension,
        score: Number(value),
        weight: 1,
        method: "simulation"
      });
    }
  }

  return fuseConstructScoresV3(prior, clarEvidence, meta);
}
