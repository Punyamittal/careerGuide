import type { BranchingModuleConfig, ScenarioConfig } from "../../configs/module-config.types";
import type { AdaptiveStateSnapshot } from "../../configs/module-config.types";

export class BranchingAdaptiveController {
  state: AdaptiveStateSnapshot;

  constructor(initial?: Partial<AdaptiveStateSnapshot>) {
    this.state = {
      difficulty: initial?.difficulty ?? 1,
      streakCorrect: initial?.streakCorrect ?? 0,
      itemsCompleted: initial?.itemsCompleted ?? 0,
      hesitationStreak: initial?.hesitationStreak ?? 0,
      impulsiveStreak: initial?.impulsiveStreak ?? 0,
      nuancedStreak: initial?.nuancedStreak ?? 0
    };
  }

  evaluateChoice(metrics: {
    responseTimeMs: number;
    escalationScore: number;
    empathySignal: number;
    changedChoice: boolean;
    impulsiveMs: number;
    hesitationMs: number;
  }) {
    const impulsive =
      metrics.responseTimeMs <= metrics.impulsiveMs && metrics.escalationScore >= 0.6;
    const nuanced =
      metrics.responseTimeMs >= metrics.impulsiveMs &&
      metrics.responseTimeMs <= metrics.hesitationMs &&
      metrics.empathySignal >= 0.5 &&
      metrics.escalationScore <= 0.4 &&
      !metrics.changedChoice;

    if (impulsive) {
      this.state.impulsiveStreak = (this.state.impulsiveStreak ?? 0) + 1;
      this.state.nuancedStreak = 0;
      if ((this.state.impulsiveStreak ?? 0) >= 2) {
        this.state.difficulty = Math.max(1, this.state.difficulty - 1);
        this.state.impulsiveStreak = 0;
      }
    } else if (nuanced) {
      this.state.nuancedStreak = (this.state.nuancedStreak ?? 0) + 1;
      this.state.impulsiveStreak = 0;
      if ((this.state.nuancedStreak ?? 0) >= 2) {
        this.state.difficulty = Math.min(5, this.state.difficulty + 1);
        this.state.nuancedStreak = 0;
      }
    } else {
      this.state.impulsiveStreak = 0;
      this.state.nuancedStreak = 0;
    }

    this.state.itemsCompleted += 1;
    return { ...this.state };
  }

  pickNextScenario(
    config: BranchingModuleConfig,
    completedIds: Set<string>
  ): ScenarioConfig | null {
    const remaining = config.scenarios.filter((s) => !completedIds.has(s.id));
    if (!remaining.length) return null;

    const wantDeEscalation = (this.state.impulsiveStreak ?? 0) > 0 || this.state.difficulty <= 2;
    const wantAmbiguous = (this.state.nuancedStreak ?? 0) > 0 || this.state.difficulty >= 4;

    remaining.sort((a, b) => {
      const score = (s: ScenarioConfig) => {
        let sc = Math.abs(s.difficulty - this.state.difficulty);
        if (wantDeEscalation && s.adaptiveTags?.includes("de-escalation")) sc -= 2;
        if (wantAmbiguous && s.adaptiveTags?.includes("ambiguous")) sc -= 1.5;
        return sc;
      };
      return score(a) - score(b);
    });

    return remaining[0] ?? null;
  }

  toJSON() {
    return { ...this.state };
  }
}
