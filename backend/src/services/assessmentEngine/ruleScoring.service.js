import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { getModuleById } from "../../constants/mbsModuleRegistry.js";
import { log } from "../../utils/logger.js";
import { getModuleScoringFromBank } from "../assessmentBank.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(__dirname, "../../constants/scoring/catalog.json");

let catalogCache = null;

function loadCatalog() {
  if (!catalogCache) {
    catalogCache = JSON.parse(readFileSync(catalogPath, "utf8"));
  }
  return catalogCache;
}

export function getScoringRules(moduleId) {
  const mod = getModuleById(moduleId);
  const key = mod?.id ?? moduleId;
  const catalog = loadCatalog();
  const staticRules = catalog.modules[key] ?? null;
  const bankRules = getModuleScoringFromBank(key);

  if (bankRules?.items?.length) {
    return {
      engineType: bankRules.engineType ?? staticRules?.engineType ?? "likert",
      constructs: bankRules.constructs?.length
        ? bankRules.constructs
        : staticRules?.constructs ?? [],
      items: bankRules.items,
      signalToConstruct: staticRules?.signalToConstruct
    };
  }

  return staticRules;
}

const round2 = (n) => Math.round(n * 100) / 100;

/** @param {{ type: string; reverse?: boolean; idealIndex?: number }} item */
export function normaliseLikertValue(item, rawValue) {
  if (item.type === "binary") {
    const v = rawValue === 1 || rawValue === "1" || rawValue === true;
    return v ? 1 : 0;
  }
  const n = typeof rawValue === "number" ? rawValue : Number(rawValue);
  if (!Number.isFinite(n)) return 0.5;
  let norm = Math.max(0, Math.min(1, (n - 1) / 4));
  if (item.reverse) norm = 1 - norm;
  else if (item.idealIndex != null && item.idealIndex >= 1 && item.idealIndex <= 5) {
    const idealNorm = (item.idealIndex - 1) / 4;
    norm = 1 - Math.abs(norm - idealNorm) / Math.max(idealNorm, 1 - idealNorm, 0.25);
    norm = Math.max(0, Math.min(1, norm));
  }
  return norm;
}

function extractResponseValue(event) {
  const rv = event.response_value ?? event.responseValue;
  if (rv == null) return null;
  if (typeof rv === "object" && rv !== null) {
    if ("response" in rv) return rv.response;
    if ("selectedOption" in rv) return rv;
  }
  return rv;
}

function findModuleCompleteEvent(events) {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    const meta = e.metadata ?? {};
    if (e.event_type === "module_complete" || meta.eventType === "module_complete") {
      return e;
    }
    if (meta.sessionSummary) return e;
  }
  return null;
}

function scoreLikertFromTelemetry(events, rules) {
  const itemMap = new Map((rules.items ?? []).map((it) => [it.id, it]));
  const facetTotals = {};
  const facetWeights = {};
  let answered = 0;

  for (const event of events) {
    if (event.event_type !== "response") continue;
    const itemId = event.item_id ?? event.itemId;
    if (!itemId || itemId === "session") continue;
    const itemRule = itemMap.get(itemId);
    if (!itemRule) continue;

    const raw = extractResponseValue(event);
    if (raw == null) continue;
    const norm = normaliseLikertValue(itemRule, raw);
    answered += 1;

    for (const [facet, weight] of Object.entries(itemRule.scoringWeight ?? {})) {
      facetTotals[facet] = (facetTotals[facet] ?? 0) + norm * weight;
      facetWeights[facet] = (facetWeights[facet] ?? 0) + weight;
    }
  }

  const facetScores = {};
  for (const [facet, total] of Object.entries(facetTotals)) {
    const w = facetWeights[facet] || 1;
    facetScores[facet] = round2(total / w);
  }

  const consistency = computeConsistency(events, answered);
  return { facetScores, answered, consistency };
}

function computeConsistency(events, answered) {
  if (answered < 2) return 1;
  const changes = events.filter((e) => {
    const rv = extractResponseValue(e);
    return rv && typeof rv === "object" && rv.changedAnswer === true;
  }).length;
  const hesitations = events.filter((e) => (e.response_time_ms ?? 0) >= 12000).length;
  const changeRate = changes / answered;
  const hesitationRate = hesitations / answered;
  return round2(Math.max(0, Math.min(1, 1 - changeRate * 0.45 - hesitationRate * 0.35)));
}

