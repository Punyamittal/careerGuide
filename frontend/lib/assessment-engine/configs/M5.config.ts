import type { LikertModuleConfig } from "./module-config.types";
import { FREQ_5 } from "./shared-likert-scales";

/** M5 — Adams Equity Theory (perceived fairness & comparison) */
export const M5_CONFIG: LikertModuleConfig = {
  moduleId: "M05",
  engineType: "likert",
  title: "Equity Theory",
  estimatedMinutes: 7,
  scoring: {
    provider: "rule",
    constructs: ["EQUITY", "FAIRNESS", "SOCIAL_COMPARISON"]
  },
  fastResponseMs: 5500,
  hesitationMs: 11000,
  items: [
    {
      id: "M5-F01",
      type: "frequency",
      category: "equity_comparison",
      prompt: "How often do you compare your effort and rewards to what peers receive?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["equity", "comparison"],
      scoringWeight: { equity_comparison: 1, social_energy: 0.3 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M5-SD01",
      type: "semantic_differential",
      category: "perceived_fairness",
      prompt: "When you receive less recognition than someone who contributed less, you feel…",
      poles: ["Accepting", "Strongly under-rewarded"],
      difficulty: 2,
      telemetryTags: ["equity", "underreward"],
      scoringWeight: { perceived_fairness: 1, recognition: 0.5 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M5-B01",
      type: "binary",
      category: "perceived_fairness",
      prompt: "If a teammate gets praise for work you mostly did, would you reduce your effort next time?",
      binaryLabels: ["Keep same effort", "Reduce effort"],
      difficulty: 2,
      telemetryTags: ["equity", "withdrawal"],
      scoringWeight: { perceived_fairness: 1, emotional_resilience: 0.3 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M5-F02",
      type: "frequency",
      category: "reward_distribution",
      prompt: "How often do transparent criteria for grades, pay, or promotion matter to your motivation?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["equity", "transparency"],
      scoringWeight: { reward_distribution: 1, perceived_fairness: 0.6 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M5-F03",
      type: "frequency",
      category: "equity_comparison",
      prompt: "How often do you mentally track whether your input-to-outcome ratio feels balanced?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["equity", "ratio"],
      scoringWeight: { equity_comparison: 1, achievement_orientation: 0.3 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M5-SD02",
      type: "semantic_differential",
      category: "perceived_fairness",
      prompt: "When you are over-rewarded relative to peers, you tend to feel…",
      poles: ["Comfortable", "Guilty or uneasy"],
      difficulty: 3,
      telemetryTags: ["equity", "overreward"],
      scoringWeight: { perceived_fairness: 1, intrinsic_extrinsic: 0.4 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M5-B02",
      type: "binary",
      category: "reward_distribution",
      prompt: "Would you speak up if group project credit was assigned unfairly?",
      binaryLabels: ["Stay quiet", "Speak up"],
      difficulty: 2,
      telemetryTags: ["equity", "voice"],
      scoringWeight: { reward_distribution: 1, collaboration_independence: 0.4 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M5-F04",
      type: "frequency",
      category: "perceived_fairness",
      prompt: "How often does perceived unfairness change how hard you try on the next task?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["equity", "motivation"],
      scoringWeight: { perceived_fairness: 1, growth_motivation: 0.3 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M5-SD03",
      type: "semantic_differential",
      category: "equity_comparison",
      prompt: "You mainly evaluate fairness by comparing yourself to…",
      poles: ["Your own past effort", "People around you"],
      difficulty: 2,
      telemetryTags: ["equity", "reference"],
      scoringWeight: { equity_comparison: 1, perceived_fairness: 0.5 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M5-F05",
      type: "frequency",
      category: "reward_distribution",
      prompt: "How often do you restore motivation after unfair treatment by seeking clearer expectations or feedback?",
      scaleLabels: [...FREQ_5],
      difficulty: 3,
      telemetryTags: ["equity", "restoration"],
      scoringWeight: { reward_distribution: 1, feedback_response: 0.5, emotional_resilience: 0.4 },
      adaptiveTags: ["ambiguous"]
    }
  ]
};
