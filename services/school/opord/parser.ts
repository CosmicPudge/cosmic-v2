import { normalizeSourceText } from "@/services/school/sources/normalizeText";
import type { SourceTextLayoutItem } from "@/services/school/sources/extractText";
import type { OpordDeadline, OpordDocument, OpordEvent, OpordField, PfraRelevance, PtExercise, PtWorkout, PtWorkoutBlock } from "./types";

const DAYS = "SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY";
const MONTHS: Record<string, number> = { JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4, MAY: 5, JUNE: 6, JULY: 7, AUGUST: 8, SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12, JAN: 1, FEB: 2, MAR: 3, APR: 4, JUN: 6, JUL: 7, AUG: 8, SEP: 9, SEPT: 9, OCT: 10, NOV: 11, DEC: 12 };
const TIME = "(?:[01]\\d|2[0-3])(?::?[0-5]\\d)";
export const OPORD_PARSER_VERSION = "v4-real-extraction";

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

const LABELS = ["situation", "date/time", "form-up location", "required items", "uod", "schedule"] as const;
function normalizeOpordLines(text: string): string[] {
  const raw = text.split("\n").map((line) => line.replace(/^\s*[A-Z]\.\s*/, "").trim()).filter(Boolean); const lines: string[] = [];
  for (let index = 0; index < raw.length; index += 1) {
    const line = raw[index]; const next = raw[index + 1] ?? ""; const nextNext = raw[index + 2] ?? "";
    if (/^date\/tim(?:\s+(.+))?$/i.test(line) && /^e$/i.test(next)) { const value = line.replace(/^date\/tim\s*/i, "").trim(); lines.push(value ? `Date/Time ${value}` : "Date/Time"); index += 1; continue; }
    if (/^form-?$/i.test(line) && /^up\b/i.test(next) && /^location$/i.test(nextNext)) { lines.push(`Form-Up Location${next.replace(/^up/i, "").trim() ? ` ${next.replace(/^up/i, "").trim()}` : ""}`); index += 2; continue; }
    if (/^required$/i.test(line) && !/^items$/i.test(next) && /^items$/i.test(nextNext)) { lines.push(`Required Items ${next}`); index += 2; continue; }
    if (/^required\s+(.+)$/i.test(line) && /^items$/i.test(next)) { lines.push(`Required Items ${line.replace(/^required\s+/i, "")}`); index += 1; continue; }
    if (/^required$/i.test(line) && /^items$/i.test(next)) { lines.push("Required Items"); index += 1; continue; }
    lines.push(line);
  }
  return lines;
}
function labelPattern(label: string) { return new RegExp(`^\\s*${label.replace(/[ -]/g, "[ -]")}\\s*[:\\-]?\\s*(.*)$`, "i"); }
function tableValues(lines: string[], label: string): { values: string[]; excerpts: string[] } {
  const values: string[] = []; const excerpts: string[] = []; const pattern = labelPattern(label);
  for (let index = 0; index < lines.length; index += 1) {
    const match = pattern.exec(lines[index]); if (!match) continue;
    const inline = match[1].trim();
    if (inline && !LABELS.some((candidate) => labelPattern(candidate).test(inline))) { values.push(inline); excerpts.push(lines[index]); continue; }
    for (let next = index + 1; next < Math.min(lines.length, index + 10); next += 1) {
      const candidate = lines[next].trim(); if (!candidate) continue;
      if (LABELS.some((known) => labelPattern(known).test(candidate))) break;
      values.push(candidate); excerpts.push(`${lines[index]} ${candidate}`); if (label !== "uod" && label !== "schedule") break;
    }
  }
  return { values, excerpts };
}
function firstTableValue(lines: string[], label: string) { return tableValues(lines, label).values[0] ?? null; }

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

function splitItems(value: string): string[] { return value.split(/\s*(?:,|;|\/|\band\b)\s*/i).map((item) => item.trim()).filter(Boolean); }

function relevance(name: string): PfraRelevance {
  if (/sit[- ]?ups?/i.test(name)) return "direct-pfra";
  if (/\brun(?:ning)?\b|\b(?:mile|lap)s?\b/i.test(name)) return "direct-pfra";
  if (/push[- ]?ups?/i.test(name)) return "supporting";
  if (/squat|lunge|plank|bicycl|twist|leg raise|glute|wall sit|stretch/i.test(name)) return "supporting";
  return "other";
}

