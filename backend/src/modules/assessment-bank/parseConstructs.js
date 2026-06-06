/**
 * Parse archive `constructs_fed` pipe-delimited construct weights.
 * @param {string} raw
 */
export function parseConstructsFed(raw) {
  if (!raw || typeof raw !== "string") return {};

  const weights = {};
  for (const part of raw.split("|")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const weightMatch = trimmed.match(/\(w=([\d.]+)\)/);
    const weight = weightMatch ? Number(weightMatch[1]) : 1;
    const code = trimmed
      .replace(/\(w=[\d.]+\)/, "")
      .replace(/:.+$/, "")
      .trim()
      .toUpperCase();

    if (code) weights[code.toLowerCase().replace(/[^a-z0-9]+/g, "_")] = weight;
  }
  return weights;
}

/**
 * @param {string} nativeType
 */
export function inferLikertType(nativeType = "") {
  const t = nativeType.toLowerCase();
  if (t.includes("forced-choice") || t.includes("ipsative")) return "binary";
  if (t.includes("semantic") || t.includes("bipolar")) return "semantic_differential";
  if (t.includes("frequency") || t.includes("likert") || t.includes("1-5") || t.includes("1-7")) {
    return "frequency";
  }
  if (t.includes("sjt") || t.includes("mcq") || t.includes("4-option")) return "sjt_mcq";
  if (t.includes("matching") || t.includes("multi-select") || t.includes("ordering")) {
    return "interactive";
  }
  return "frequency";
}

/**
 * @param {string} nativeType
 */
export function defaultScaleLabels(nativeType = "") {
  const t = nativeType.toLowerCase();
  if (t.includes("frequency") || t.includes("never")) {
    return ["Never", "Rarely", "Sometimes", "Often", "Almost always"];
  }
  if (t.includes("strongly disagree")) {
    return ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];
  }
  return ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];
}
