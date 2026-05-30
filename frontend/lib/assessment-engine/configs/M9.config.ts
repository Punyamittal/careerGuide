import type { LikertModuleConfig } from "./module-config.types";
import { FREQ_5 } from "./shared-likert-scales";

/** M9 — Psychological Capital (HERO: Hope, Efficacy, Resilience, Optimism) */
export const M9_CONFIG: LikertModuleConfig = {
  moduleId: "M09",
  engineType: "likert",
  title: "Psychological Capital",
  estimatedMinutes: 8,
  scoring: {
    provider: "rule",
    constructs: ["PSYCAP", "HOPE", "EFFICACY", "RESILIENCE", "OPTIMISM"]
  },
  fastResponseMs: 5500,
  hesitationMs: 11000,
  checkpointInterval: 4,
  checkpoints: [
    {
      afterIndex: 4,
      message: "Halfway — these items reflect how you bounce back and stay motivated."
    },
    {
      afterIndex: 8,
      message: "Last few questions for your PsyCap profile."
    }
  ],
  items: [
    {
      id: "M9-F01",
      type: "frequency",
      category: "hope",
      prompt: "How often do you feel confident you can find paths to reach important goals?",
      scaleLabels: [...FREQ_5],
      difficulty: 1,
      telemetryTags: ["psycap", "hope"],
      scoringWeight: { hope: 1, long_term_ambition: 0.5 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M9-F02",
      type: "frequency",
      category: "hope",
      prompt: "How often do you generate multiple strategies when your first plan hits obstacles?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["psycap", "pathways"],
      scoringWeight: { hope: 1, learning_behavior: 0.5 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M9-B01",
      type: "binary",
      category: "efficacy",
      prompt: "When facing a unfamiliar challenge, do you usually believe you can learn what is needed?",
      binaryLabels: ["Doubtful", "Confident I can learn"],
      difficulty: 1,
      telemetryTags: ["psycap", "efficacy"],
      scoringWeight: { efficacy: 1, growth_motivation: 0.6 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M9-SD01",
      type: "semantic_differential",
      category: "efficacy",
      prompt: "When tasks get harder, your confidence tends to…",
      poles: ["Drop quickly", "Stay steady or rise"],
      difficulty: 2,
      telemetryTags: ["psycap", "self_efficacy"],
      scoringWeight: { efficacy: 1, challenge_tolerance: 0.6 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M9-F03",
      type: "frequency",
      category: "resilience",
      prompt: "How often do you recover emotionally within days after a significant setback?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["psycap", "resilience"],
      scoringWeight: { resilience: 1, emotional_resilience: 0.8 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M9-F04",
      type: "frequency",
      category: "resilience",
      prompt: "How often do you treat stress as something you can manage rather than something that defines you?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["psycap", "stress"],
      scoringWeight: { resilience: 1, emotional_resilience: 0.6 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M9-B02",
      type: "binary",
      category: "optimism",
      prompt: "Do you generally expect that things will work out if you keep trying?",
      binaryLabels: ["Usually pessimistic", "Usually optimistic"],
      difficulty: 1,
      telemetryTags: ["psycap", "optimism"],
      scoringWeight: { optimism: 1, hope: 0.4 },
      adaptiveTags: ["simple"]
    },
    {
      id: "M9-SD02",
      type: "semantic_differential",
      category: "optimism",
      prompt: "When imagining your future career, you feel…",
      poles: ["Worried & limited", "Hopeful & open"],
      difficulty: 2,
      telemetryTags: ["psycap", "future"],
      scoringWeight: { optimism: 1, long_term_ambition: 0.5 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M9-F05",
      type: "frequency",
      category: "efficacy",
      prompt: "How often do you volunteer for stretch assignments that test your abilities?",
      scaleLabels: [...FREQ_5],
      difficulty: 3,
      telemetryTags: ["psycap", "stretch"],
      scoringWeight: { efficacy: 1, achievement_orientation: 0.5 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M9-F06",
      type: "frequency",
      category: "hope",
      prompt: "How often do setbacks make you refine your goals rather than abandon them?",
      scaleLabels: [...FREQ_5],
      difficulty: 2,
      telemetryTags: ["psycap", "persistence"],
      scoringWeight: { hope: 1, resilience: 0.5 },
      adaptiveTags: ["complex"]
    },
    {
      id: "M9-SD03",
      type: "semantic_differential",
      category: "resilience",
      prompt: "After criticism, you tend to…",
      poles: ["Ruminate for a long time", "Reframe and move forward"],
      difficulty: 3,
      telemetryTags: ["psycap", "criticism"],
      scoringWeight: { resilience: 1, feedback_response: 0.5 },
      adaptiveTags: ["ambiguous"]
    },
    {
      id: "M9-B03",
      type: "binary",
      category: "optimism",
      prompt: "Would you still pursue a goal if the first two attempts failed?",
      binaryLabels: ["Probably give up", "Keep pursuing"],
      difficulty: 2,
      telemetryTags: ["psycap", "grit"],
      scoringWeight: { optimism: 1, resilience: 0.6, hope: 0.4 },
      adaptiveTags: ["complex"]
    }
  ]
};
