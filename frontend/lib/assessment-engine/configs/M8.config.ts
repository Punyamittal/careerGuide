import type { LikertModuleConfig } from "./module-config.types";
import { FREQ_5 } from "./shared-likert-scales";

/** M8 — Vroom Expectancy Theory (expectancy × instrumentality × valence) */
export const M8_CONFIG: LikertModuleConfig = {
  moduleId: "M08",
  engineType: "likert",
  title: "Expectancy Theory",
  estimatedMinutes: 8,
  scoring: {
    provider: "rule",
    constructs: ["VROOM", "EXPECTANCY", "INSTRUMENTALITY", "VALENCE"]
  },
  fastResponseMs: 5500,
  hesitationMs: 11000,
  items: [
    {
      id: "M8-F01",
      type: "frequency",
      category: "expectancy_belief",
      prompt: "How often do you believe that higher effort will lead to better performance on important tasks?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["expectancy", "effort_performance"],
      scoringWeight: { expectancy_belief: 1, growth_motivation: 0.5 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M8-F02",
      type: "frequency",
      category: "instrumentality",
      prompt: "How often do you trust that good performance will be noticed and rewarded?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["instrumentality", "reward_link"],
      scoringWeight: { instrumentality: 1, perceived_fairness: 0.5 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M8-F03",
      type: "frequency",
      category: "valence",
      prompt: "How often do the rewards on offer (grades, pay, recognition) genuinely matter to you?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["valence", "motivation"],
      scoringWeight: { valence: 1, intrinsic_extrinsic: 0.5 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M8-B01",
      type: "binary",
      category: "expectancy_belief",
      prompt: "If you studied twice as hard, do you expect your results would improve noticeably?",
      binaryLabels: ["Unlikely", "Very likely"],
      difficulty: 2,
      telemetryTags: ["expectancy", "study"],
      scoringWeight: { expectancy_belief: 1, learning_behavior: 0.5 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M8-SD01",
      type: "semantic_differential",
      category: "instrumentality",
      prompt: "In your experience, performance and outcomes are…",
      poles: ["Poorly connected", "Strongly linked"],
      difficulty: 2,
      telemetryTags: ["instrumentality", "meritocracy"],
      scoringWeight: { instrumentality: 1, reward_distribution: 0.5 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M8-F04",
      type: "frequency",
      category: "valence",
      prompt: "How often do you choose goals because the payoff feels personally meaningful, not just required?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["valence", "meaning"],
      scoringWeight: { valence: 1, long_term_ambition: 0.5 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M8-B02",
      type: "binary",
      category: "instrumentality",
      prompt: "Would you invest extra effort on a task if you were unsure anyone would evaluate it?",
      binaryLabels: ["Probably not", "Yes, still would"],
      difficulty: 3,
      telemetryTags: ["instrumentality", "intrinsic"],
      scoringWeight: { instrumentality: 0.5, valence: 0.5, intrinsic_extrinsic: 0.6 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M8-SD02",
      type: "semantic_differential",
      category: "expectancy_belief",
      prompt: "When facing a new skill, you expect mastery to come from…",
      poles: ["Mostly innate talent", "Mostly deliberate practice"],
      difficulty: 2,
      telemetryTags: ["expectancy", "mindset"],
      scoringWeight: { expectancy_belief: 1, growth_motivation: 0.6 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M8-F05",
      type: "frequency",
      category: "instrumentality",
      prompt: "How often have you seen effort go unrewarded in ways that reduced your motivation?",
      scaleLabels: [...FREQ_5],
      difficulty: 3,
      telemetryTags: ["instrumentality", "disillusion"],
      scoringWeight: { instrumentality: 1, perceived_fairness: 0.6 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M8-F06",
      type: "frequency",
      category: "valence",
      prompt: "How often do you decline opportunities because the offered outcomes aren't worth the cost?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["valence", "tradeoff"],
      scoringWeight: { valence: 1, autonomy: 0.4 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M8-SD03",
      type: "semantic_differential",
      category: "expectancy_belief",
      prompt: "Your willingness to try hard depends most on…",
      poles: ["Belief you can succeed", "Value of the reward"],
      difficulty: 3,
      telemetryTags: ["expectancy", "valence_balance"],
      scoringWeight: { expectancy_belief: 0.5, valence: 0.5 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M8-B03",
      type: "binary",
      category: "valence",
      prompt: "Would you pursue a prestigious opportunity that doesn't align with your interests?",
      binaryLabels: ["Yes, for status", "No, not worth it"],
      difficulty: 2,
      telemetryTags: ["valence", "prestige"],
      scoringWeight: { valence: 1, recognition: 0.5, intrinsic_extrinsic: 0.4 },
      adaptiveTags: ["complex"]
    }
  ]
};
