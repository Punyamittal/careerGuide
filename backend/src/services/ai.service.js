import { env } from "../config/env.js";

const truncate = (text, max = 4000) => (text.length > max ? `${text.slice(0, max)}…` : text);

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

/** xAI Grok (primary AI provider). Retries known model aliases when env model is stale. */
export const generateWithXAI = async (prompt) => {
  if (!env.xai.apiKey) {
    throw new Error("XAI_API_KEY is not configured — set it in backend/.env");
  }

  const modelCandidates = [
    env.xai.model,
    "grok-3-mini",
    "grok-3-mini-latest",
    "grok-4-1-fast-reasoning"
  ].filter(Boolean);
  const models = [...new Set(modelCandidates)];

  let lastError = null;

  for (const model of models) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), env.xai.timeoutMs);

    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.xai.apiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
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
        const err = new Error(`xAI HTTP ${res.status}: ${errText}`);
        if (res.status === 400 && /model not found/i.test(errText) && model !== models.at(-1)) {
          lastError = err;
          continue;
        }
        throw err;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim() || "";
      if (!text) throw new Error("Empty xAI response");
      return { text, provider: "grok" };
    } catch (err) {
      lastError = err;
      if (model === models.at(-1)) throw err;
    } finally {
      clearTimeout(t);
    }
  }

  throw lastError ?? new Error("xAI request failed");
};

const staticFallback = {
  text:
    "The AI coach is not configured on this server (set XAI_API_KEY or OPENAI_API_KEY in backend/.env). " +
    "You can still use assessments, reports, and career matches while an admin enables the coach.",
  provider: "fallback"
};

function rulesEngineCoachReply(prompt) {
  const userLine = String(prompt).split("User message:").pop()?.trim() ?? prompt;
  const msg = userLine.slice(0, 500).toLowerCase();
  const careers = [];
  if (/software|engineer|code|program/.test(msg)) careers.push("software engineering");
  if (/data|analyst|numbers/.test(msg)) careers.push("data analysis");
  if (/design|creative|ux/.test(msg)) careers.push("UX or product design");
  if (/help|people|social|teach/.test(msg)) careers.push("people-focused roles");
  if (/logical|reason|problem/.test(msg)) careers.push("analytical STEM paths");
  if (!careers.length) careers.push("roles that match your strongest assessment signals");

  return (
    `Based on your question, explore ${careers.slice(0, 3).join(", ")}. ` +
    "Complete the CareerGUIDE assessments (aptitude, RIASEC, Big Five, motivation) so recommendations reflect your actual scores. " +
    "Strong logical reasoning often aligns with analytical STEM and research careers; pair technical depth with communication practice. " +
    "Review your latest report for top career matches and skill gaps, then pick one micro-project this week to test fit."
  );
}

function shouldUseRulesEngine(err) {
  const msg = String(err?.message ?? err);
  return (
    /403|credits|permission|model not found|429|502|503|504|abort/i.test(msg) ||
    /XAI_API_KEY is not configured/i.test(msg)
  );
}

/**
 * Grok first; optional OpenAI; rules-engine when providers unavailable; static fallback last resort.
 */
export const generateText = async (prompt) => {
  try {
    return await generateWithXAI(prompt);
  } catch (grokErr) {
    if (env.openai.apiKey) {
      try {
        return await generateWithOpenAI(prompt);
      } catch {
        /* try rules engine below */
      }
    }
    if (shouldUseRulesEngine(grokErr)) {
      return { text: rulesEngineCoachReply(prompt), provider: "rules-engine" };
    }
    return staticFallback;
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
