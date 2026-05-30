import type {
  BranchingAnswer,
  BranchingModuleConfig,
  PersistedSession,
  SessionAnalyticsSnapshot
} from "../../configs/module-config.types";

function isBranchingAnswer(a: unknown): a is BranchingAnswer {
  return typeof a === "object" && a != null && "optionId" in a && "scenarioId" in a;
}

export function computeBranchingAnalytics(
  session: PersistedSession,
  config: BranchingModuleConfig
): SessionAnalyticsSnapshot {
  const hesitationMs = config.hesitationMs ?? 15000;
  const entries = Object.values(session.answers).filter(isBranchingAnswer);
  const itemsAnswered = entries.length;

  if (!itemsAnswered) {
    return {
      avgResponseTimeMs: 0,
      answerChangeCount: 0,
      hesitationCount: 0,
      itemsAnswered: 0,
      dropoutItemId: session.currentNodeId ?? null,
      completionDurationMs: session.elapsedMs,
      consistencyScore: 1
    };
  }

  let totalRt = 0;
  let answerChangeCount = 0;
  let hesitationCount = 0;

  for (const answer of entries) {
    totalRt += answer.responseTimeMs;
    if (answer.changedChoice) answerChangeCount += 1;
    if (answer.hesitationTimeMs >= hesitationMs || answer.responseTimeMs >= hesitationMs) {
      hesitationCount += 1;
    }
  }

  const avgResponseTimeMs = Math.round(totalRt / itemsAnswered);
  const changeRate = answerChangeCount / itemsAnswered;
  const hesitationRate = hesitationCount / itemsAnswered;
  const consistencyScore = Math.max(0, Math.min(1, 1 - changeRate * 0.4 - hesitationRate * 0.35));

  const allDone =
    (session.completedScenarioIds?.length ?? 0) >= config.scenarios.length;

  return {
    avgResponseTimeMs,
    answerChangeCount,
    hesitationCount,
    itemsAnswered,
    dropoutItemId: allDone ? null : (session.currentNodeId ?? null),
    completionDurationMs: session.elapsedMs,
    consistencyScore: Math.round(consistencyScore * 100) / 100
  };
}

export function mergeBranchingAnalyticsIntoSession(
  session: PersistedSession,
  config: BranchingModuleConfig
): PersistedSession {
  return {
    ...session,
    sessionAnalytics: computeBranchingAnalytics(session, config)
  };
}
