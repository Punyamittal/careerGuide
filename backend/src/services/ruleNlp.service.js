/**
 * Lightweight rule-based text tags (no external NLP API) for portfolio / alerts.
 * @param {string} text
 * @returns {string[]}
 */
export function tagWritingWithRules(text) {
  const t = String(text || "").toLowerCase();
  if (!t.trim()) return [];
  const tags = [];
  const rules = [
    { tag: "focus_concern", re: /\b(hard to focus|distract|attention|bored|can't sit)\b/i },
    { tag: "social_shy", re: /\b(shy|quiet|alone|nervous|don't like groups)\b/i },
    { tag: "achievement_drive", re: /\b(win|score|rank|best|compete|goal)\b/i },
    { tag: "collaboration", re: /\b(team|friends|together|group|help others)\b/i },
    { tag: "creative_exploration", re: /\b(create|imagine|story|draw|new idea|experiment)\b/i },
    { tag: "structure_preference", re: /\b(plan|steps|order|rules|checklist|routine)\b/i }
  ];
  for (const { tag, re } of rules) {
    if (re.test(t)) tags.push(tag);
  }
  return [...new Set(tags)];
}

/**
 * Reward points for engagement — rule-based, deterministic.
 * @param {{ category: string, likertValue?: number, selectedOptionKey?: string }} response
 * @param {{ category: string }} question
 */
export function computeStepReward(response, question) {
  let pts = 5;
  if (question.category === "writing" && String(response.writingText || "").trim().length > 120) pts += 10;
  if (response.likertValue != null) pts += 2;
  if (response.selectedOptionKey) pts += 3;
  return pts;
}
