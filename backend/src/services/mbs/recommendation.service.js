import { getSupabaseAdmin } from "../../config/supabase.js";
import { searchMbsOccupations } from "./classification.service.js";
import {
  CONSTRUCT_DOMAIN_WEIGHTS,
  SIGNAL_CONSTRUCT_MAP
} from "../../constants/constructDomainWeights.js";

function mergeDomainScores(target, source, scale = 1) {
  for (const [domain, w] of Object.entries(source)) {
    target[domain] = (target[domain] ?? 0) + w * scale;
  }
}

function topConstructsForDomain(domainId, constructScores) {
  const contributors = [];
  for (const [construct, weights] of Object.entries(CONSTRUCT_DOMAIN_WEIGHTS)) {
    if (!weights[domainId]) continue;
    const score = constructScores[construct] ?? constructScores[construct.toUpperCase()];
    if (score == null) continue;
    contributors.push({
      construct,
      score: Number(score),
      weight: weights[domainId]
    });
  }
  return contributors.sort((a, b) => b.score * b.weight - a.score * a.weight).slice(0, 3);
}

function buildMatchRationale(domainId, domainScore, constructScores, domainLabel) {
  const top = topConstructsForDomain(domainId, constructScores);
  const label = domainLabel ?? domainId;
  if (!top.length) {
    return {
      matchReason: `Aligned with ${label} based on your learner profile.`,
      constructJustification: []
    };
  }
  const parts = top.map(
    (c) => `${c.construct} (${Math.round(c.score * 100)}%)`
  );
  return {
    matchReason: `Strong fit for ${label}: your ${parts.join(", ")} scores support this domain.`,
    constructJustification: top.map((c) => ({
      construct: c.construct,
      score: Math.round(c.score * 1000) / 1000,
      domainWeight: c.weight
    }))
  };
}

/**
 * @param {string} userId
 * @param {{ limit?: number }} opts
 */
export async function getMbsRecommendations(userId, opts = {}) {
  const supabase = getSupabaseAdmin();
  const limit = Math.min(24, opts.limit ?? 12);
  const domainScores = {};
  const constructScores = {};

  const { data: profile } = await supabase
    .from("learner_mbs_profile")
    .select("construct_scores, domain_affinities, source_summary")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile?.domain_affinities && typeof profile.domain_affinities === "object") {
    mergeDomainScores(domainScores, profile.domain_affinities, 1);
  }

  if (profile?.construct_scores && typeof profile.construct_scores === "object") {
    Object.assign(constructScores, profile.construct_scores);
    for (const [construct, score] of Object.entries(profile.construct_scores)) {
      const weights = CONSTRUCT_DOMAIN_WEIGHTS[construct.toUpperCase()];
      if (weights) mergeDomainScores(domainScores, weights, Number(score) || 0.5);
    }
  }

  const { data: moduleScores } = await supabase
    .from("assessment_module_scores")
    .select("construct_scores")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  for (const row of moduleScores ?? []) {
    if (row.construct_scores && typeof row.construct_scores === "object") {
      for (const [construct, score] of Object.entries(row.construct_scores)) {
        const key = construct.toUpperCase();
        constructScores[key] = constructScores[key] ?? Number(score);
        const weights = CONSTRUCT_DOMAIN_WEIGHTS[key];
        if (weights) mergeDomainScores(domainScores, weights, Number(score) || 0.5);
      }
    }
  }

  const { data: ljEvents } = await supabase
    .from("life_journey_events")
    .select("signal_map")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  for (const ev of ljEvents ?? []) {
    for (const sig of ev.signal_map ?? []) {
      const map = SIGNAL_CONSTRUCT_MAP[sig.signal];
      if (!map) continue;
      const w = (sig.weight ?? 0.5) * (sig.weight ?? 0.5);
      mergeDomainScores(domainScores, map, w);
    }
  }

  const topDomains = Object.entries(domainScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, score]) => ({ id, score: Math.round(score * 1000) / 1000 }));

  if (!topDomains.length) {
    topDomains.push(
      { id: "MBS-01", score: 0.5 },
      { id: "MBS-12", score: 0.45 },
      { id: "MBS-06", score: 0.4 }
    );
  }

  const recommendations = [];
  for (const { id: domainId, score: domainScore } of topDomains) {
    const { occupations } = await searchMbsOccupations({
      mbsDomain: domainId,
      limit: Math.ceil(limit / topDomains.length)
    });
    for (const occ of occupations) {
      const { matchReason, constructJustification } = buildMatchRationale(
        domainId,
        domainScore,
        constructScores,
        occ.mbsDomainLabel
      );
      recommendations.push({
        ...occ,
        matchReason,
        constructJustification,
        domainAffinityScore: domainScores[domainId] ?? domainScore,
        mbsExplanation: `Occupation classified under ${occ.mbsDomainLabel ?? domainId} in the MBS–O*NET taxonomy.`
      });
    }
  }

  recommendations.sort((a, b) => b.domainAffinityScore - a.domainAffinityScore);

  return {
    profileConfidence: profile?.source_summary?.profileConfidence ?? null,
    topDomains,
    occupations: recommendations.slice(0, limit),
    constructScoresUsed: constructScores
  };
}
