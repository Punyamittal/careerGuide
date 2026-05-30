import { writeFileSync } from "fs";

const escape = (v) => {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

/**
 * @param {string} filePath
 * @param {string[]} columns
 * @param {Record<string, unknown>[]} rows
 */
export const writeCsv = (filePath, columns, rows) => {
  const header = columns.join(",");
  const lines = rows.map((row) => columns.map((c) => escape(row[c])).join(","));
  writeFileSync(filePath, [header, ...lines].join("\n"), "utf8");
};