function exercise(name: string, source: string, details: Partial<PtExercise> = {}): PtExercise { return { name: name.trim(), relevance: relevance(name), source, ...details }; }

function attachmentWorkouts(lines: string[]): Map<string, PtWorkout[]> {
  const attachmentIndex = lines.findIndex((line) => /^attachment\s*4\b.*physical training plan/i.test(line));
  if (attachmentIndex < 0) return new Map();
  const result = new Map<string, PtWorkout[]>(); let day: string | null = null; let page: number | undefined; let current: PtWorkout | null = null; let block: PtWorkoutBlock | null = null;
  const finish = () => { if (day && current) { const list = result.get(day) ?? []; list.push(current); result.set(day, list); } current = null; block = null; };
  for (const raw of lines.slice(attachmentIndex)) {
    const pageMatch = /^---\s*PAGE\s+(\d+)\s*---$/i.exec(raw.trim()); if (pageMatch) { page = Number(pageMatch[1]); continue; }
    const dayMatch = /^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\s*:?\s*(.*)$/i.exec(raw.trim());
    if (dayMatch) { finish(); day = dayMatch[1].toUpperCase(); const heading = dayMatch[2].trim(); current = { title: heading || "Physical Training Plan", blocks: [], notes: [], source: "Attachment 4", ...(page ? { sourcePage: page } : {}) }; continue; }
    if (!day || !current) continue;
    const clean = raw.replace(/^[-•*]\s*/, "").trim(); if (!clean || /^attachment\s*\d+/i.test(clean)) continue;
    const titleMatch = /^(running seminar|slow repetitions workout|343 mentor workout)\b(?:\s*[-–—:]\s*(.*))?/i.exec(clean);
    if (titleMatch) { current.title = titleMatch[1].replace(/\b\w/g, (char) => char.toUpperCase()); if (titleMatch[2]) current.notes.push(titleMatch[2].trim()); continue; }
    const audience = /(?:first[- ]time participants?|AS100s?|AS250s?)/i.test(clean) ? clean : undefined;
    if (audience && !current.audience) { current.audience = audience; continue; }
    const total = /\b(\d{2,4})\s+total\s+repetitions?/i.exec(clean); if (total) { current.totalRepetitions = Number(total[1]); continue; }
    if (/^(upper body|core|lower body|running|warm[- ]up|cooldown)\s*:?(?:\s*)$/i.test(clean)) { const category = clean.replace(/:$/, ""); block = { category, exercises: [], running: [] }; current.blocks.push(block); continue; }
    const run = /^(?:run|running)\s+(.+)$/i.exec(clean); if (run) { const item = exercise("Run", "Attachment 4", { distance: run[1].trim(), ...(page ? { sourcePage: page } : {}) }); (block?.running ?? (current.blocks[0] ?? (current.blocks.push({ category: "Running", exercises: [], running: [] }), current.blocks[0])).running).push(item); continue; }
    const hydrate = /^(hydrate|hydration)\s+(\d+)\s*(?:minute|min)/i.exec(clean); if (hydrate) { (block?.exercises ?? (current.blocks[0] ?? (current.blocks.push({ category: "Workout", exercises: [], running: [] }), current.blocks[0])).exercises).push(exercise("Hydrate", "Attachment 4", { durationMinutes: Number(hydrate[2]), ...(page ? { sourcePage: page } : {}) })); continue; }
    const reps = /^(\d+)\s+(.+?)(?:\s+(?:reps?|repetitions?))?$/i.exec(clean); if (reps && !/^\d{2}:?\d{2}/.test(clean)) { const target = block ?? (current.blocks[0] ?? (current.blocks.push({ category: "Workout", exercises: [], running: [] }), current.blocks[0])); target.exercises.push(exercise(reps[2], "Attachment 4", { reps: Number(reps[1]), ...(page ? { sourcePage: page } : {}) })); continue; }
    if (/^(?:regular|diamond|wide grip|pike) push-ups?|pull-ups?|sit-ups?|plank|american twists?|bicycles?|squats?|wall sits?|lunges?|glute bridges?|jump squats?$/i.test(clean)) { const target = block ?? (current.blocks[0] ?? (current.blocks.push({ category: "Workout", exercises: [], running: [] }), current.blocks[0])); target.exercises.push(exercise(clean, "Attachment 4", page ? { sourcePage: page } : {})); continue; }
    if (/\b(?:repeat|rotation|choice|option|warm up|stretch)\b/i.test(clean)) current.notes.push(clean);
  }
  finish(); return result;
}

