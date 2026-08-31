import type { SchoolActionItem, SchoolEvent as DocumentEvent, SchoolFact, SchoolProvenance, SchoolSource, SchoolSourceIntelligence } from "@/core/contracts/SchoolIntelligence";

function provenance(source: SchoolSource, text: string, line: string): SchoolProvenance {
  return { sourceId: source.id, sourceVersion: source.version, locator: { startOffset: text.indexOf(line) }, excerpt: line, extractor: "deterministic", extractorVersion: 1 };
}

function makeFact(source: SchoolSource, text: string, kind: SchoolFact["kind"], value: string, line: string, index: number): SchoolFact {
  return { id: `${source.id}:fact:${index + 1}`, accountId: source.accountId, kind, subject: kind, value, certainty: "explicit", provenance: [provenance(source, text, line)], extractedAt: new Date().toISOString() };
}

function parseTime(value: string) {
  const military = /(?<![\d-])([01]\d|2[0-3])([0-5]\d)(?![\d-])/.exec(value);
  if (military) return `${military[1].padStart(2, "0")}:${military[2]}`;
  const clock = /\b(\d{1,2}):(\d{2})\s*(AM|PM)?\b/i.exec(value);
  if (!clock) return undefined;
  let hour = Number(clock[1]);
  if (clock[3]?.toUpperCase() === "PM" && hour < 12) hour += 12;
  if (clock[3]?.toUpperCase() === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${clock[2]}`;
}

function parseDocumentEvent(source: SchoolSource, text: string, line: string, index: number): DocumentEvent | null {
  const match = /\b(LLAB|PT|orientation|exam|meeting|briefing|training)\b/i.exec(line);
  if (!match) return null;
  const title = match[1].toUpperCase() === "PT" ? "PT" : match[1].toUpperCase() === "LLAB" ? "LLAB" : match[1].trim();
  const time = parseTime(line);
  const date = /\b(20\d{2}-\d{2}-\d{2})\b/.exec(line)?.[1];
  const locationMatch = /\b(?:at|in)\s+(?!\d)(?:the\s+)?([^.,;]+?)(?:\s+at\s+\d|\.|,|;|$)/i.exec(line);
  const attireMatch = /\b(?:wear|uniform\s*:)\s*([^.;]+?)(?:\s+and\s+bring|\.|;|$)/i.exec(line);
  const bringMatch = /\bbring\s+([^.;]+?)(?:\.|;|$)/i.exec(line);
  const ref = provenance(source, text, line);
  const startsAt = date && time ? new Date(`${date}T${time}:00Z`) : null;
  return { id: `${source.id}:event:${index + 1}`, accountId: source.accountId, title, ...(time ? { action: `Report at ${time}` } : {}), ...(startsAt && !Number.isNaN(startsAt.getTime()) ? { startsAt: startsAt.toISOString(), endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000).toISOString() } : {}), ...(locationMatch ? { location: { name: locationMatch[1].trim() } } : {}), ...(attireMatch ? { attire: { value: attireMatch[1].trim(), certainty: "explicit" as const } } : {}), ...(bringMatch ? { requiredItems: bringMatch[1].split(/\s+and\s+|,\s*/).map((item) => item.trim()).filter(Boolean) } : {}), factIds: [], provenance: [ref], certainty: "explicit", ...(title === "PT" ? { eventType: "pt" as const, category: "afrotc" as const } : title === "LLAB" ? { eventType: "llab" as const, category: "afrotc" as const } : {}) };
}

export function extractDocumentIntelligence(source: SchoolSource, text: string): SchoolSourceIntelligence {
  const facts: SchoolFact[] = [];
  const events: DocumentEvent[] = [];
  const actionItems: SchoolActionItem[] = [];
  const warnings: string[] = [];
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  for (const [index, line] of lines.entries()) {
    const labeled = /^(uniform|attire|required item|location|time|audience|requirement|deadline)\s*:\s*(.+)$/i.exec(line);
    if (labeled) facts.push(makeFact(source, text, labeled[1].toLowerCase().replace(" ", "-") as SchoolFact["kind"], labeled[2].trim(), line, facts.length));
    const event = parseDocumentEvent(source, text, line, index);
    if (event) events.push(event);
    const action = /^(?:action|to do|todo|required)\s*:\s*(.+)$/i.exec(line);
    if (action) actionItems.push({ id: `${source.id}:action:${actionItems.length + 1}`, accountId: source.accountId, title: action[1].trim(), status: "needs_review", factIds: [], provenance: [provenance(source, text, line)] });
  }
  if (/\b(?:TBD|TBA|not specified)\b/i.test(text)) warnings.push("Source contains an unspecified value; no value was inferred.");
  return { facts, events, actionItems, conflicts: [], warnings };
}
