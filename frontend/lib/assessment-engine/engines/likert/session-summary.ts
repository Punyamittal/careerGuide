import { categoryLabel } from "../../configs/category-labels";
import type {
  ItemAnswer,
  LikertItemConfig,
  LikertModuleConfig,
  PersistedSession,
  SessionAnalyticsSnapshot,
  SessionSummarySnapshot
} from "../../configs/module-config.types";
import { normaliseAnswerValue } from "./session-analytics";

function isItemAnswer(a: unknown): a is ItemAnswer {
  return typeof a === "object" && a != null && "responseTimeMs" in a;
}

/** Config-driven rule summary — no module-specific hardcoding. */
export function computeSessionSummary(
  session: PersistedSession,
  config: LikertModuleConfig,
  analytics: SessionAnalyticsSnapshot
): SessionSummarySnapshot {
  const constructScores: Record<string, number> = {};
  const categoryTotals: Record<string, number> = {};

  for (const item of config.items) {
    const raw = session.answers[item.id];
    if (!isItemAnswer(raw)) continue;

    const norm = normaliseAnswerValue(item, raw.value);
    categoryTotals[item.category] = (categoryTotals[item.category] ?? 0) + norm;

    for (const [construct, weight] of Object.entries(item.scoringWeight)) {
      constructScores[construct] = (constructScores[construct] ?? 0) + norm * weight;
    }
  }

  const rankedConstructs = Object.entries(constructScores).sort((a, b) => b[1] - a[1]);
  const rankedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  const dominantKey = rankedConstructs[0]?.[0] ?? rankedCategories[0]?.[0] ?? "balanced";
  const topTendencies = rankedConstructs.slice(0, 3).map(([k]) => categoryLabel(k));

  if (!topTendencies.length && rankedCategories.length) {
    topTendencies.push(...rankedCategories.slice(0, 3).map(([k]) => categoryLabel(k)));
  }

  return {
    completionTimeMs: analytics.completionDurationMs,
    dominantPattern: categoryLabel(dominantKey),
    topTendencies,
    consistencyScore: analytics.consistencyScore,
    categoryScores: Object.fromEntries(
      rankedCategories.map(([k, v]) => [categoryLabel(k), Math.round(v * 100) / 100])
    ),
    insights: buildLikertInsights(dominantKey, analytics, rankedCategories)
  };
}

function buildLikertInsights(
  dominantKey: string,
  analytics: SessionAnalyticsSnapshot,
  rankedCategories: [string, number][]
): string[] {
  const insights: string[] = [
    `Your dominant motivation pattern is ${categoryLabel(dominantKey).toLowerCase()}.`
  ];
  if (analytics.consistencyScore >= 0.75) {
    insights.push("Your answers were highly consistent — a clear profile emerged.");
  }
  if (analytics.hesitationCount > 0 && analytics.hesitationCount >= analytics.itemsAnswered * 0.3) {
    insights.push("You took extra time on several items, suggesting thoughtful self-reflection.");
  }
  if (rankedCategories.length >= 2) {
    const second = categoryLabel(rankedCategories[1][0]);
    insights.push(`${categoryLabel(dominantKey)} and ${second} were your top two themes.`);
  }
  return insights;
}

export function attachSummaryToSession(
  session: PersistedSession,
  config: LikertModuleConfig
): PersistedSession {
  const analytics = session.sessionAnalytics ?? {
    avgResponseTimeMs: 0,
    answerChangeCount: 0,
    hesitationCount: 0,
    itemsAnswered: 0,
    dropoutItemId: null,
    completionDurationMs: session.elapsedMs,
    consistencyScore: 1
  };
  return {
    ...session,
    sessionSummary: computeSessionSummary(session, config, analytics)
  };
}
