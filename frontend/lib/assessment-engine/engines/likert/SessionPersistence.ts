import type { ItemAnswer, LikertModuleConfig, PersistedSession, SessionAnalyticsSnapshot } from "../../configs/module-config.types";
import type { AdaptiveSnapshot } from "./AdaptiveController";

const STORAGE_PREFIX = "cg_assessment_v1";
const MAX_AGE_MS = 1000 * 60 * 60 * 24;

function storageKey(moduleId: string) {
  return `${STORAGE_PREFIX}:${moduleId}`;
}

export class SessionPersistence {
  static load(moduleId: string): PersistedSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(storageKey(moduleId));
      if (!raw) return null;
      const data = JSON.parse(raw) as PersistedSession;
      if (data.engineType !== "likert") return null;
      if (Date.now() - new Date(data.updatedAt).getTime() > MAX_AGE_MS) {
        SessionPersistence.clear(moduleId);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  static save(session: PersistedSession) {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      storageKey(session.moduleId),
      JSON.stringify({ ...session, updatedAt: new Date().toISOString() })
    );
  }

  static clear(moduleId: string) {
    if (typeof window === "undefined") return;
    localStorage.removeItem(storageKey(moduleId));
  }

  static createEmpty(
    sessionId: string,
    moduleId: string,
    itemOrder: string[]
  ): PersistedSession {
    return {
      sessionId,
      moduleId,
      engineType: "likert",
      currentItemId: itemOrder[0] ?? null,
      itemOrder,
      answers: {},
      adaptiveState: {
        difficulty: 1,
        streakCorrect: 0,
        itemsCompleted: 0,
        hesitationStreak: 0,
        cognitiveLoadTarget: 2
      },
      startedAt: new Date().toISOString(),
      elapsedMs: 0,
      updatedAt: new Date().toISOString()
    };
  }

  static recordAnswer(
    session: PersistedSession,
    itemId: string,
    answer: ItemAnswer,
    adaptive: AdaptiveSnapshot,
    nextItemId: string | null,
    elapsedMs: number,
    analytics?: SessionAnalyticsSnapshot
  ): PersistedSession {
    const next: PersistedSession = {
      ...session,
      currentItemId: nextItemId,
      answers: { ...session.answers, [itemId]: answer },
      adaptiveState: { ...adaptive },
      elapsedMs,
      sessionAnalytics: analytics ?? session.sessionAnalytics,
      updatedAt: new Date().toISOString()
    };
    SessionPersistence.save(next);
    return next;
  }
}

/** Resolve checkpoint message from module config after N items answered. */
export function resolveCheckpointMessage(
  config: LikertModuleConfig,
  answeredCount: number
): string | null {
  const fromList = config.checkpoints?.find((c) => c.afterIndex === answeredCount);
  if (fromList) return fromList.message;

  const interval = config.checkpointInterval ?? 0;
  if (interval > 0 && answeredCount > 0 && answeredCount % interval === 0) {
    const pct = Math.round((answeredCount / config.items.length) * 100);
    return `You've completed ${answeredCount} of ${config.items.length} questions (${pct}%). Continue at your own pace.`;
  }
  return null;
}
