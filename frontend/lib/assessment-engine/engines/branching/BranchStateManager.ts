import type {
  BranchingAnswer,
  BranchingModuleConfig,
  BranchingOption,
  BranchPathStep,
  BranchSignals,
  BranchWeights,
  PersistedSession,
  ScenarioConfig
} from "../../configs/module-config.types";

export type BranchState = {
  currentScenarioId: string | null;
  currentNodeId: string | null;
  path: BranchPathStep[];
  flags: Record<string, boolean>;
  signals: BranchSignals;
  completedScenarioIds: Set<string>;
  weightModifiers: BranchWeights;
  tone: "calm" | "tense" | "neutral" | "hopeful";
};

const emptySignals = (): BranchSignals => ({
  empathy: 0,
  assertiveness: 0,
  escalation: 0,
  communication: 0
});

export type BranchStateInit = {
  currentScenarioId?: string | null;
  currentNodeId?: string | null;
  path?: BranchPathStep[];
  flags?: Record<string, boolean>;
  signals?: BranchSignals;
  completedScenarioIds?: string[] | Set<string>;
  weightModifiers?: BranchWeights;
  tone?: "calm" | "tense" | "neutral" | "hopeful";
};

export class BranchStateManager {
  state: BranchState;

  constructor(initial?: BranchStateInit) {
    const completed = initial?.completedScenarioIds;
    this.state = {
      currentScenarioId: initial?.currentScenarioId ?? null,
      currentNodeId: initial?.currentNodeId ?? null,
      path: initial?.path ?? [],
      flags: initial?.flags ?? {},
      signals: initial?.signals ?? emptySignals(),
      completedScenarioIds: new Set(completed instanceof Set ? completed : (completed ?? [])),
      weightModifiers: initial?.weightModifiers ?? {},
      tone: initial?.tone ?? "neutral"
    };
  }

  static fromSession(session: PersistedSession): BranchStateManager {
    return new BranchStateManager({
      currentScenarioId: session.currentScenarioId ?? null,
      currentNodeId: session.currentNodeId ?? null,
      path: session.branchingPath ?? [],
      flags: session.flags ?? {},
      signals: session.signals ?? emptySignals(),
      completedScenarioIds: session.completedScenarioIds ?? [],
      weightModifiers: {},
      tone: "neutral"
    });
  }

  get branchDepth(): number {
    return this.state.path.length;
  }

  recordStep(scenarioId: string, nodeId: string, optionId?: string) {
    this.state.path.push({
      scenarioId,
      nodeId,
      optionId,
      at: new Date().toISOString()
    });
    this.state.currentScenarioId = scenarioId;
    this.state.currentNodeId = nodeId;
  }

  applyWeights(weights: BranchWeights) {
    const mod = this.state.weightModifiers;
    const add = (key: keyof BranchSignals, val?: number) => {
      if (val == null) return;
      const m = mod[key as keyof BranchWeights] ?? 1;
      this.state.signals[key] = (this.state.signals[key] ?? 0) + val * m;
    };
    add("empathy", weights.empathy);
    add("assertiveness", weights.assertiveness);
    add("escalation", weights.escalation);
    add("communication", weights.communication);
  }

  setFlag(key: string, value: boolean) {
    this.state.flags[key] = value;
  }

  isBranchLocked(key: string): boolean {
    return this.state.flags[`lock:${key}`] === true;
  }

  completeScenario(scenarioId: string) {
    this.state.completedScenarioIds.add(scenarioId);
  }

  toPersisted(session: PersistedSession): PersistedSession {
    return {
      ...session,
      currentScenarioId: this.state.currentScenarioId,
      currentNodeId: this.state.currentNodeId,
      branchingPath: [...this.state.path],
      flags: { ...this.state.flags },
      signals: { ...this.state.signals },
      completedScenarioIds: [...this.state.completedScenarioIds],
      updatedAt: new Date().toISOString()
    };
  }
}

export function findNode(config: BranchingModuleConfig, scenarioId: string, nodeId: string) {
  const scenario = config.scenarios.find((s) => s.id === scenarioId);
  return scenario?.nodes.find((n) => n.id === nodeId) ?? null;
}

export function findScenario(config: BranchingModuleConfig, scenarioId: string): ScenarioConfig | null {
  return config.scenarios.find((s) => s.id === scenarioId) ?? null;
}

export function buildBranchingAnswer(
  scenarioId: string,
  nodeId: string,
  option: BranchingOption,
  metrics: {
    responseTimeMs: number;
    hesitationTimeMs: number;
    changedChoice: boolean;
    branchDepth: number;
  }
): BranchingAnswer {
  return {
    nodeId,
    scenarioId,
    optionId: option.id,
    responseTimeMs: metrics.responseTimeMs,
    hesitationTimeMs: metrics.hesitationTimeMs,
    changedChoice: metrics.changedChoice,
    branchDepth: metrics.branchDepth,
    weights: option.weights,
    submittedAt: new Date().toISOString()
  };
}