function scoreBranchingFromTelemetry(events, rules) {
  const signals = { empathy: 0, assertiveness: 0, escalation: 0, communication: 0 };
  let choiceCount = 0;

  for (const event of events) {
    if (event.event_type !== "response") continue;
    const rv = extractResponseValue(event);
    if (!rv || typeof rv !== "object") continue;
    choiceCount += 1;
    signals.empathy += Number(rv.empathySignal ?? 0);
    signals.escalation += Number(rv.escalationScore ?? 0);
    if (rv.selectedOption) signals.communication += 0.25;
  }

  const scale = Math.max(1, choiceCount * 0.85);
  const facetScores = {
    empathy: round2(signals.empathy / scale),
    assertiveness: round2(signals.assertiveness / scale),
    communication: round2(signals.communication / scale),
    escalation_control: round2(Math.max(0, 1 - signals.escalation / scale))
  };

  const constructScores = {};
  const map = rules.signalToConstruct ?? {};
  for (const [signal, contributions] of Object.entries(map)) {
    const signalVal =
      signal === "escalation"
        ? Math.max(0, 1 - signals.escalation / scale)
        : signals[signal] / scale;
    for (const [construct, weight] of Object.entries(contributions)) {
      constructScores[construct] = round2(
        (constructScores[construct] ?? 0) + signalVal * Math.abs(weight) * Math.sign(weight || 1)
      );
    }
  }

  for (const c of rules.constructs ?? []) {
    if (constructScores[c] == null) {
      const vals = Object.values(facetScores).filter((v) => typeof v === "number");
      constructScores[c] = round2(vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0.5);
    }
  }

  return { facetScores, constructScores, choiceCount, consistency: 0.75 };
}

function scoreTracingFromTelemetry(events, rules) {
  let pathAccuracy = 0;
  let speedScore = 0;
  let trials = 0;
  for (const event of events) {
    if (event.event_type !== "response") continue;
    const rv = extractResponseValue(event);
    if (!rv || typeof rv !== "object") continue;
    trials += 1;
    if (rv.pathAccuracy != null) pathAccuracy += Number(rv.pathAccuracy);
    else if (event.response_correct === true) pathAccuracy += 1;
    if (rv.completionSpeed != null) speedScore += Number(rv.completionSpeed);
  }
  const n = Math.max(1, trials);
  const accuracy = round2(pathAccuracy / n);
  const speed = round2(speedScore / n);
  const COORDINATION = round2(accuracy * 0.6 + speed * 0.4);
  return {
    facetScores: { pathAccuracy: accuracy, completionSpeed: speed },
    constructScores: { COORDINATION },
    answered: trials,
    consistency: accuracy
  };
}

function scoreReactionTimeFromTelemetry(events, rules) {
  let correct = 0;
  let total = 0;
  const rts = [];
  for (const event of events) {
    if (event.event_type !== "response") continue;
    total += 1;
    const rv = extractResponseValue(event);
    const isCorrect =
      event.response_correct === true || (rv && typeof rv === "object" && rv.correct === true);
    if (isCorrect) correct += 1;
    const rt = event.response_time_ms;
    if (rt != null) rts.push(rt);
  }
  const accuracy = total ? correct / total : 0;
  const meanRt = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : null;
  const rtScore = meanRt != null ? round2(Math.max(0, Math.min(1, 1 - (meanRt - 400) / 1600))) : 0.5;
  const ATTENTION = round2(accuracy * 0.55 + rtScore * 0.45);
  return {
    facetScores: { accuracy: round2(accuracy), meanRt: meanRt ?? 0 },
    constructScores: { ATTENTION },
    answered: total,
    consistency: round2(accuracy)
  };
}

function rollupModuleConstructs(moduleConstructs, facetScores, constructScores = {}) {
  const facetVals = Object.values(facetScores).filter((v) => typeof v === "number");
  const meanFacet = facetVals.length
    ? facetVals.reduce((a, b) => a + b, 0) / facetVals.length
    : 0.5;

  const merged = { ...facetScores, ...constructScores };
  for (const tag of moduleConstructs ?? []) {
    const key = tag.toUpperCase();
    if (merged[key] == null && merged[tag] == null) {
      merged[tag] = round2(meanFacet);
    } else if (merged[tag] == null && merged[key] != null) {
      merged[tag] = merged[key];
    }
  }
  return merged;
}

function scoresFromClientSummary(clientSummary, moduleConstructs) {
  if (!clientSummary || typeof clientSummary !== "object") return null;
  const categoryScores = clientSummary.categoryScores ?? clientSummary.constructScores;
  if (!categoryScores || typeof categoryScores !== "object") return null;

  const numeric = {};
  for (const [k, v] of Object.entries(categoryScores)) {
    const n = Number(v);
    if (Number.isFinite(n)) numeric[k] = n > 1 ? round2(n / 100) : round2(n);
  }
  return rollupModuleConstructs(moduleConstructs, numeric);
}

