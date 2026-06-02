/**
 * Construct → MBS domain affinity weights (shared by recommendations + profile materialization).
 */
export const CONSTRUCT_DOMAIN_WEIGHTS = {
  DWECK: { "MBS-12": 0.8, "MBS-01": 0.5 },
  MASLOW: { "MBS-20": 0.7, "MBS-16": 0.6 },
  MOTIVATION: { "MBS-20": 0.5, "MBS-06": 0.4 },
  MCCLELLAND: { "MBS-06": 0.7, "MBS-20": 0.5 },
  HERZBERG: { "MBS-16": 0.6, "MBS-20": 0.4 },
  EQUITY: { "MBS-15": 0.5, "MBS-06": 0.4 },
  REINFORCEMENT: { "MBS-12": 0.5, "MBS-01": 0.4 },
  ATTRIBUTION: { "MBS-12": 0.6, "MBS-01": 0.5 },
  VROOM: { "MBS-06": 0.6, "MBS-20": 0.5 },
  PSYCAP: { "MBS-18": 0.7, "MBS-16": 0.6 },
  COMMUNICATION: { "MBS-11": 0.9, "MBS-15": 0.7 },
  COLLABORATION: { "MBS-15": 0.8, "MBS-06": 0.6 },
  EMPATHY: { "MBS-15": 0.7, "MBS-11": 0.5 },
  SOCIAL_SKILLS: { "MBS-15": 0.75, "MBS-11": 0.6 },
  TEAMWORK: { "MBS-15": 0.8, "MBS-06": 0.55 },
  ATTENTION: { "MBS-01": 0.7, "MBS-04": 0.6 },
  COORDINATION: { "MBS-02": 0.8, "MBS-13": 0.5 },
  GRIT: { "MBS-18": 0.5, "MBS-02": 0.6 },
  LEWIN_BPE: { "MBS-20": 0.7 },
  SENSE_MEANING: { "MBS-20": 0.85 },
  ADAPTABILITY: { "MBS-12": 0.7, "MBS-01": 0.5 }
};

/** Life Journey psychological signal → construct proxy */
export const SIGNAL_CONSTRUCT_MAP = {
  confidence: { MASLOW: 0.6, PSYCAP: 0.5 },
  resilience: { PSYCAP: 0.8, DWECK: 0.5 },
  ambition: { MCCLELLAND: 0.7 },
  adaptability: { DWECK: 0.7, ADAPTABILITY: 0.8 },
  social_trust: { COMMUNICATION: 0.5 },
  curiosity: { DWECK: 0.5, MASLOW: 0.3 },
  leadership: { MCCLELLAND: 0.6, COMMUNICATION: 0.4 }
};
