import type { LikertModuleConfig } from "./module-config.types";

/** Human-readable labels for category keys (config-driven lookup). */
export const CATEGORY_LABELS: Record<string, string> = {
  safety_security: "Safety & security",
  growth_motivation: "Growth motivation",
  achievement_orientation: "Achievement orientation",
  social_energy: "Social energy",
  autonomy: "Autonomy",
  curiosity: "Curiosity",
  challenge_tolerance: "Challenge tolerance",
  recognition: "Recognition",
  routine_exploration: "Routine vs exploration",
  collaboration_independence: "Collaboration vs independence",
  feedback_response: "Feedback response",
  long_term_ambition: "Long-term ambition",
  learning_behavior: "Learning behavior",
  emotional_resilience: "Emotional resilience",
  intrinsic_extrinsic: "Intrinsic motivation",
  achievement_need: "Achievement need",
  affiliation_need: "Affiliation need",
  power_need: "Power need",
  hygiene_factors: "Hygiene factors",
  motivator_factors: "Motivator factors",
  job_satisfaction: "Job satisfaction",
  equity_comparison: "Social comparison",
  perceived_fairness: "Perceived fairness",
  reward_distribution: "Reward distribution",
  positive_reinforcement: "Positive reinforcement",
  negative_reinforcement: "Negative reinforcement",
  feedback_sensitivity: "Feedback sensitivity",
  internal_attribution: "Internal attribution",
  external_attribution: "External attribution",
  locus_of_control: "Locus of control",
  expectancy_belief: "Expectancy belief",
  instrumentality: "Instrumentality",
  valence: "Valence",
  hope: "Hope",
  efficacy: "Self-efficacy",
  resilience: "Resilience",
  optimism: "Optimism"
};

export function categoryLabel(key: string): string {
  return CATEGORY_LABELS[key] ?? key.replace(/_/g, " ");
}
