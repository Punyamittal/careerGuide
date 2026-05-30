import { inferElementDomain } from "../db.mjs";
import { ONET_INTEREST_TO_RIASEC } from "../constants.mjs";

/** Resolve export domain for ratings / elements. */
export const resolveExportDomain = (elementId, elementName = "", storedDomain = "") => {
  const id = String(elementId || "");
  if (storedDomain && storedDomain !== "other") return storedDomain;
  if (id.startsWith("1.D.") || id === "1.D") return "work_style";
  const inferred = inferElementDomain(elementId, elementName);
  if (inferred !== "other") return inferred;
  if (id.startsWith("1.B.2")) return "work_value";
  return storedDomain || "other";
};

export const hollandCodeForInterest = (elementName) => {
  const name = String(elementName || "").trim();
  return ONET_INTEREST_TO_RIASEC[name] ?? null;
};

export const normalizeTitle = (title) =>
  String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
