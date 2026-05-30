import { getSupabaseAdmin } from "../../config/supabase.js";
import { searchMbsOccupations } from "./classification.service.js";

/** Default construct → MBS domain affinity weights (expand via config) */
const CONSTRUCT_DOMAIN_WEIGHTS = {
  DWECK: { "MBS-12": 0.8, "MBS-01": 0.5 },
  MASLOW: { "MBS-20": 0.7, "MBS-16": 0.6 },
  COMMUNICATION: { "MBS-11": 0.9, "MBS-15": 0.7 },
  COLLABORATION: { "MBS-15": 0.8, "MBS-06": 0.6 },
  ATTENTION: { "MBS-01": 0.7, "MBS-04": 0.6 },
  COORDINATION: { "MBS-02": 0.8, "MBS-13": 0.5 },
  GRIT: { "MBS-18": 0.5, "MBS-02": 0.6 },
  LEWIN_BPE: { "MBS-20": 0.7 },
  SENSE_MEANING: { "MBS-20": 0.85 }
};

/** Life Journey psychological signal → construct proxy */
const SIGNAL_CONSTRUCT_MAP = {
  confidence: { MASLOW: 0.6, PSYCAP: 0.5 },
  resilience: { PSYCAP: 0.8, DWECK: 0.5 },
  ambition: { MCCLELLAND: 0.7, "MBS-06": 0.4 },
  adaptability: { DWECK: 0.7, ADAPTABILITY: 0.8 },
  social_trust: { COMMUNICATION: 0.5, "MBS-15": 0.6 }
};

function mergeDomainScores(target, source, scale = 1) {
  for (const [domain, w] of Object.entries(source)) {
    target[domain] = (target[domain] ?? 0) + w * scale;
  }
}

/**
 * @param {string} userId
 * @param {{ limit?: number }} opts
 */
export async function getMbsRecommendations(userId, opts = {}) {
  const supabase = getSupabaseAdmin();
  const limit = Math.min(24, opts.limit ?? 12);
  const domainScores = {};

  const { data: profile } = await supabase
    .from("learner_mbs_profile")
    .select("construct_scores, domain_affinities")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile?.domain_affinities && typeof profile.domain_affinities === "object") {
    mergeDomainScores(domainScores, profile.domain_affinities, 1);
  }

  if (profile?.construct_scores && typeof profile.construct_scores === "object") {
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
        const weights = CONSTRUCT_DOMAIN_WEIGHTS[construct.toUpperCase()];
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
    .map(([id]) => id);

  if (!topDomains.length) {
    topDomains.push("MBS-01", "MBS-12", "MBS-06");
  }

  const recommendations = [];
  for (const domainId of topDomains) {
    const { occupations } = await searchMbsOccupations({ mbsDomain: domainId, limit: Math.ceil(limit / topDomains.length) });
    for (const occ of occupations) {
      recommendations.push({
        ...occ,
        matchReason: `Aligned with ${domainId} based on assessments and life journey signals`,
        domainAffinityScore: domainScores[domainId] ?? 0
      });
    }
  }

  recommendations.sort((a, b) => b.domainAffinityScore - a.domainAffinityScore);

  return {
    topDomains: topDomains.map((id) => ({ id, score: domainScores[id] ?? 0 })),
    occupations: recommendations.slice(0, limit)
  };
}
