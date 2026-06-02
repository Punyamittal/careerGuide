import { getSupabaseAdmin } from "../../config/supabase.js";
import {
  CONSTRUCT_DOMAIN_WEIGHTS,
  SIGNAL_CONSTRUCT_MAP
} from "../../constants/constructDomainWeights.js";
import { log } from "../../utils/logger.js";

const round3 = (n) => Math.round(n * 1000) / 1000;

function mergeDomainScores(target, source, scale = 1) {
  for (const [domain, w] of Object.entries(source)) {
    target[domain] = (target[domain] ?? 0) + w * scale;
  }
}

function constructsToDomains(constructScores) {
  const domainScores = {};
  for (const [construct, score] of Object.entries(constructScores)) {
    const weights = CONSTRUCT_DOMAIN_WEIGHTS[construct.toUpperCase()];
    if (!weights) continue;
    mergeDomainScores(domainScores, weights, Number(score) || 0.5);
  }
  return domainScores;
}

function normalizeConstructMap(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw)) {
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    out[k.toUpperCase()] = n > 1 ? round3(n / 100) : round3(n);
  }
  return out;
}

/**
 * Roll up assessment scores, Life Journey signals, and domain affinities into learner_mbs_profile.
 * @param {string} userId
 */
export async function materializeLearnerMbsProfile(userId) {
  const supabase = getSupabaseAdmin();
  const constructScores = {};
  const signalContributions = {};
  const sourceSummary = {
    moduleScoreCount: 0,
    lifeJourneyEventCount: 0,
    lastMaterializedAt: new Date().toISOString()
  };

  const { data: moduleScores, error: msErr } = await supabase
    .from("assessment_module_scores")
    .select("module_id, construct_scores, summary, scoring_provider, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(24);

  if (msErr) throw new Error(msErr.message);

  const moduleWeights = [];
  for (const row of moduleScores ?? []) {
    sourceSummary.moduleScoreCount += 1;
    const conf = Number(row.summary?.scoringConfidence ?? 0.7);
    moduleWeights.push(conf);
    const cs = normalizeConstructMap(row.construct_scores);
    for (const [construct, score] of Object.entries(cs)) {
      const key = construct.toUpperCase();
      if (!constructScores[key]) {
        constructScores[key] = { sum: 0, weight: 0 };
      }
      constructScores[key].sum += score * conf;
      constructScores[key].weight += conf;
    }
  }

  const rolledConstructs = {};
  for (const [construct, agg] of Object.entries(constructScores)) {
    rolledConstructs[construct] = round3(agg.weight ? agg.sum / agg.weight : agg.sum);
  }

  const { data: ljEvents, error: ljErr } = await supabase
    .from("life_journey_events")
    .select("signal_map, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (ljErr && !/life_journey|does not exist/i.test(String(ljErr.message))) {
    throw new Error(ljErr.message);
  }

  for (const ev of ljEvents ?? []) {
    sourceSummary.lifeJourneyEventCount += 1;
    for (const sig of ev.signal_map ?? []) {
      const signalKey = String(sig.signal ?? "").toLowerCase();
      const map = SIGNAL_CONSTRUCT_MAP[signalKey];
      if (!map) continue;
      const w = (Number(sig.weight) || 0.5) ** 2;
      signalContributions[signalKey] = (signalContributions[signalKey] ?? 0) + w;
      for (const [construct, weight] of Object.entries(map)) {
        const key = construct.toUpperCase();
        rolledConstructs[key] = round3((rolledConstructs[key] ?? 0.5) * 0.85 + w * weight * 0.15);
      }
    }
  }

  const domainAffinities = constructsToDomains(rolledConstructs);

  for (const [domain, score] of Object.entries(domainAffinities)) {
    domainAffinities[domain] = round3(score);
  }

  const profileConfidence = round3(
    Math.min(
      1,
      0.25 +
        Math.min(0.45, (moduleScores?.length ?? 0) * 0.08) +
        Math.min(0.2, (ljEvents?.length ?? 0) * 0.02) +
        (moduleWeights.length ? moduleWeights.reduce((a, b) => a + b, 0) / moduleWeights.length : 0) *
          0.25
    )
  );

  sourceSummary.profileConfidence = profileConfidence;

  const row = {
    user_id: userId,
    construct_scores: rolledConstructs,
    domain_affinities: domainAffinities,
    signal_contributions: signalContributions,
    source_summary: sourceSummary,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("learner_mbs_profile")
    .upsert(row, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  log("info", "learner_mbs_profile_materialized", {
    userId,
    constructCount: Object.keys(rolledConstructs).length,
    domainCount: Object.keys(domainAffinities).length,
    profileConfidence
  });

  return data;
}