function eventHeader(line: string, contextYear: number | null): { title: string; date: string | null } | null {
  const match = new RegExp(`^(${DAYS})(?:\\s+(${"\\d{1,2}\\s*[A-Z]{3,9}\\s*\\d{0,4}"}|${"[A-Z]+\\s+\\d{1,2},?\\s+\\d{4}"}))?(?:\\s*[-–—:]\\s*|\\s+)(.+)$`, "i").exec(line.trim());
  if (!match) return null;
  const title = match[3].trim(); if (!/leadership\s+laboratory|\bLLAB\b|physical\s+training|\bPT\b/i.test(title)) return null;
  return { title, date: match[2] ? parseDate(match[2], contextYear) : null };
}

function numberedEventHeader(line: string, contextYear: number | null): { title: string; date: string | null } | null {
  const match = /^\d+\s*(?:-\s*\d+)?[.)]\s+(.+)$/.exec(line.trim());
  if (!match || /^(?:purpose|situation|mission|execution|administration|command|control|references?)\b/i.test(match[1]) || !/leadership\s+laboratory|\bLLAB\b|physical\s+training|\bPT\b/i.test(match[1])) return null;
  return { title: match[1].trim(), date: findDate(match[1], contextYear) };
}
function nonEventSection(line: string) { return /^(?:\d+\s*(?:-\s*\d+)?[.)]\s+)?(?:operational risk management|orm|catastrophic event plan|emergency cadet procedures|approval|attachments?|flight locations|emergency rally points|maps?|weather mitigation|risk controls)\b/i.test(line.trim()); }
function typeIsLlAb(title: string) { return /leadership\s+laboratory|\bLLAB\b/i.test(title); }
function weekMetadata(text: string, sourceName: string): { weekNumber?: number; weekLabel?: string } {
  const match = /\bweek[\s_-]*(\d{1,2})\b/i.exec(text) ?? /\bweek[\s_-]*(\d{1,2})\b/i.exec(sourceName);
  if (!match) return {};
  const weekNumber = Number(match[1]);
  return Number.isInteger(weekNumber) ? { weekNumber, weekLabel: `Week ${String(weekNumber).padStart(2, "0")}` } : {};
}

function positionalUodRequirements(layout: SourceTextLayoutItem[] | undefined, page: number | undefined): { audience: string; uniform: string; excerpt?: string }[] {
  if (!layout || page === undefined) return [];
  const items = layout.filter((item) => item.page === page && item.text.trim()).sort((a, b) => b.y - a.y || a.x - b.x);
  const headers = items.filter((item) => /^(?:first\s+term\s+cadets?|gmc|poc)$/i.test(item.text.trim()));
  if (headers.length < 2) return [];
  const normalizedHeaders = headers.map((item) => ({ audience: /^first/i.test(item.text.trim()) ? "First Term Cadets" : item.text.trim().toUpperCase(), x: item.x, y: item.y })).filter((item, index, all) => all.findIndex((candidate) => candidate.audience === item.audience) === index);
  if (normalizedHeaders.length < 2) return [];
  const headerY = Math.max(...normalizedHeaders.map((item) => item.y));
  const stopY = items.filter((item) => item.y < headerY && /^(?:schedule|situation|date\/time|form[- ]?up|required(?:\s+items)?)$/i.test(item.text.trim())).map((item) => item.y).sort((a, b) => b - a)[0] ?? -Infinity;
  const bodyItems = items.filter((item) => item.y < headerY && item.y > stopY && !headers.includes(item));
  return normalizedHeaders.map((header) => {
    const values = bodyItems.filter((item) => normalizedHeaders.reduce((nearest, candidate) => Math.abs(candidate.x - item.x) < Math.abs(nearest.x - item.x) ? candidate : nearest, normalizedHeaders[0]).audience === header.audience).sort((a, b) => b.y - a.y || a.x - b.x).map((item) => item.text.trim()).filter((value) => !/^(?:[A-H]\.?)?$|^(?:uod|uniform)$/i.test(value)).filter(Boolean);
    return { audience: header.audience, uniform: values.join(" ").replace(/\s+([).,])/g, "$1").trim(), excerpt: values.join(" ") };
  }).filter((item) => item.uniform.length > 0);
}

