import type { BranchingModuleConfig, BranchingOption } from "../../configs/module-config.types";
import type { BranchStateManager } from "./BranchStateManager";
import { findNode } from "./BranchStateManager";

export type ConsequenceResult = {
  nextNodeId: string | null;
  scenarioComplete: boolean;
  consequenceText?: string;
  tone?: "calm" | "tense" | "neutral" | "hopeful";
};

export class ConsequenceEngine {
  apply(
    config: BranchingModuleConfig,
    state: BranchStateManager,
    scenarioId: string,
    nodeId: string,
    option: BranchingOption
  ): ConsequenceResult {
    const effects = option.effects;

    if (effects?.lockBranches) {
      for (const b of effects.lockBranches) state.setFlag(`lock:${b}`, true);
    }
    if (effects?.unlockBranches) {
      for (const b of effects.unlockBranches) state.setFlag(`lock:${b}`, false);
    }
    if (effects?.weightModifiers) {
      state.state.weightModifiers = {
        ...state.state.weightModifiers,
        ...effects.weightModifiers
      };
    }
    if (effects?.toneShift) {
      state.state.tone = effects.toneShift;
    }

    state.applyWeights(option.weights);

    let nextNodeId = option.nextNodeId ?? null;

    if (nextNodeId) {
      const nextNode = findNode(config, scenarioId, nextNodeId);
      if (!nextNode) nextNodeId = null;
      else if (nextNode.tags?.some((t) => state.isBranchLocked(t))) {
        nextNodeId = null;
      }
    }

    const scenarioComplete = nextNodeId === null;

    return {
      nextNodeId,
      scenarioComplete,
      consequenceText: option.consequence,
      tone: effects?.toneShift ?? state.state.tone
    };
  }
}
