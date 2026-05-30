import type {
  ItemAnswer,
  LikertItemConfig,
  LikertModuleConfig,
  PersistedSession,
  SessionAnalyticsSnapshot
} from "../../configs/module-config.types";

function isItemAnswer(a: unknown): a is ItemAnswer {
  return typeof a === "object" && a != null && "responseTimeMs" in a;
}

export function computeSessionAnalytics(
  session: PersistedSession,
  config: LikertModuleConfig
): SessionAnalyticsSnapshot {
  const hesitationMs = config.hesitationMs ?? 12000;
  const entries = Object.entries(session.answers).filter(([, a]) => isItemAnswer(a)) as [
    string,
    ItemAnswer
  ][];

  const itemsAnswered = entries.length;
  if (!itemsAnswered) {
    return {
      avgResponseTimeMs: 0,
      answerChangeCount: 0,
      hesitationCount: 0,
      itemsAnswered: 0,
      dropoutItemId: session.currentItemId ?? null,
      completionDurationMs: session.elapsedMs,
      consistencyScore: 1
    };
  }

  let totalRt = 0;
  let answerChangeCount = 0;
  let hesitationCount = 0;

  for (const [, answer] of entries) {
    totalRt += answer.responseTimeMs;
    if (answer.changedAnswer) answerChangeCount += 1;
    if (answer.responseTimeMs >= hesitationMs || answer.interactionCount > 4) {
      hesitationCount += 1;
    }
  }

  const avgResponseTimeMs = Math.round(totalRt / itemsAnswered);
  const changeRate = answerChangeCount / itemsAnswered;
  const hesitationRate = hesitationCount / itemsAnswered;
  const consistencyScore = Math.max(0, Math.min(1, 1 - changeRate * 0.45 - hesitationRate * 0.35));

  const allAnswered = config.items.every((i) => session.answers[i.id] != null);
  const dropoutItemId = allAnswered ? null : (session.currentItemId ?? null);

  return {
    avgResponseTimeMs,
    answerChangeCount,
    hesitationCount,
    itemsAnswered,
    dropoutItemId,
    completionDurationMs: session.elapsedMs,
    consistencyScore: Math.round(consistencyScore * 100) / 100
  };
}

/** Normalise Likert value to 0–1 for scoring aggregation. */
export function normaliseAnswerValue(item: LikertItemConfig, value: number | string): number {
  if (item.type === "binary") {
    return value === 1 || value === "1" ? 1 : 0;
  }
  const n = typeof value === "number" ? value : Number(value);
  if (item.type === "frequency") return Math.max(0, Math.min(1, (n - 1) / 4));
  if (item.type === "semantic_differential") return Math.max(0, Math.min(1, (n - 1) / 4));
  return 0.5;
}

export function mergeAnalyticsIntoSession(
  session: PersistedSession,
  config: LikertModuleConfig
): PersistedSession {
  return {
    ...session,
    sessionAnalytics: computeSessionAnalytics(session, config)
  };
}
