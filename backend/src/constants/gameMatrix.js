export const GAME_RESULT_MATRIX = {
  "maze-navigation": {
    axis: { logic: 0.5, processingSpeed: 0.3, memory: 0.2 },
    domain: { STEM: 0.55, Business: 0.25, Social: 0.2 }
  },
  "pattern-logic": {
    axis: { logic: 0.6, creativity: 0.2, processingSpeed: 0.2 },
    domain: { STEM: 0.6, Business: 0.25, Arts: 0.15 }
  },
  "memory-sequence": {
    axis: { memory: 0.55, processingSpeed: 0.25, logic: 0.2 },
    domain: { STEM: 0.45, Social: 0.3, Business: 0.25 }
  },
  "focus-grid": {
    axis: { memory: 0.4, processingSpeed: 0.4, logic: 0.2 },
    domain: { STEM: 0.4, Business: 0.35, Social: 0.25 }
  },
  "rhythm-tap": {
    axis: { coordination: 0.45, processingSpeed: 0.35, balance: 0.2 },
    domain: { Physical: 0.6, Arts: 0.25, Social: 0.15 }
  },
  "reaction-lane": {
    axis: { coordination: 0.5, processingSpeed: 0.4, logic: 0.1 },
    domain: { Physical: 0.55, STEM: 0.25, Arts: 0.2 }
  },
  "balance-challenge": {
    axis: { balance: 0.55, coordination: 0.3, processingSpeed: 0.15 },
    domain: { Physical: 0.65, Social: 0.2, Arts: 0.15 }
  },
  "stability-tracker": {
    axis: { balance: 0.5, coordination: 0.25, creativity: 0.25 },
    domain: { Physical: 0.5, Arts: 0.3, Social: 0.2 }
  }
};

export const DEFAULT_GAME_MATRIX = {
  axis: { memory: 0.2, processingSpeed: 0.2, logic: 0.2, balance: 0.2, coordination: 0.1, creativity: 0.1 },
  domain: { STEM: 0.3, Business: 0.2, Social: 0.2, Arts: 0.15, Physical: 0.15 }
};
