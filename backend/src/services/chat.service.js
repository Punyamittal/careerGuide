import { generateText } from "./ai.service.js";

const mentorPrompt = (message, context) => `You are a concise career mentor for a psychometric platform.

Context (JSON, may be partial):
${context ? JSON.stringify(context).slice(0, 2500) : "{}"}

User message:
${message}

Reply in under 120 words. Be practical. If unsure, say what information would help.`;

export const careerChat = async (message, context) => {
  const { text, provider } = await generateText(mentorPrompt(message, context));
  return { reply: text, provider };
};
