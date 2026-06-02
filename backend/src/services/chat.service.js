import { generateText } from "./ai.service.js";

const mentorPrompt = (message, context) => {
  const coach = context?.coach;
  const coachBlock = coach
    ? `
Assessment-aware coach data (use this to explain WHY careers fit):
- Profile confidence: ${coach.profileConfidence ?? "unknown"}
- Strongest constructs: ${JSON.stringify(coach.assessment?.strongestConstructs?.slice(0, 4) ?? [])}
- Growth areas: ${JSON.stringify(coach.assessment?.growthAreas ?? [])}
- Top MBS domains: ${JSON.stringify(coach.mbs?.dominantDomains?.slice(0, 3) ?? [])}
- Top career matches: ${JSON.stringify(coach.recommendations?.topCareers?.slice(0, 4) ?? [])}
- Life journey signals: ${JSON.stringify(coach.lifeJourney?.signals?.slice(0, 6) ?? [])}
- Hints: ${(coach.narrativeHints ?? []).join(" ")}
Instructions: ${(coach.coachInstructions ?? []).join(" ")}
`
    : "";

  return `You are a concise career mentor for CareerGUIDE (psychometric + MBS + Life Journey platform).

${coachBlock}
Additional context (JSON):
${context ? JSON.stringify({ ...context, coach: undefined }).slice(0, 2200) : "{}"}

User message:
${message}

Reply in under 140 words. Explain recommendations using the user's actual construct scores and MBS domains when available. If data is sparse, name which assessments would help.`;
};

export const careerChat = async (message, context) => {
  const { text, provider } = await generateText(mentorPrompt(message, context));
  return { reply: text, provider };
};
