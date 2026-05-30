import type {
  AdaptiveStateSnapshot,
  BranchingAnswer,
  BranchPathStep,
  BranchSignals,
  PersistedSession
} from "../../configs/module-config.types";

const STORAGE_PREFIX = "cg_assessment_v1";
const MAX_AGE_MS = 1000 * 60 * 60 * 24;

function storageKey(moduleId: string) {
  return `${STORAGE_PREFIX}:${moduleId}`;
}

export class BranchingSessionPersistence {
  static load(moduleId: string): PersistedSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(storageKey(moduleId));
      if (!raw) return null;
      const data = JSON.parse(raw) as PersistedSession;
      if (data.engineType !== "branching") return null;
      if (Date.now() - new Date(data.updatedAt).getTime() > MAX_AGE_MS) {
        BranchingSessionPersistence.clear(moduleId);
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
    scenarioOrder: string[]
  ): PersistedSession {
    const firstScenario = scenarioOrder[0] ?? null;
    return {
      sessionId,
      moduleId,
      engineType: "branching",
      currentScenarioId: firstScenario,
      currentNodeId: null,
      scenarioOrder,
      branchingPath: [],
      flags: {},
      signals: { empathy: 0, assertiveness: 0, escalation: 0, communication: 0 },
      completedScenarioIds: [],
      answers: {},
      adaptiveState: {
        difficulty: 1,
        streakCorrect: 0,
        itemsCompleted: 0,
        hesitationStreak: 0,
        impulsiveStreak: 0,
        nuancedStreak: 0
      },
      startedAt: new Date().toISOString(),
      elapsedMs: 0,
      updatedAt: new Date().toISOString()
    };
  }

  static recordChoice(
    session: PersistedSession,
    answer: BranchingAnswer,
    adaptive: AdaptiveStateSnapshot,
    next: {
      scenarioId: string | null;
      nodeId: string | null;
      path: BranchPathStep[];
      signals: BranchSignals;
      flags: Record<string, boolean>;
      completedScenarioIds: string[];
    },
    elapsedMs: number
  ): PersistedSession {
    const updated: PersistedSession = {
      ...session,
      currentScenarioId: next.scenarioId,
      currentNodeId: next.nodeId,
      branchingPath: next.path,
      flags: next.flags,
      signals: next.signals,
      completedScenarioIds: next.completedScenarioIds,
      answers: { ...session.answers, [`${answer.scenarioId}:${answer.nodeId}`]: answer },
      adaptiveState: { ...adaptive },
      elapsedMs,
      updatedAt: new Date().toISOString()
    };
    BranchingSessionPersistence.save(updated);
    return updated;
  }
}
