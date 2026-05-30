import type { LikertItemConfig } from "../../configs/module-config.types";

export type AdaptiveSnapshot = {
  difficulty: number;
  streakCorrect: number;
  itemsCompleted: number;
  hesitationStreak: number;
  cognitiveLoadTarget: number;
};

export type ResponseMetrics = {
  responseTimeMs: number;
  interactionCount: number;
  changedAnswer: boolean;
  item: LikertItemConfig;
  value: number | string;
};

const MIN_DIFF = 1;
const MAX_DIFF = 5;

/**
 * Adaptive Likert routing (config-driven):
 * - Fast, stable responses → raise difficulty + prefer complex/ambiguous items
 * - Hesitation or answer churn → lower difficulty + prefer simple items
 */
export class AdaptiveController {
  state: AdaptiveSnapshot;

  constructor(initial?: Partial<AdaptiveSnapshot>) {
    this.state = {
      difficulty: initial?.difficulty ?? 1,
      streakCorrect: initial?.streakCorrect ?? 0,
      itemsCompleted: initial?.itemsCompleted ?? 0,
      hesitationStreak: initial?.hesitationStreak ?? 0,
      cognitiveLoadTarget: initial?.cognitiveLoadTarget ?? 2
    };
  }

  evaluateResponse(
    metrics: ResponseMetrics,
    opts: { fastResponseMs: number; hesitationMs: number }
  ): AdaptiveSnapshot {
    const fast = metrics.responseTimeMs <= opts.fastResponseMs;
    const hesitant =
      metrics.responseTimeMs >= opts.hesitationMs ||
      metrics.interactionCount > 5 ||
      metrics.changedAnswer;

    if (hesitant) {
      this.state.hesitationStreak += 1;
      this.state.streakCorrect = 0;
      if (this.state.hesitationStreak >= 2) {
        this.state.difficulty = Math.max(MIN_DIFF, this.state.difficulty - 1);
        this.state.cognitiveLoadTarget = Math.max(MIN_DIFF, this.state.cognitiveLoadTarget - 1);
        this.state.hesitationStreak = 0;
      }
    } else if (fast && !metrics.changedAnswer) {
      this.state.streakCorrect += 1;
      this.state.hesitationStreak = 0;
      if (this.state.streakCorrect >= 3) {
        this.state.difficulty = Math.min(MAX_DIFF, this.state.difficulty + 1);
        this.state.cognitiveLoadTarget = Math.min(MAX_DIFF, this.state.cognitiveLoadTarget + 1);
        this.state.streakCorrect = 0;
      }
    } else {
      this.state.streakCorrect = 0;
      this.state.hesitationStreak = 0;
    }

    this.state.itemsCompleted += 1;
    return { ...this.state };
  }

  pickNextItem(
    items: LikertItemConfig[],
    answeredIds: Set<string>,
    lastCategory?: string | null
  ): LikertItemConfig | null {
    const remaining = items.filter((i) => !answeredIds.has(i.id));
    if (!remaining.length) return null;

    const wantSimple = this.state.cognitiveLoadTarget <= 2 || this.state.hesitationStreak > 0;
    const wantComplex = this.state.cognitiveLoadTarget >= 4 && this.state.streakCorrect > 0;

    remaining.sort((a, b) => {
      const score = (item: LikertItemConfig) => {
        let s = Math.abs(item.difficulty - this.state.difficulty);
        s += Math.abs(item.difficulty - this.state.cognitiveLoadTarget) * 0.35;

        if (wantSimple && item.adaptiveTags?.includes("simple")) s -= 1.2;
        if (wantComplex && item.adaptiveTags?.includes("complex")) s -= 1;
        if (wantComplex && item.adaptiveTags?.includes("ambiguous")) s -= 0.8;
        if (wantSimple && item.adaptiveTags?.includes("ambiguous")) s += 0.6;
        if (lastCategory && item.category === lastCategory) s += 0.4;

        return s;
      };
      return score(a) - score(b) || a.difficulty - b.difficulty;
    });

    return remaining[0] ?? null;
  }

  toJSON(): AdaptiveSnapshot {
    return { ...this.state };
  }
}
