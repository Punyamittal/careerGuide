import { getSupabaseAdmin } from "../config/supabase.js";
import { getMbsRecommendations } from "./mbs/recommendation.service.js";
import { listMbsDomains } from "./mbs/classification.service.js";

/**
 * Build structured context for AI career coach from assessments, MBS profile, Life Journey, and recommendations.
 * @param {string} userId
 */
export async function buildCoachContext(userId) {
  const supabase = getSupabaseAdmin();

  const [
    profileRes,
    moduleScoresRes,
    ljRes,
    domainsRes,
    recommendations
  ] = await Promise.all([
    supabase
      .from("learner_mbs_profile")
      .select("construct_scores, domain_affinities, source_summary, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("assessment_module_scores")
      .select("module_id, construct_scores, summary, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("life_journey_events")
      .select("event_type, title, signal_map, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),
    listMbsDomains().catch(() => []),
    getMbsRecommendations(userId, { limit: 8 }).catch(() => ({
      topDomains: [],
      occupations: []
    }))
  ]);

  const profile = profileRes.data;
  const moduleScores = moduleScoresRes.data ?? [];
  const ljEvents = ljRes.error ? [] : (ljRes.data ?? []);

  const domainLabelById = Object.fromEntries(
    (domainsRes ?? []).map((d) => [d.id, d.label ?? d.code])
  );

  const constructEntries = Object.entries(profile?.construct_scores ?? {})
    .map(([k, v]) => ({ construct: k, score: Number(v) }))
    .filter((e) => Number.isFinite(e.score))
    .sort((a, b) => b.score - a.score);

  const domainEntries = Object.entries(profile?.domain_affinities ?? {})
    .map(([id, score]) => ({
      domainId: id,
      label: domainLabelById[id] ?? id,
      score: Number(score)
    }))
    .filter((e) => Number.isFinite(e.score))
    .sort((a, b) => b.score - a.score);

  const strongestConstructs = constructEntries.slice(0, 5);
  const growthAreas = constructEntries.slice(-3).reverse();
  const dominantDomains = domainEntries.slice(0, 4);

  const recentModules = moduleScores.map((m) => ({
    moduleId: m.module_id,
    dominantPattern: m.summary?.dominantPattern ?? null,
    topConstructs: Object.entries(m.construct_scores ?? {})
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 3)
      .map(([k, v]) => ({ construct: k, score: Number(v) }))
  }));

  const lifeJourneySignals = [];
  const lifeJourneyHighlights = [];
  for (const ev of ljEvents) {
    if (ev.title) lifeJourneyHighlights.push({ type: ev.event_type, title: ev.title });
    for (const sig of ev.signal_map ?? []) {
      lifeJourneySignals.push({
        signal: sig.signal,
        weight: sig.weight ?? 0.5
      });
    }
  }

  const topCareers = (recommendations.occupations ?? []).slice(0, 6).map((occ) => ({
    title: occ.title,
    socCode: occ.socCode,
    mbsDomain: occ.mbsDomainId,
    mbsDomainLabel: occ.mbsDomainLabel,
    matchReason: occ.matchReason,
    domainAffinityScore: occ.domainAffinityScore,
    constructJustification: occ.constructJustification
  }));

  const narrativeHints = [];
  if (strongestConstructs.length >= 2) {
    narrativeHints.push(
      `Strongest constructs: ${strongestConstructs
        .slice(0, 3)
        .map((c) => c.construct)
        .join(", ")}.`
    );
  }
  if (dominantDomains.length) {
    narrativeHints.push(
      `Top MBS domains: ${dominantDomains
        .map((d) => d.label || d.domainId)
        .join(", ")}.`
    );
  }
  if (topCareers[0]) {
    narrativeHints.push(
      `Top career match: ${topCareers[0].title} (${topCareers[0].matchReason ?? "profile alignment"}).`
    );
  }

  return {
    profileConfidence: profile?.source_summary?.profileConfidence ?? null,
    profileUpdatedAt: profile?.updated_at ?? null,
    assessment: {
      recentModules,
      strongestConstructs,
      growthAreas
    },
    mbs: {
      dominantDomains,
      constructScores: Object.fromEntries(constructEntries.map((e) => [e.construct, e.score]))
    },
    lifeJourney: {
      recentHighlights: lifeJourneyHighlights.slice(0, 6),
      signals: lifeJourneySignals.slice(0, 12)
    },
    recommendations: {
      topDomains: recommendations.topDomains ?? [],
      topCareers
    },
    coachInstructions: [
      "Explain recommendations using the user's construct scores and MBS domain affinities.",
      "Reference Life Journey signals when relevant.",
      "State WHY a career fits — do not give generic advice.",
      "If data is sparse, say what assessments would improve guidance."
    ],
    narrativeHints
  };
}
