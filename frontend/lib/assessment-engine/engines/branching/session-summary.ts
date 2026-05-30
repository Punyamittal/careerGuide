import type {
  BranchingModuleConfig,
  BranchSignals,
  PersistedSession,
  SessionAnalyticsSnapshot,
  SessionSummarySnapshot
} from "../../configs/module-config.types";
import { mergeBranchingAnalyticsIntoSession } from "./session-analytics";

const SIGNAL_LABELS: Record<keyof BranchSignals, string> = {
  empathy: "Empathy",
  assertiveness: "Assertiveness",
  escalation: "Escalation control",
  communication: "Communication"
};

function normaliseSignals(signals: BranchSignals, choiceCount: number): Record<string, number> {
  const scale = Math.max(1, choiceCount * 0.85);
  const raw: Record<string, number> = {
    empathy: signals.empathy / scale,
    assertiveness: signals.assertiveness / scale,
    communication: signals.communication / scale,
    escalation: Math.max(0, 1 - signals.escalation / scale)
  };
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [SIGNAL_LABELS[k as keyof BranchSignals] ?? k, Math.round(v * 100)])
  );
}

export function computeBranchingSummary(
  session: PersistedSession,
  config: BranchingModuleConfig,
  analytics: SessionAnalyticsSnapshot
): SessionSummarySnapshot {
  const signals = session.signals ?? {
    empathy: 0,
    assertiveness: 0,
    escalation: 0,
    communication: 0
  };
  const choiceCount = analytics.itemsAnswered || 1;
  const categoryScores = normaliseSignals(signals, choiceCount);

  const ranked = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);
  const dominantPattern = ranked[0]?.[0] ?? "Balanced";
  const topTendencies = ranked.slice(0, 3).map(([k]) => k);

  const insights: string[] = [
    `Your strongest signal in this module is ${dominantPattern.toLowerCase()}.`
  ];
  if (analytics.consistencyScore >= 0.75) {
    insights.push("You made steady, consistent choices throughout the scenarios.");
  } else if (analytics.answerChangeCount > 0) {
    insights.push("You reconsidered some choices — a sign of careful judgment.");
  }
  if (signals.escalation / Math.max(1, choiceCount) < 0.35) {
    insights.push("You tended to de-escalate or avoid conflict-heavy responses.");
  }
  if (signals.empathy / Math.max(1, choiceCount) >= 0.65) {
    insights.push("Empathetic responses featured strongly in your decision pattern.");
  }

  return {
    completionTimeMs: analytics.completionDurationMs,
    dominantPattern,
    topTendencies,
    consistencyScore: analytics.consistencyScore,
    categoryScores,
    insights,
    scenariosCompleted: session.completedScenarioIds?.length ?? config.scenarios.length,
    scenariosTotal: config.scenarios.length
  };
}

export function attachBranchingSummaryToSession(
  session: PersistedSession,
  config: BranchingModuleConfig
): PersistedSession {
  const withAnalytics = mergeBranchingAnalyticsIntoSession(session, config);
  const analytics = withAnalytics.sessionAnalytics!;
  return {
    ...withAnalytics,
    sessionSummary: computeBranchingSummary(withAnalytics, config, analytics)
  };
}
