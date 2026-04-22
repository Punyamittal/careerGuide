export type GameType = "physiology" | "iq";

export type SkillAxis =
  | "memory"
  | "processingSpeed"
  | "logic"
  | "balance"
  | "coordination"
  | "creativity";

export type GameDefinition = {
  id: string;
  name: string;
  type: GameType;
  ageMin: number;
  ageMax: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  skills: string[];
  rating: number;
  plays: number;
};

export const gameCatalog: GameDefinition[] = [
  {
    id: "maze-navigation",
    name: "Maze Navigation",
    type: "iq",
    ageMin: 6,
    ageMax: 14,
    difficulty: "beginner",
    skills: ["Spatial", "Logic"],
    rating: 4.7,
    plays: 2341
  },
  {
    id: "memory-sequence",
    name: "Memory Sequence",
    type: "iq",
    ageMin: 5,
    ageMax: 16,
    difficulty: "intermediate",
    skills: ["Memory", "Attention"],
    rating: 4.8,
    plays: 1983
  },
  {
    id: "pattern-logic",
    name: "Pattern Logic",
    type: "iq",
    ageMin: 7,
    ageMax: 18,
    difficulty: "intermediate",
    skills: ["Pattern Recognition", "Reasoning"],
    rating: 4.6,
    plays: 1420
  },
  {
    id: "focus-grid",
    name: "Focus Grid",
    type: "iq",
    ageMin: 8,
    ageMax: 20,
    difficulty: "advanced",
    skills: ["Working Memory", "Attention"],
    rating: 4.5,
    plays: 1172
  },
  {
    id: "rhythm-tap",
    name: "Rhythm Tap",
    type: "physiology",
    ageMin: 6,
    ageMax: 18,
    difficulty: "intermediate",
    skills: ["Timing", "Coordination"],
    rating: 4.6,
    plays: 1760
  },
  {
    id: "balance-challenge",
    name: "Balance Challenge",
    type: "physiology",
    ageMin: 7,
    ageMax: 18,
    difficulty: "advanced",
    skills: ["Balance", "Reaction Time"],
    rating: 4.5,
    plays: 1512
  },
  {
    id: "reaction-lane",
    name: "Reaction Lane",
    type: "physiology",
    ageMin: 8,
    ageMax: 20,
    difficulty: "intermediate",
    skills: ["Reaction Time", "Coordination"],
    rating: 4.6,
    plays: 1298
  },
  {
    id: "stability-tracker",
    name: "Stability Tracker",
    type: "physiology",
    ageMin: 9,
    ageMax: 22,
    difficulty: "advanced",
    skills: ["Balance", "Control"],
    rating: 4.4,
    plays: 978
  }
];

export type CareerProfile = {
  name: string;
  domain: "STEM" | "Arts" | "Business" | "Physical" | "Social";
  required: Record<SkillAxis, number>;
};

export const careerProfiles: CareerProfile[] = [
  {
    name: "Software Engineer",
    domain: "STEM",
    required: { memory: 65, processingSpeed: 72, logic: 92, balance: 35, coordination: 40, creativity: 60 }
  },
  {
    name: "Doctor",
    domain: "Social",
    required: { memory: 78, processingSpeed: 85, logic: 80, balance: 62, coordination: 75, creativity: 58 }
  },
  {
    name: "Architect",
    domain: "STEM",
    required: { memory: 60, processingSpeed: 64, logic: 82, balance: 42, coordination: 50, creativity: 90 }
  },
  {
    name: "Athlete",
    domain: "Physical",
    required: { memory: 45, processingSpeed: 80, logic: 58, balance: 95, coordination: 95, creativity: 62 }
  },
  {
    name: "Teacher",
    domain: "Social",
    required: { memory: 72, processingSpeed: 62, logic: 70, balance: 50, coordination: 58, creativity: 74 }
  },
  {
    name: "Designer",
    domain: "Arts",
    required: { memory: 56, processingSpeed: 58, logic: 61, balance: 45, coordination: 50, creativity: 94 }
  }
];

export function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, value, i) => sum + value * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const magB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  if (!magA || !magB) return 0;
  return dot / (magA * magB);
}

export function calculateNextDifficulty(
  currentDifficulty: number,
  accuracy: number,
  completionRate: number,
  targetAccuracy = 0.75
) {
  void targetAccuracy;
  if (accuracy > 0.85 && completionRate > 0.9) return Math.min(currentDifficulty + 1, 10);
  if (accuracy < 0.65 || completionRate < 0.5) return Math.max(currentDifficulty - 1, 1);
  return currentDifficulty;
}
