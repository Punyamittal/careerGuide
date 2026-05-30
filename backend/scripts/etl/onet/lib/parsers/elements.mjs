import { readExcelSheet, col } from "../excel.mjs";
import { inferElementDomain } from "../db.mjs";
import { logInfo } from "../logger.mjs";

/**
 * @returns {Map<string, object>}
 */
export const parseContentModelElements = (dir, releaseId) => {
  const rows = readExcelSheet(dir, "Content Model Reference.xlsx");
  const elementSet = new Map();
  if (!rows) return elementSet;

  for (const row of rows) {
    const element_id = String(col(row, "Element ID") ?? "").trim();
    const element_name = String(col(row, "Element Name") ?? "").trim();
    if (!element_id) continue;
    elementSet.set(element_id, {
      release_id: releaseId,
      element_id,
      element_name: element_name || element_id,
      domain: inferElementDomain(element_id, element_name),
      description: col(row, "Description")
    });
  }
  logInfo(`parsed content model elements: ${elementSet.size}`);
  return elementSet;
};

export const ensureElement = (elementSet, releaseId, elementId, elementName, domain) => {
  if (!elementId) return;
  if (!elementSet.has(elementId)) {
    elementSet.set(elementId, {
      release_id: releaseId,
      element_id: elementId,
      element_name: elementName || elementId,
      domain: domain || inferElementDomain(elementId, elementName),
      description: null
    });
  }
};
