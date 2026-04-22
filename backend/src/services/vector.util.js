import { PROFILE_VECTOR_KEYS } from "../constants/assessment.js";

export const normalizeL2 = (arr) => {
  const norm = Math.sqrt(arr.reduce((s, x) => s + x * x, 0)) || 1;
  return arr.map((x) => x / norm);
};

export const cosineSimilarity = (a, b) => {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
};

export const mapToVectorArray = (mapOrObj) => {
  const obj =
    mapOrObj instanceof Map ? Object.fromEntries(mapOrObj) : { ...mapOrObj };
  return PROFILE_VECTOR_KEYS.map((k) => Number(obj[k]) || 0);
};

export const scoresToProfileObject = (scores) => {
  const apt = scores.aptitude || {};
  const bf = scores.personality?.bigFive;
  const ria = scores.personality?.riasec;
  const mot = scores.motivation || {};

  const bfObj = bf instanceof Map ? Object.fromEntries(bf) : bf || {};
  const riaObj = ria instanceof Map ? Object.fromEntries(ria) : ria || {};

  const out = {};
  out.apt_logical = (apt.logical ?? 0) / 100;
  out.apt_numerical = (apt.numerical ?? 0) / 100;
  out.apt_verbal = (apt.verbal ?? 0) / 100;
  for (const k of ["O", "C", "E", "A", "N"]) {
    out[`bf_${k}`] = (bfObj[k] ?? 0) / 100;
  }
  for (const k of ["R", "I", "A", "S", "E", "C"]) {
    out[`ria_${k}`] = (riaObj[k] ?? 0) / 100;
  }
  for (const k of ["people", "data", "ideas", "things"]) {
    out[`mot_${k}`] = (mot[k] ?? 0) / 100;
  }
  return out;
};
