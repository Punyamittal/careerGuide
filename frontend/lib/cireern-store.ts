"use client";

import { create } from "zustand";
import { careerProfiles, cosineSimilarity, type SkillAxis } from "@/lib/cireern-data";

type SessionSummary = {
  gameId: string;
  score: number;
  accuracy: number;
  errors: number;
  durationSeconds: number;
  playedAt: string;
};

type ActionSummary = {
  gameId: string;
  at: string;
  success: boolean;
};

type OnboardingProfile = {
  role: "Student" | "Parent" | null;
  name: string;
  ageBand: string;
};

type CireernState = {
  xp: number;
  level: number;
  streak: number;
  sessions: SessionSummary[];
  actions: ActionSummary[];
  skills: Record<SkillAxis, number>;
  onboardingProfile: OnboardingProfile;
  addAction: (action: ActionSummary) => void;
  addSession: (session: SessionSummary) => void;
  setOnboardingProfile: (profile: OnboardingProfile) => void;
  getCareerMatches: () => Array<{ name: string; matchPct: number }>;
};

const baseSkills: Record<SkillAxis, number> = {
  memory: 50,
  processingSpeed: 50,
  logic: 50,
  balance: 50,
  coordination: 50,
  creativity: 50
};

const gameSkillBoost: Record<string, Partial<Record<SkillAxis, number>>> = {
  "maze-navigation": { logic: 3, processingSpeed: 1 },
  "pattern-logic": { logic: 3, creativity: 1 },
  "memory-sequence": { memory: 4, processingSpeed: 1 },
  "focus-grid": { memory: 3, processingSpeed: 2 },
  "rhythm-tap": { coordination: 3, processingSpeed: 2 },
  "reaction-lane": { coordination: 3, processingSpeed: 2 },
  "balance-challenge": { balance: 4, coordination: 2 },
  "stability-tracker": { balance: 3, creativity: 1 }
};

function computeLevel(xp: number) {
  const thresholds = [0, 100, 250, 500, 900, 1400, 2000, 2700, 3500, 4500];
  let level = 1;
  for (let i = 0; i < thresholds.length; i += 1) {
    if (xp >= thresholds[i]) level = i + 1;
  }
  return Math.min(level, 10);
}

export const useCireernStore = create<CireernState>((set, get) => ({
  xp: 0,
  level: 1,
  streak: 1,
  sessions: [],
  actions: [],
  skills: baseSkills,
  onboardingProfile: {
    role: null,
    name: "",
    ageBand: ""
  },
  setOnboardingProfile: (profile) => set({ onboardingProfile: profile }),
  addAction: (action) => {
    const state = get();
    set({
      actions: [action, ...state.actions].slice(0, 500)
    });
  },
  addSession: (session) => {
    const state = get();
    const xpGain = 50 + (session.accuracy > 0.8 ? 25 : 0);
    const updates = gameSkillBoost[session.gameId] ?? {};
    const nextSkills = { ...state.skills };
    for (const [axis, gain] of Object.entries(updates) as Array<[SkillAxis, number]>) {
      nextSkills[axis] = Math.min(100, nextSkills[axis] + gain);
    }
    const nextXp = state.xp + xpGain;
    set({
      xp: nextXp,
      level: computeLevel(nextXp),
      sessions: [session, ...state.sessions].slice(0, 30),
      skills: nextSkills
    });
  },
  getCareerMatches: () => {
    const skills = get().skills;
    const vector = [
      skills.memory,
      skills.processingSpeed,
      skills.logic,
      skills.balance,
      skills.coordination,
      skills.creativity
    ];
    return careerProfiles
      .map((career) => {
        const requirement = [
          career.required.memory,
          career.required.processingSpeed,
          career.required.logic,
          career.required.balance,
          career.required.coordination,
          career.required.creativity
        ];
        return {
          name: career.name,
          matchPct: Math.round(cosineSimilarity(vector, requirement) * 100)
        };
      })
      .sort((a, b) => b.matchPct - a.matchPct);
  }
}));
