import type { LikertModuleConfig } from "./module-config.types";

const FREQ = ["Never", "Rarely", "Sometimes", "Often", "Almost always"] as const;

/**
 * M1 — Maslow Motivation (medium-scale Likert validation set)
 * 18 items · stress-tests long sessions, adaptive routing, telemetry, persistence
 */
export const M1_CONFIG: LikertModuleConfig = {
  moduleId: "M01",
  engineType: "likert",
  title: "Motivation Profile",
  estimatedMinutes: 12,
  scoring: {
    provider: "rule",
    constructs: ["MASLOW", "MOTIVATION", "INTEREST_EXPLORER_PREP"]
  },
  fastResponseMs: 5500,
  hesitationMs: 11000,
  checkpointInterval: 5,
  checkpoints: [
    {
      afterIndex: 5,
      message: "Nice steady pace. A third of the way through — answer honestly, there are no right or wrong responses."
    },
    {
      afterIndex: 10,
      message: "Past the halfway mark. Take a breath if you need it, then continue when ready."
    },
    {
      afterIndex: 15,
      message: "Almost there — just a few more questions to complete your motivation profile."
    }
  ],
  items: [
    {
      id: "M1-F01",
      type: "frequency",
      category: "safety_security",
      prompt: "How often do you feel genuinely safe and supported in your daily environment?",
      scaleLabels: [...FREQ],
      difficulty: 1,
      telemetryTags: ["maslow_safety", "foundation"],
      scoringWeight: { safety_security: 1, emotional_resilience: 0.3 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M1-F02",
      type: "frequency",
      category: "growth_motivation",
      prompt: "How often do you seek opportunities that help you grow, even when they feel uncomfortable?",
      scaleLabels: [...FREQ],
      difficulty: 1,
      telemetryTags: ["growth", "challenge"],
      scoringWeight: { growth_motivation: 1, challenge_tolerance: 0.4 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M1-B01",
      type: "binary",
      category: "collaboration_independence",
      prompt: "When working toward an important goal, do you usually prefer collaborating with others over working alone?",
      binaryLabels: ["Mostly alone", "Mostly with others"],
      difficulty: 1,
      telemetryTags: ["social_preference", "belonging"],
      scoringWeight: { collaboration_independence: 1, social_energy: 0.5 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M1-SD01",
      type: "semantic_differential",
      category: "curiosity",
      prompt: "When you encounter something unfamiliar, you feel…",
      poles: ["Reluctant to explore", "Eager to understand"],
      difficulty: 2,
      telemetryTags: ["curiosity", "exploration"],
      scoringWeight: { curiosity: 1, routine_exploration: 0.6 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M1-F03",
      type: "frequency",
      category: "achievement_orientation",
      prompt: "How often do you set clear performance targets and track your progress toward them?",
      scaleLabels: [...FREQ],
      difficulty: 2,
      telemetryTags: ["achievement", "goal_setting"],
      scoringWeight: { achievement_orientation: 1, long_term_ambition: 0.4 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M1-F04",
      type: "frequency",
      category: "social_energy",
      prompt: "How often do you feel energised after group discussions or team activities?",
      scaleLabels: [...FREQ],
      difficulty: 2,
      telemetryTags: ["social_energy", "belonging"],
      scoringWeight: { social_energy: 1, collaboration_independence: 0.4 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M1-B02",
      type: "binary",
      category: "routine_exploration",
      prompt: "Do you generally prefer a predictable daily routine over frequent change and novelty?",
      binaryLabels: ["Prefer routine", "Prefer novelty"],
      difficulty: 2,
      telemetryTags: ["routine", "exploration"],
      scoringWeight: { routine_exploration: 1, curiosity: 0.5 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M1-SD02",
      type: "semantic_differential",
      category: "feedback_response",
      prompt: "When you receive constructive feedback, you typically feel…",
      poles: ["Defensive or discouraged", "Open and motivated"],
      difficulty: 2,
      telemetryTags: ["feedback", "learning"],
      scoringWeight: { feedback_response: 1, learning_behavior: 0.6, emotional_resilience: 0.3 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M1-F05",
      type: "frequency",
      category: "autonomy",
      prompt: "How often do you feel you have meaningful control over how you approach your work or studies?",
      scaleLabels: [...FREQ],
      difficulty: 2,
      telemetryTags: ["autonomy", "self_direction"],
      scoringWeight: { autonomy: 1, intrinsic_extrinsic: 0.4 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M1-F06",
      type: "frequency",
      category: "challenge_tolerance",
      prompt: "How often do you voluntarily take on tasks that are significantly harder than your current skill level?",
      scaleLabels: [...FREQ],
      difficulty: 3,
      telemetryTags: ["challenge", "stretch"],
      scoringWeight: { challenge_tolerance: 1, growth_motivation: 0.5 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M1-SD03",
      type: "semantic_differential",
      category: "recognition",
      prompt: "When your contributions are acknowledged publicly, you feel…",
      poles: ["Uncomfortable or indifferent", "Validated and motivated"],
      difficulty: 3,
      telemetryTags: ["recognition", "esteem"],
      scoringWeight: { recognition: 1, achievement_orientation: 0.4, intrinsic_extrinsic: 0.3 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M1-B03",
      type: "binary",
      category: "intrinsic_extrinsic",
      prompt: "Are you more driven by internal satisfaction than by external rewards such as grades, pay, or praise?",
      binaryLabels: ["External rewards", "Internal satisfaction"],
      difficulty: 3,
      telemetryTags: ["intrinsic", "motivation_source"],
      scoringWeight: { intrinsic_extrinsic: 1, autonomy: 0.4 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M1-F07",
      type: "frequency",
      category: "learning_behavior",
      prompt: "How often do you actively look for resources or mentors to improve skills outside formal requirements?",
      scaleLabels: [...FREQ],
      difficulty: 3,
      telemetryTags: ["learning", "self_improvement"],
      scoringWeight: { learning_behavior: 1, growth_motivation: 0.5, curiosity: 0.3 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M1-SD04",
      type: "semantic_differential",
      category: "long_term_ambition",
      prompt: "When you picture your future career, it feels…",
      poles: ["Vague and uncertain", "Directional and purposeful"],
      difficulty: 3,
      telemetryTags: ["ambition", "future_orientation"],
      scoringWeight: { long_term_ambition: 1, achievement_orientation: 0.5 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M1-F08",
      type: "frequency",
      category: "emotional_resilience",
      prompt: "How often do you recover quickly after setbacks without losing confidence in your abilities?",
      scaleLabels: [...FREQ],
      difficulty: 3,
      telemetryTags: ["resilience", "recovery"],
      scoringWeight: { emotional_resilience: 1, challenge_tolerance: 0.4 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M1-F09",
      type: "frequency",
      category: "growth_motivation",
      prompt: "How often do you revisit past failures to extract lessons rather than avoid thinking about them?",
      scaleLabels: [...FREQ],
      difficulty: 4,
      telemetryTags: ["growth", "reflection"],
      scoringWeight: { growth_motivation: 0.8, learning_behavior: 0.6, emotional_resilience: 0.4 },
      adaptiveTags: ["complex", "ambiguous"]
    },
    {
      id: "M1-SD05",
      type: "semantic_differential",
      category: "collaboration_independence",
      prompt: "In high-pressure situations, you tend to rely on…",
      poles: ["Your own judgment alone", "Shared input from others"],
      difficulty: 4,
      telemetryTags: ["collaboration", "pressure"],
      scoringWeight: { collaboration_independence: 1, social_energy: 0.3, autonomy: 0.3 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M1-B04",
      type: "binary",
      category: "intrinsic_extrinsic",
      prompt: "Would you still pursue your current path if external recognition were unlikely?",
      binaryLabels: ["Probably not", "Yes, likely"],
      difficulty: 4,
      telemetryTags: ["intrinsic", "commitment"],
      scoringWeight: { intrinsic_extrinsic: 1, long_term_ambition: 0.5, autonomy: 0.3 },
      adaptiveTags: ["complex", "ambiguous"]
    }
  ]
};
