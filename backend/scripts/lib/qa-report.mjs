/**
 * Markdown report generator for realtime QA verification.
 */

/**
 * @param {import("./qa-helpers.mjs").QaCheck[]} checks
 * @param {Record<string, unknown>} sections
 */
export function buildMarkdownReport(checks, sections) {
  const summary = sections.summary ?? {};
  const ts = sections.generatedAt ?? new Date().toISOString();
  const verdict = sections.verdict ?? "FAIL – Not Production Ready";
  const critical = checks.filter((c) => c.status === "FAIL" && c.meta?.critical !== false);

  const lines = [];
  lines.push("# CareerGUIDE Realtime QA Report");
  lines.push("");
  lines.push(`Generated: ${ts}`);
  lines.push(`Backend: ${sections.backendUrl ?? "n/a"}`);
  lines.push(`Production frontend: ${sections.productionUrl ?? "n/a"}`);
  if (sections.authEmail) lines.push(`Test account: ${sections.authEmail}`);
  lines.push("");

  lines.push("## Executive Summary");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| PASS | ${summary.passPct ?? 0}% (${summary.pass ?? 0}/${summary.total ?? 0}) |`);
  lines.push(`| FAIL | ${summary.failPct ?? 0}% (${summary.fail ?? 0}/${summary.total ?? 0}) |`);
  lines.push(`| BLOCKED | ${summary.blockedPct ?? 0}% (${summary.blocked ?? 0}/${summary.total ?? 0}) |`);
  lines.push("");
  lines.push(`**Final Verdict:** ${verdict}`);
  lines.push("");

  lines.push("## Critical Issues");
  lines.push("");
  if (!critical.length) {
    lines.push("_No critical failures recorded via live execution._");
  } else {
    lines.push("| Severity | Area | Issue | Evidence |");
    lines.push("|----------|------|-------|----------|");
    for (const c of critical) {
      const sev = c.meta?.severity ?? (c.meta?.critical === false ? "Medium" : "High");
      lines.push(`| ${sev} | ${c.area} | ${c.name} | ${escapeCell(c.evidence)} |`);
    }
  }
  lines.push("");

  appendSection(lines, "Assessment Results", sections.assessments);
  appendSection(lines, "User Flow Results", sections.userFlows);
  appendSection(lines, "MBS Results", sections.mbsModules);
  appendSection(lines, "Clarification Results", sections.clarification);
  appendSection(lines, "Negotiation Results", sections.negotiation);
  appendSection(lines, "AI Results", sections.ai);
  appendSection(lines, "Reports & Dashboard", sections.reportsDashboard);
  appendSection(lines, "Deployment Results", sections.deployment);

  lines.push("## Final Verdict");
  lines.push("");
  lines.push(verdict);
  lines.push("");
  lines.push("---");
  lines.push("_Evidence collected through live HTTP/DB execution only._");

  return lines.join("\n");
}

function appendSection(lines, title, data) {
  lines.push(`## ${title}`);
  lines.push("");
  if (!data) {
    lines.push("_Not executed._");
    lines.push("");
    return;
  }
  if (typeof data === "string") {
    lines.push(data);
    lines.push("");
    return;
  }
  lines.push("```json");
  lines.push(JSON.stringify(data, null, 2));
  lines.push("```");
  lines.push("");
}

function escapeCell(s) {
  return String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ").slice(0, 240);
}

/**
 * @param {{ pass: number; fail: number; blocked: number; total: number }} summary
 */
export function computeVerdict(summary, criticalFailCount) {
  if (summary.fail > 0 && criticalFailCount > 0) {
    if (summary.passPct >= 85 && criticalFailCount <= 2) return "PASS WITH KNOWN LIMITATIONS";
    if (summary.passPct >= 70) return "PASS WITH MINOR ISSUES";
    return "FAIL – Not Production Ready";
  }
  if (summary.blocked > 0 && summary.fail === 0) {
    if (summary.passPct >= 90) return "PASS WITH KNOWN LIMITATIONS";
    return "PASS WITH MINOR ISSUES";
  }
  if (summary.fail > 0) return "PASS WITH MINOR ISSUES";
  return "PASS – Production Ready";
}
