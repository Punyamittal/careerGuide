import { env } from "../config/env.js";

const truncate = (text, max = 4000) => (text.length > max ? `${text.slice(0, max)}…` : text);

export const generateWithOllama = async (prompt) => {
  const url = `${env.ollama.baseUrl.replace(/\/$/, "")}/api/generate`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), env.ollama.timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: env.ollama.model,
        prompt: truncate(prompt, 8000),
        stream: false
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Ollama HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const text = data.response?.trim() || "";
    if (!text) throw new Error("Empty Ollama response");
    return { text, provider: "ollama" };
  } finally {
    clearTimeout(t);
  }
};

export const generateWithOpenAI = async (prompt) => {
  if (!env.openai.apiKey) throw new Error("OpenAI not configured");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openai.apiKey}`
    },
    body: JSON.stringify({
      model: env.openai.model,
      messages: [
        { role: "system", content: "You are a concise career coach. Follow output format exactly." },
        { role: "user", content: truncate(prompt, 12000) }
      ],
      temperature: 0.4,
      max_tokens: 900
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim() || "";
  if (!text) throw new Error("Empty OpenAI response");
  return { text, provider: "openai" };
};

/**
 * Try Ollama, then xAI Grok, then OpenAI, then static fallback.
 */
export const generateWithXAI = async (prompt) => {
  if (!env.xai.apiKey) throw new Error("xAI not configured");

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.xai.apiKey}`
    },
    body: JSON.stringify({
      model: env.xai.model,
      messages: [
        { role: "system", content: "You are a concise career coach. Follow output format exactly." },
        { role: "user", content: truncate(prompt, 12000) }
      ],
      temperature: 0.4,
      max_tokens: 900
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`xAI HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim() || "";
  if (!text) throw new Error("Empty xAI response");
  return { text, provider: "grok" };
};

export const generateText = async (prompt) => {
  try {
    return await generateWithOllama(prompt);
  } catch {
    try {
      return await generateWithXAI(prompt);
    } catch {
      try {
        return await generateWithOpenAI(prompt);
      } catch {
        return {
          text: "AI narrative unavailable. See structured scores and career matches below.",
          provider: "fallback"
        };
      }
    }
  }
};

export const evaluateWriting = async (questionStem, answerText) => {
  const prompt = `Evaluate this short written career-related response.

Question: ${truncate(questionStem, 500)}
Answer: ${truncate(answerText || "", 2000)}

Reply in JSON only, no markdown:
{"score":0-100,"feedback":"one or two sentences"}`;

  const raw = await generateText(prompt);
  try {
    const jsonMatch = raw.text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw.text);
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      feedback: String(parsed.feedback || "").slice(0, 500),
      provider: raw.provider
    };
  } catch {
    return {
      score: answerText?.trim() ? 50 : 0,
      feedback: "Could not auto-evaluate; keep practicing structured written communication.",
      provider: "fallback"
    };
  }
};
