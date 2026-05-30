import { readExcelSheet, col, soc } from "../excel.mjs";
import { logInfo } from "../logger.mjs";

/**
 * @returns {Map<string, number>}
 */
export const parseJobZones = (dir) => {
  const rows = readExcelSheet(dir, "Job Zones.xlsx");
  const map = new Map();
  if (!rows) return map;

  for (const row of rows) {
    const code = soc(row);
    const zone = Number(col(row, "Job Zone"));
    if (code && Number.isFinite(zone) && zone >= 1 && zone <= 5) {
      map.set(code, zone);
    }
  }
  logInfo(`parsed job zones: ${map.size}`);
  return map;
};
