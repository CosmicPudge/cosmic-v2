import type { SchoolFact, SchoolFactKind, SchoolProvenance, SchoolSource } from "@/core/contracts/SchoolIntelligence";

export interface SchoolExtractionResult {
  facts: SchoolFact[];
  warnings: string[];
  requiresValidation: boolean;
}

function factId(sourceId: string, index: number) { return `${sourceId}:fact:${index + 1}`; }

/** Deterministic foundation: only records explicit text, never guesses missing values. */
export function extractExplicitSchoolFacts(source: SchoolSource, text: string, now = new Date()): SchoolExtractionResult {
  const facts: SchoolFact[] = [];
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  lines.forEach((line) => {
    const match = /^(course|assignment|deadline|requirement|location|time|timezone|attire|uniform|required item|audience|contact)\s*:\s*(.+)$/i.exec(line);
    if (!match) return;
    const kind = match[1].toLowerCase().replace(/\s+/g, "-") as SchoolFactKind;
    const value = match[2].trim();
    const provenance: SchoolProvenance = { sourceId: source.id, sourceVersion: source.version, locator: { startOffset: text.indexOf(line) }, excerpt: line };
    facts.push({ id: factId(source.id, facts.length), accountId: source.accountId, kind, subject: kind, value, certainty: "explicit", provenance: [provenance], extractedAt: now.toISOString() });
  });
  if (/\bTBD\b|\bTBA\b|not specified/i.test(text)) {
    warnings.push("Source contains an unspecified value; no value was inferred.");
  }
  return { facts, warnings, requiresValidation: warnings.length > 0 };
}

export function createSchoolSource(input: Omit<SchoolSource, "version" | "status">): SchoolSource {
  return { ...input, version: 1, status: "pending" };
}