function compareConstructScores(server, client, tolerance = 0.2) {
  if (!client || typeof client !== "object") return { match: true, deltas: {} };
  const deltas = {};
  let maxDelta = 0;
  for (const [key, serverVal] of Object.entries(server)) {
    const clientVal = client[key];
    if (clientVal == null) continue;
    const delta = Math.abs(Number(serverVal) - Number(clientVal));
    deltas[key] = round2(delta);
    maxDelta = Math.max(maxDelta, delta);
  }
  return { match: maxDelta <= tolerance, deltas, maxDelta: round2(maxDelta) };
}

/**
 * Score an assessment session from telemetry (source of truth).
 * @param {{ moduleId: string; engineType: string; constructTags: string[] }} module
 * @param {Array<Record<string, unknown>>} events
 * @param {{ clientSummary?: Record<string, unknown> }} [opts]
 */
export function scoreAssessmentFromTelemetry(module, events, opts = {}) {
  const rules = getScoringRules(module.id ?? module.moduleId);
  const engineType = rules?.engineType ?? module.engineType;
  const moduleConstructs = rules?.constructs ?? module.constructTags ?? [];

  let facetScores = {};
  let constructScores = {};
  let answered = 0;
  let consistency = 1;
  let meanRt = null;

  const completeEv = findModuleCompleteEvent(events);
  const meta = completeEv?.metadata ?? {};
  const embeddedSummary = meta.sessionSummary ?? meta.session_summary;

  if (engineType === "likert") {
    const likert = scoreLikertFromTelemetry(events, rules ?? { items: [] });
    facetScores = likert.facetScores;
    answered = likert.answered;
    consistency = likert.consistency;
  } else if (engineType === "branching") {
    const br = scoreBranchingFromTelemetry(events, rules ?? { constructs: moduleConstructs });
    facetScores = br.facetScores;
    constructScores = br.constructScores;
    answered = br.choiceCount;
    consistency = br.consistency;
  } else if (engineType === "tracing") {
    const tr = scoreTracingFromTelemetry(events, rules ?? {});
    facetScores = tr.facetScores;
    constructScores = tr.constructScores;
    answered = tr.answered;
    consistency = tr.consistency;
  } else if (engineType === "reaction_time") {
    const rt = scoreReactionTimeFromTelemetry(events, rules ?? {});
    facetScores = rt.facetScores;
    constructScores = rt.constructScores;
    answered = rt.answered;
    consistency = rt.consistency;
    meanRt = facetScores.meanRt ?? null;
  } else {
    log("warn", "rule_scoring_unknown_engine", { moduleId: module.id, engineType });
  }

  constructScores = rollupModuleConstructs(moduleConstructs, facetScores, constructScores);

  if (embeddedSummary?.categoryScores) {
    const fromMeta = scoresFromClientSummary(embeddedSummary, moduleConstructs);
    if (fromMeta) {
      for (const [k, v] of Object.entries(fromMeta)) {
        if (constructScores[k] == null) constructScores[k] = v;
      }
    }
  }

  const clientScores = scoresFromClientSummary(opts.clientSummary, moduleConstructs);
  const validation = compareConstructScores(constructScores, clientScores);

  if (clientScores && !validation.match) {
    log("warn", "rule_scoring_client_mismatch", {
      moduleId: module.id,
      maxDelta: validation.maxDelta,
      deltas: validation.deltas
    });
  }

  const confidence = round2(
    Math.min(1, 0.35 + answered * 0.04 + consistency * 0.35 + (validation.match ? 0.2 : 0.05))
  );

  const rts = events
    .map((e) => e.response_time_ms)
    .filter((t) => t != null && Number.isFinite(t));

  if (meanRt == null && rts.length) {
    meanRt = Math.round(rts.reduce((a, b) => a + b, 0) / rts.length);
  }

  const difficultyReached = Math.max(0, ...events.map((e) => e.difficulty_level ?? 0));

  return {
    constructScores,
    facetScores,
    summary: {
      itemsAnswered: answered,
      consistencyScore: consistency,
      scoringConfidence: confidence,
      dominantPattern: embeddedSummary?.dominantPattern ?? opts.clientSummary?.dominantPattern ?? null,
      topTendencies: embeddedSummary?.topTendencies ?? opts.clientSummary?.topTendencies ?? [],
      clientValidation: validation,
      engineType
    },
    confidence,
    meanRt,
    consistency,
    difficultyReached,
    accuracy: null
  };
}
