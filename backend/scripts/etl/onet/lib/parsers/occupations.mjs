import { readExcelSheet, col, soc } from "../excel.mjs";
import { logInfo, logWarn } from "../logger.mjs";

/**
 * @param {string} dir
 * @param {string} releaseId
 */
export const parseOccupations = (dir, releaseId) => {
  const rows = readExcelSheet(dir, "Occupation Data.xlsx");
  if (!rows) {
    throw new Error("Missing required file: Occupation Data.xlsx");
  }

  const occupations = [];
  const seen = new Set();

  for (const row of rows) {
    const soc_code = soc(row);
    const title = String(col(row, "Title") ?? "").trim();
    if (!soc_code || !title) continue;
    if (seen.has(soc_code)) continue;
    seen.add(soc_code);
    occupations.push({
      release_id: releaseId,
      soc_code,
      title,
      description: col(row, "Description")
    });
  }

  logInfo(`parsed occupations: ${occupations.length}`);
  return { occupations, socSet: seen };
};