export function parseAfrotcOpord(input: { text: string; sourceId: string; sourceName: string; layout?: SourceTextLayoutItem[] }): OpordDocument {
  const text = normalizeSourceText(input.text); const lines = normalizeOpordLines(text);
  const years = [...text.matchAll(/\b(20\d{2})\b/g)].map((m) => Number(m[1])); const contextYear = years.length === 1 ? years[0] : null;
  const metadata = (pattern: RegExp) => valuesFor(lines, pattern);
  const opordNumber = metadata(/^\s*(?:opord|operation order)\s*(?:number|no\.?|#)?\s*[:\-]?\s*([A-Z0-9 .\-/]+)$/i);
  const title = metadata(/^\s*(?:title|operation name|subject)\s*[:\-]\s*(.+)$/i);
  const organization = metadata(/^\s*(?:organization|unit|detachment)\s*[:\-]\s*(.+)$/i);
  const effective = metadata(/^\s*effective date\s*[:\-]\s*(.+)$/i); const publication = metadata(/^\s*publication date\s*[:\-]\s*(.+)$/i);
  const purpose = metadata(/^\s*purpose\s*[:\-]\s*(.+)$/i);
  const inferredTitle = title.values.length ? title.values : lines.filter((line) => /^week\s+\d+\b.*\bopord\b/i.test(line)); const inferredOrganization = organization.values.length ? organization.values : lines.filter((line) => /^air force rotc detachment\s+\d+$/i.test(line)); const inferredEffective = effective.values.length ? effective.values : lines.flatMap((line) => /^cao\s*[:\-]\s*(.+)$/i.exec(line)?.[1] ? [line.replace(/^cao\s*[:\-]\s*/i, "")] : []); const inferredPurpose = purpose.values.length ? purpose.values : lines.filter((line) => /mandatory standard practical military training/i.test(line));
  const document: OpordDocument = { documentKind: "afrotc_opord", sourceId: input.sourceId, sourceName: input.sourceName, opordNumber: field(opordNumber.values), title: field(inferredTitle), organization: field(inferredOrganization), effectiveDate: field(inferredEffective.map((value) => findDate(value, contextYear) ?? value)), publicationDate: field(publication.values.map((value) => findDate(value, contextYear) ?? value)), eventDateRange: unknown(), purpose: field(inferredPurpose), events: [], parsedAt: new Date().toISOString(), ...weekMetadata(text, input.sourceName) };
  const tocPages = new Set<number>(); let scanPage: number | undefined;
  for (const line of lines) { const page = /^---\s*PAGE\s+(\d+)\s*---$/i.exec(line); if (page) scanPage = Number(page[1]); if (/contents\s+description\s+page/i.test(line) && scanPage !== undefined) tocPages.add(scanPage); }
  let attachmentIndex = -1; scanPage = undefined;
  for (let index = 0; index < lines.length; index += 1) {
    const page = /^---\s*PAGE\s+(\d+)\s*---$/i.exec(lines[index]);
    if (page) scanPage = Number(page[1]);
    if (attachmentIndex < 0 && /^attachment\s*4\b.*physical training plan/i.test(lines[index]) && !tocPages.has(scanPage ?? -1)) attachmentIndex = index;
  }
  const blocks: { header: { title: string; date: string | null }; lines: string[]; sourcePage?: number; requiresLabels: boolean }[] = []; let current: { header: { title: string; date: string | null }; lines: string[]; sourcePage?: number; requiresLabels: boolean } | null = null; let sourcePage: number | undefined;
  for (const line of lines.slice(0, attachmentIndex >= 0 ? attachmentIndex : lines.length)) { const page = /^---\s*PAGE\s+(\d+)\s*---$/i.exec(line.trim()); if (page) sourcePage = Number(page[1]); const numbered = tocPages.has(sourcePage ?? -1) ? null : numberedEventHeader(line, contextYear); const header = numbered ?? (tocPages.has(sourcePage ?? -1) ? null : eventHeader(line, contextYear)); if (header) { if (current) blocks.push(current); current = { header, lines: [], sourcePage, requiresLabels: Boolean(numbered) }; } else if (nonEventSection(line)) { if (current) blocks.push(current); current = null; } else if (current) current.lines.push(line); }
  if (current) blocks.push(current);
  const attachment = attachmentWorkouts(lines);
  const eventBlocks = blocks.filter((block) => !block.requiresLabels || LABELS.filter((label) => tableValues(block.lines, label).values.length > 0).length >= 2);
  const events: OpordEvent[] = eventBlocks.map((block, index) => {
    const blockText = block.lines.join(" "); const allLines = [block.header.title, ...block.lines];
    const situation = firstTableValue(block.lines, "situation"); const dateTime = firstTableValue(block.lines, "date/time") ?? block.lines.find((line) => /^date\/tim\b/i.test(line))?.replace(/^date\/tim\s*/i, "").trim() ?? null;
    const date = block.header.date ?? findDate(dateTime ?? blockText, contextYear); const uniforms = valuesFor(block.lines, /^(?:uniform|uod|uniform of the day)\s*[:\-]?\s*(.+)$/i); const tableUod = tableValues(block.lines, "uod");
    const formUp = valuesFor(block.lines, /^(?:form[- ]?up location|meet at)\s*[:\-]?\s*(.+)$/i); const tableFormUp = tableValues(block.lines, "form-up location"); const locations = valuesFor(block.lines, /^(?:location|loc)\s*[:\-]?\s*(.+)$/i);
    const uniformRequirements: { audience: string; uniform: string; excerpt?: string }[] = [];
    const bring: string[] = []; const instructions: string[] = []; const deadlines: OpordDeadline[] = []; const timeline: string[] = [];
    for (const line of block.lines) {
      const bringMatch = /^(?:bring|required equipment|equipment|required items)\s*[:\-]?\s*(.+)$/i.exec(line); if (bringMatch && !/^n\/?a\.?$/i.test(bringMatch[1].trim())) bring.push(...splitItems(bringMatch[1]));
      const categoryRow = /^(First Term Cadets?|GMC POC|GMC|POC)\s+(.+)$/i.exec(line); if (categoryRow && /\b(?:OCP|FDU|Polo|PTG|ABU|uniform)\b/i.test(categoryRow[2])) uniformRequirements.push({ audience: categoryRow[1].trim(), uniform: categoryRow[2].trim(), excerpt: line });
      const deadline = parseDeadline(line); if (deadline) deadlines.push(deadline);
      if (/^(?:instruction|instructions)\s*[:\-]/i.test(line) || /\b(?:do not|don't|must|arrive|park|report to|remain)\b/i.test(line)) instructions.push(line.trim()); if (/^(?:\d{3,4}|\d{2}:\d{2})\s+.+/.test(line.trim())) timeline.push(line.trim());
    }
    const reportBefore = parseTimeField(block.lines, new RegExp(`(?:pre[- ]formation|report|show time|reporting|cadets report)[^0-9]*(?:NLT|NET)?\\s*(${TIME})`, "i")); const reportAfter = parseTimeField(block.lines, new RegExp(`(${TIME})\\s+pre[- ]formation`, "i")); const report = reportBefore.status === "explicit" ? reportBefore : reportAfter;
    const reportLine = block.lines.find((line) => /pre[- ]formation/i.test(line)); const reportMatch = block.lines.join(" ").match(/(?:report|show time|reporting)[^\n]{0,30}\b(NLT|NET)\b/i); const reportQualifier = field<"NLT" | "NET" | "Pre-Formation" | "unspecified">(reportMatch ? [reportMatch[1].toUpperCase()] : reportLine && report.status === "explicit" ? ["Pre-Formation"] : report.status === "explicit" ? ["unspecified"] : []);
    const range = (dateTime ?? blockText).match(new RegExp(`(?:from|between)?\\s*(${TIME})\\s*(?:to|through|-)\\s*(${TIME})`, "i"));
    const start = range ? explicit(formatTime(range[1])) : parseTimeField(block.lines, new RegExp(`(?:formation begins|event begins|begins|starts|start time|start)[^0-9]*(${TIME})`, "i"));
    const end = range ? explicit(formatTime(range[2])) : parseTimeField(block.lines, new RegExp(`(?:ends|end time|until)[^0-9]*(${TIME})`, "i"));
    const cancelled = /\b(?:cancelled|canceled)\b/i.test(`${block.header.title} ${blockText}`) || /\bno\s+pt\b/i.test(blockText);
    const positionalUniforms = typeIsLlAb(block.header.title) ? positionalUodRequirements(input.layout, block.sourcePage) : [];
    const hasPageLayout = typeIsLlAb(block.header.title) && (input.layout?.some((item) => item.page === block.sourcePage) ?? false);
    const tableUniforms = positionalUniforms.length === 3 ? positionalUniforms : hasPageLayout ? [] : uniformRequirements.length ? uniformRequirements : tableUod.values.flatMap((line, lineIndex) => { const category = /^(First Term Cadets?|GMC POC|GMC|POC)\s+(.+)$/i.exec(line); if (category) return [{ audience: category[1].trim(), uniform: category[2].trim(), excerpt: line }]; const standalone = /^(First Term Cadets?|GMC POC|GMC|POC)\s*$/i.exec(line); const following = standalone ? tableUod.values[lineIndex + 1] : undefined; return standalone && following ? [{ audience: standalone[1].trim(), uniform: following.trim(), excerpt: `${line} ${following}` }] : []; });
    const interleavedUod = tableUod.values.some((line) => /first term cadets?.*\bGMC\b.*\bPOC\b/i.test(line)); const uniform: OpordField<string> = tableUniforms.length > 1 || interleavedUod ? unknown<string>() : field<string>([...uniforms.values, ...tableUod.values.filter((line) => !/^(First Term Cadets?|GMC POC|GMC|POC)\b/i.test(line))], uniforms.excerpts[0] ?? tableUod.excerpts[0]);
    const day = (block.header.title.match(new RegExp(`\\b(${DAYS})\\b`, "i"))?.[1] ?? dateTime?.match(new RegExp(`\\b(${DAYS})\\b`, "i"))?.[1] ?? "").toUpperCase(); const type: "llab" | "pt" = /leadership\s+laboratory|\bLLAB\b/i.test(block.header.title) ? "llab" : "pt"; const workouts = cancelled || type !== "pt" ? [] : attachment.get(day) ?? [];
    const situationValue = situation ?? block.lines.find((line) => /^(?:LLAB|PT)\s+\d+\s*[-–—:]/i.test(line))?.replace(/^(?:LLAB|PT)\s+\d+\s*[-–—:]\s*/i, "").trim(); const canUseSituation = Boolean(situationValue && (!situation || !/^(?:LLAB|PT)\s+\d+\s*[-–—:]/i.test(situation) || block.sourcePage !== undefined)); const title = canUseSituation && !/^n\/?a\.?$/i.test(situationValue ?? "") ? situationValue!.replace(/\s+\d+\s*$/, "").trim() : block.header.title.replace(/\s*[-–—:]\s*(?:cancelled|canceled).*$/i, "").replace(/\s+\d+\s*$/, "").trim(); const recognizedLabels = LABELS.filter((label) => tableValues(block.lines, label).values.length > 0);
    return { id: `event-${index + 1}`, type, title, date: date ? explicit(date, dateTime ?? undefined) : unknown(), reportTime: report, reportQualifier, startTime: start, endTime: end, location: field(tableFormUp.values.length ? tableFormUp.values : formUp.values.length ? formUp.values : locations.values), formUpLocation: field(tableFormUp.values.length ? tableFormUp.values : formUp.values), activityLocations: valuesFor(block.lines, /^activity locations?\s*[:\-]?\s*(.+)$/i).values.flatMap(splitItems), uniform, uniformRequirements: tableUniforms, bring: [...new Set(bring.length ? bring : tableValues(block.lines, "required items").values.flatMap(splitItems))], instructions: [...new Set(instructions)], timeline: [...new Set(timeline.length ? timeline : tableValues(block.lines, "schedule").values)], workouts, specialConditions: [], deadlines, status: cancelled ? "cancelled" : "scheduled", sourceId: input.sourceId, sourceName: input.sourceName, provenance: { sourceName: input.sourceName, excerpt: allLines.join(" ").slice(0, 600) }, diagnostics: { sourcePage: block.sourcePage, recognizedLabels, unresolvedLabels: LABELS.filter((label) => !recognizedLabels.includes(label)), attachmentLinks: workouts.length ? [`Attachment 4 / ${day}`] : [] } };
  });
  document.events = events; document.parserVersion = OPORD_PARSER_VERSION; const dates = events.map((event) => event.date.status === "explicit" ? event.date.value : null).filter(Boolean) as string[]; if (dates.length) document.eventDateRange = explicit(dates.length === 1 ? dates[0] : `${dates.sort()[0]} to ${dates.sort().at(-1)}`);
  return document;
}
