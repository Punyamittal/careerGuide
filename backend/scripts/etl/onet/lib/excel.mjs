import { readFileSync, existsSync } from "fs";
import { join } from "path";
import XLSX from "xlsx";

/**
 * @param {string} dir
 * @param {string} fileName
 * @returns {Record<string, unknown>[]}
 */
export const readExcelSheet = (dir, fileName) => {
  const path = join(dir, fileName);
  if (!existsSync(path)) {
    return null;
  }
  const buf = readFileSync(path);
  const wb = XLSX.read(buf, { type: "buffer", cellDates: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
};

export const fileExists = (dir, fileName) => existsSync(join(dir, fileName));

export const col = (row, ...names) => {
  for (const n of names) {
    if (row[n] !== undefined && row[n] !== null && row[n] !== "") return row[n];
  }
  return null;
};

export const soc = (row) => String(col(row, "O*NET-SOC Code", "O*NET-SOC Code ") ?? "").trim();

/**
 * Yield row chunks from an Excel file (file loaded once; chunks reduce insert buffer size).
 * @param {string} dir
 * @param {string} fileName
 * @param {number} chunkSize
 * @returns {AsyncGenerator<Record<string, unknown>[]>}
 */
export async function* iterateExcelChunks(dir, fileName, chunkSize = 2000) {
  const rows = readExcelSheet(dir, fileName);
  if (!rows) return;
  for (let i = 0; i < rows.length; i += chunkSize) {
    yield rows.slice(i, i + chunkSize);
  }
}
