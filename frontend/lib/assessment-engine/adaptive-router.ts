import type { AdaptiveState } from "./types";

/** 3-down / 1-up staircase (default for T4/T5) */
export function nextDifficulty(state: AdaptiveState, lastCorrect: boolean): AdaptiveState {
  const next = { ...state };
  if (lastCorrect) {
    next.streakCorrect += 1;
    if (next.streakCorrect >= 3) {
      next.difficulty = Math.min(5, next.difficulty + 1);
      next.streakCorrect = 0;
    }
  } else {
    next.streakCorrect = 0;
    next.difficulty = Math.max(1, next.difficulty - 1);
  }
  next.itemsCompleted += 1;
  return next;
}

export function shouldTerminate(state: AdaptiveState, maxItems = 20): boolean {
  return state.itemsCompleted >= maxItems;
}

export function initialAdaptiveState(): AdaptiveState {
  return { difficulty: 1, streakCorrect: 0, itemsCompleted: 0 };
}
