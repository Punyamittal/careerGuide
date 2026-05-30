/**
 * Normalize one row from MBS_Master_Table.xlsx
 * @param {Record<string, unknown>} row
 */
export function normalizeMbsMasterRow(row) {
  const socCode = String(row["O*NET-SOC Code"] ?? row.soc_code ?? "").trim();
  const mbsDomainRaw = String(row.MBS_Domain ?? "").trim();
  const match = mbsDomainRaw.match(/^(MBS-\d+):\s*(.+)$/);
  const mbsCode = match?.[1] ?? mbsDomainRaw.split(":")[0]?.trim() ?? "";
  const mbsLabel = match?.[2]?.trim() ?? mbsDomainRaw;

  return {
    socCode,
    title: String(row.Title ?? "").trim(),
    description: String(row.Description ?? "").trim(),
    careerGroup: String(row.Career_Group ?? "").trim(),
    careerDomain: String(row.Career_Domain ?? "").trim(),
    mbsDomainId: mbsCode,
    mbsDomainLabel: mbsLabel,
    confidence: row.Confidence != null && row.Confidence !== "" ? Number(row.Confidence) : null,
    highlights: {
      coreTasks: row.Core_Tasks ?? null,
      technologySkills: row.Technology_Skills ?? null,
      alternateTitles: row.Alternate_Titles ?? null,
      jobZone: row.job_zone ?? row["Job Zone"] ?? null
    }
  };
}

/** @param {string} mbsDomainId @param {string} label @param {string} careerGroup @param {string} careerDomain */
export function domainKey(mbsDomainId, label, careerGroup, careerDomain) {
  return {
    id: mbsDomainId,
    code: mbsDomainId,
    label: label || careerDomain,
    career_group: careerGroup,
    career_domain: careerDomain
  };
}
