import { normalizeSourceText } from "@/services/school/sources/normalizeText";
import type { OpordDeadline, OpordDocument, OpordEvent, OpordField } from "./types";

const DAYS = "SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY";
const MONTHS: Record<string, number> = { JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4, MAY: 5, JUNE: 6, JULY: 7, AUGUST: 8, SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12, JAN: 1, FEB: 2, MAR: 3, APR: 4, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
const TIME = "(?:[01]\\d|2[0-3])(?::?[0-5]\\d)";

function unknown<T>(): OpordField<T> { return { status: "unknown", value: null }; }
function explicit<T>(value: T, excerpt?: string): OpordField<T> { return { status: "explicit", value, ...(excerpt ? { excerpt } : {}) }; }
function field<T>(values: string[], excerpt?: string): OpordField<T> {
  const unique = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  if (unique.length === 0) return unknown<T>();
  if (unique.length === 1) return explicit(unique[0] as T, excerpt);
  return { status: "conflicting", values: unique as T[], ...(excerpt ? { excerpt } : {}) };
}

function parseDate(value: string, contextYear: number | null): string | null {
  const compact = value.toUpperCase().replace(/\s+/g, "");
  let match: string[] | null = /^(\d{1,2})([A-Z]{3,9})(\d{2,4})$/.exec(compact);
  if (!match) {
    const spaced = /^(\d{1,2})\s+([A-Z]{3,9})\s+(\d{2,4})$/i.exec(value.trim());
    if (spaced) match = spaced;
  }
  if (!match) {
    const written = /^(?:[A-Z]+,?\s+)?([A-Z]+)\s+(\d{1,2}),?\s+(\d{4})$/i.exec(value.trim());
    if (written) match = [written[0], written[2], written[1], written[3]];
  }
  if (!match) {
    const noYear = /^(\d{1,2})([A-Z]{3,9})$/i.exec(compact);
    if (!noYear || !contextYear) return null;
    match = [noYear[0], noYear[1], noYear[2], String(contextYear)];
  }
  if (!match) return null;
  const day = Number(match[1]); const month = MONTHS[match[2].toUpperCase()];
  let year = Number(match[3]); if (year < 100) year += 2000;
  if (!month || !Number.isInteger(day) || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}` : null;
}

function findDate(line: string, year: number | null): string | null {
  const candidates = line.match(/\b\d{1,2}\s*[A-Z]{3,9}\s*\d{0,4}\b|\b[A-Z]+\s+\d{1,2},?\s+\d{4}\b/gi) ?? [];
  for (const candidate of candidates) { const parsed = parseDate(candidate, year); if (parsed) return parsed; }
  return null;
}

function formatTime(value: string): string { const digits = value.replace(":", ""); return `${digits.slice(0, 2)}:${digits.slice(2)}`; }
function valuesFor(lines: string[], pattern: RegExp): { values: string[]; excerpts: string[] } { const values: string[] = []; const excerpts: string[] = []; for (const line of lines) { const match = pattern.exec(line); if (match?.[1]) { values.push(match[1].trim().replace(/[.;]+$/, "")); excerpts.push(line); } } return { values, excerpts }; }

function parseTimeField(lines: string[], pattern: RegExp): OpordField<string> {
  const values: string[] = []; const excerpts: string[] = [];
  for (const line of lines) { const match = pattern.exec(line); if (match?.[1]) { values.push(formatTime(match[1])); excerpts.push(line); } }
  return field<string>(values, excerpts[0]);
}

function parseDeadline(line: string): OpordDeadline | null {
  const match = /^(?:deadline\s*:\s*)?(.+?)\s+\b(NLT|NET)\b\s*((?:[01]\d|2[0-3])(?::?[0-5]\d)?)(?:\s+(.+))?$/i.exec(line.trim());
  if (!match) return null;
  return { action: match[1].trim(), qualifier: match[2].toUpperCase() as "NLT" | "NET", time: match[3] ? formatTime(match[3]) : null, raw: line.trim() };
}

function splitItems(value: string): string[] { return value.split(/\s*(?:,|;|\band\b)\s*/i).map((item) => item.trim()).filter(Boolean); }

function eventHeader(line: string, contextYear: number | null): { title: string; date: string | null } | null {
  const match = new RegExp(`^(${DAYS})(?:\\s+(${"\\d{1,2}\\s*[A-Z]{3,9}\\s*\\d{0,4}"}|${"[A-Z]+\\s+\\d{1,2},?\\s+\\d{4}"}))?(?:\\s*[-–—:]\\s*|\\s+)(.+)$`, "i").exec(line.trim());
  if (!match) return null;
  return { title: match[3].trim(), date: match[2] ? parseDate(match[2], contextYear) : null };
}

export function parseAfrotcOpord(input: { text: string; sourceId: string; sourceName: string }): OpordDocument {
  const text = normalizeSourceText(input.text); const lines = text.split("\n");
  const years = [...text.matchAll(/\b(20\d{2})\b/g)].map((m) => Number(m[1])); const contextYear = years.length === 1 ? years[0] : null;
  const metadata = (pattern: RegExp) => valuesFor(lines, pattern);
  const opordNumber = metadata(/^\s*(?:opord|operation order)\s*(?:number|no\.?|#)?\s*[:\-]?\s*([A-Z0-9 .\-/]+)$/i);
  const title = metadata(/^\s*(?:title|operation name|subject)\s*[:\-]\s*(.+)$/i);
  const organization = metadata(/^\s*(?:organization|unit|detachment)\s*[:\-]\s*(.+)$/i);
  const effective = metadata(/^\s*effective date\s*[:\-]\s*(.+)$/i); const publication = metadata(/^\s*publication date\s*[:\-]\s*(.+)$/i);
  const purpose = metadata(/^\s*purpose\s*[:\-]\s*(.+)$/i);
  const document: OpordDocument = { documentKind: "afrotc_opord", sourceId: input.sourceId, sourceName: input.sourceName, opordNumber: field(opordNumber.values), title: field(title.values), organization: field(organization.values), effectiveDate: field(effective.values.map((value) => findDate(value, contextYear) ?? value)), publicationDate: field(publication.values.map((value) => findDate(value, contextYear) ?? value)), eventDateRange: unknown(), purpose: field(purpose.values), events: [], parsedAt: new Date().toISOString() };
  const blocks: { header: { title: string; date: string | null }; lines: string[] }[] = []; let current: { header: { title: string; date: string | null }; lines: string[] } | null = null;
  for (const line of lines) { const header = eventHeader(line, contextYear); if (header) { if (current) blocks.push(current); current = { header, lines: [] }; } else if (current) current.lines.push(line); }
  if (current) blocks.push(current);
  const events: OpordEvent[] = blocks.map((block, index) => {
    const blockText = block.lines.join(" "); const allLines = [block.header.title, ...block.lines];
    const date = block.header.date ?? findDate(blockText, contextYear); const uniforms = valuesFor(block.lines, /^(?:uniform|uod|uniform of the day)\s*[:\-]\s*(.+)$/i);
    const locations = valuesFor(block.lines, /^(?:location|loc|meet at)\s*[:\-]?\s*(.+)$/i);
    const bring: string[] = []; const instructions: string[] = []; const deadlines: OpordDeadline[] = [];
    for (const line of block.lines) {
      const bringMatch = /^(?:bring|required equipment|equipment|required items)\s*[:\-]\s*(.+)$/i.exec(line); if (bringMatch) bring.push(...splitItems(bringMatch[1]));
      const deadline = parseDeadline(line); if (deadline) deadlines.push(deadline);
      if (/^(?:instruction|instructions)\s*[:\-]/i.test(line) || /\b(?:do not|don't|must|arrive|park|report to|remain)\b/i.test(line)) instructions.push(line.trim());
    }
    const report = parseTimeField(block.lines, new RegExp(`(?:report|show time|reporting|cadets report)[^0-9]*(?:NLT|NET)?\\s*(${TIME})`, "i"));
    const reportQualifier = field<"NLT" | "NET" | "unspecified">((block.lines.join(" ").match(/(?:report|show time|reporting)[^\n]{0,30}\b(NLT|NET)\b/i)?.[1] ? [block.lines.join(" ").match(/(?:report|show time|reporting)[^\n]{0,30}\b(NLT|NET)\b/i)![1].toUpperCase()] : report.status === "explicit" ? ["unspecified"] : []));
    const start = parseTimeField(block.lines, new RegExp(`(?:formation begins|event begins|begins|starts|start time|start)[^0-9]*(${TIME})`, "i"));
    const end = parseTimeField(block.lines, new RegExp(`(?:ends|end time|until)[^0-9]*(${TIME})`, "i"));
    const cancelled = /\b(?:cancelled|canceled)\b/i.test(`${block.header.title} ${blockText}`);
    return { id: `event-${index + 1}`, title: block.header.title.replace(/\s*[-–—:]\s*(?:cancelled|canceled).*$/i, "").trim(), date: date ? explicit(date, block.lines.find((line) => findDate(line, contextYear) === date)) : unknown(), reportTime: report, reportQualifier, startTime: start, endTime: end, location: field(locations.values, locations.excerpts[0]), uniform: field(uniforms.values, uniforms.excerpts[0]), bring: [...new Set(bring)], instructions: [...new Set(instructions)], deadlines, status: cancelled ? "cancelled" : "scheduled", sourceId: input.sourceId, sourceName: input.sourceName, provenance: { sourceName: input.sourceName, excerpt: allLines.join(" ").slice(0, 600) } };
  });
  document.events = events; const dates = events.map((event) => event.date.status === "explicit" ? event.date.value : null).filter(Boolean) as string[]; if (dates.length) document.eventDateRange = explicit(dates.length === 1 ? dates[0] : `${dates.sort()[0]} to ${dates.sort().at(-1)}`);
  return document;
}
