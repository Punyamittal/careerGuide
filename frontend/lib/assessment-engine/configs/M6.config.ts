import type { LikertModuleConfig } from "./module-config.types";
import { FREQ_5 } from "./shared-likert-scales";

/** M6 — Operant reinforcement sensitivity (feedback & consequences) */
export const M6_CONFIG: LikertModuleConfig = {
  moduleId: "M06",
  engineType: "likert",
  title: "Reinforcement",
  estimatedMinutes: 7,
  scoring: {
    provider: "rule",
    constructs: ["REINFORCEMENT", "FEEDBACK", "CONSEQUENCE_SENSITIVITY"]
  },
  fastResponseMs: 5500,
  hesitationMs: 11000,
  items: [
    {
      id: "M6-F01",
      type: "frequency",
      category: "positive_reinforcement",
      prompt: "How often does immediate praise or small rewards increase your effort on similar tasks?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["reinforcement", "positive"],
      scoringWeight: { positive_reinforcement: 1, recognition: 0.6 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M6-F02",
      type: "frequency",
      category: "feedback_sensitivity",
      prompt: "How often do you adjust your approach quickly after specific corrective feedback?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["reinforcement", "feedback"],
      scoringWeight: { feedback_sensitivity: 1, learning_behavior: 0.6 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M6-B01",
      type: "binary",
      category: "positive_reinforcement",
      prompt: "Do you work harder when progress is tracked visibly (streaks, points, leaderboards)?",
      binaryLabels: ["Not really", "Yes, clearly"],
      difficulty: 2,
      telemetryTags: ["reinforcement", "gamification"],
      scoringWeight: { positive_reinforcement: 1, achievement_orientation: 0.4 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M6-SD01",
      type: "semantic_differential",
      category: "negative_reinforcement",
      prompt: "When deadlines or consequences tighten, you tend to…",
      poles: ["Feel paralysed", "Focus and deliver"],
      difficulty: 2,
      telemetryTags: ["reinforcement", "pressure"],
      scoringWeight: { negative_reinforcement: 1, challenge_tolerance: 0.5 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M6-F03",
      type: "frequency",
      category: "negative_reinforcement",
      prompt: "How often does fear of a poor outcome push you to prepare more thoroughly?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["reinforcement", "avoidance"],
      scoringWeight: { negative_reinforcement: 1, emotional_resilience: 0.3 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M6-F04",
      type: "frequency",
      category: "feedback_sensitivity",
      prompt: "How often do you repeat behaviours that previously led to good results, even without explicit reward?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["reinforcement", "habit"],
      scoringWeight: { feedback_sensitivity: 1, learning_behavior: 0.5 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M6-B02",
      type: "binary",
      category: "positive_reinforcement",
      prompt: "Would you persist longer on a boring task if you knew a meaningful reward was coming at the end?",
      binaryLabels: ["Unlikely", "Very likely"],
      difficulty: 2,
      telemetryTags: ["reinforcement", "delay"],
      scoringWeight: { positive_reinforcement: 1, intrinsic_extrinsic: 0.5 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M6-SD02",
      type: "semantic_differential",
      category: "feedback_sensitivity",
      prompt: "When feedback is vague, you feel…",
      poles: ["Unaffected", "Uncertain how to improve"],
      difficulty: 2,
      telemetryTags: ["reinforcement", "clarity"],
      scoringWeight: { feedback_sensitivity: 1, feedback_response: 0.7 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M6-F05",
      type: "frequency",
      category: "negative_reinforcement",
      prompt: "How often do you stop a behaviour after one clear negative consequence?",
      scaleLabels: [...FREQ_5],
      difficulty: 3,
      telemetryTags: ["reinforcement", "punishment"],
      scoringWeight: { negative_reinforcement: 1, emotional_resilience: 0.4 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M6-SD03",
      type: "semantic_differential",
      category: "positive_reinforcement",
      prompt: "Your motivation responds more strongly to…",
      poles: ["Removing obstacles", "Adding rewards & recognition"],
      difficulty: 3,
      telemetryTags: ["reinforcement", "preference"],
      scoringWeight: { positive_reinforcement: 0.5, negative_reinforcement: 0.5 },
      adaptiveTags: ["ambiguous"]
    }
  ]
};
