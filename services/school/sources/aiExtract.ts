import type { SchoolEvent, SchoolFact, SchoolProvenance, SchoolSource, SchoolSourceIntelligence } from "@/core/contracts/SchoolIntelligence";

const MAX_CHUNK_CHARS = 12_000;
const AI_EXTRACTOR_VERSION = 1;

export class SchoolAIExtractionError extends Error {
  public readonly code: "malformed_response" | "schema_validation_failed" | "evidence_validation_failed";

  constructor(code: "malformed_response" | "schema_validation_failed" | "evidence_validation_failed") {
    super(code === "malformed_response" ? "AI returned malformed structured data." : "AI structured data could not be validated.");
    this.name = "SchoolAIExtractionError";
    this.code = code;
  }
}

export function chunkSourceText(text: string, maxChars = MAX_CHUNK_CHARS): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const line of text.split("\n")) {
    if (current && current.length + line.length + 1 > maxChars) { chunks.push(current); current = ""; }
    current += `${current ? "\n" : ""}${line}`;
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [text];
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function string(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : undefined; }
function evidenceInText(text: string, value: unknown): value is string { return Boolean(string(value) && text.toLocaleLowerCase().includes(string(value)!.toLocaleLowerCase())); }

function provenance(source: SchoolSource, excerpt: string): SchoolProvenance { return { sourceId: source.id, sourceVersion: source.version, excerpt, extractor: "ai", extractorVersion: AI_EXTRACTOR_VERSION }; }
function normalized(value: string) { return value.trim().toLocaleLowerCase().replace(/\s+/g, " "); }

export function validateAIResult(source: SchoolSource, text: string, raw: unknown): SchoolSourceIntelligence {
  if (!isRecord(raw)) throw new Error("AI returned an invalid structured response.");
  if (!Array.isArray(raw.facts) || !Array.isArray(raw.events) || !Array.isArray(raw.actionItems)) throw new Error("AI returned an invalid structured response.");
  const result: SchoolSourceIntelligence = { facts: [], events: [], actionItems: [], conflicts: [], warnings: [] };
  const facts = raw.facts;
  for (const [index, item] of facts.entries()) {
    if (!isRecord(item) || item.certainty !== "explicit" || !evidenceInText(text, item.evidence)) { result.warnings.push("An AI fact was rejected because explicit evidence was missing or unverifiable."); continue; }
    const value = string(item.value); const subject = string(item.subject) ?? string(item.field); const evidence = string(item.evidence);
    if (!value || !subject || !evidence) continue;
    result.facts.push({ id: `${source.id}:ai:fact:${index + 1}`, accountId: source.accountId, kind: (string(item.field) ?? "other") as SchoolFact["kind"], subject, value, certainty: "explicit", provenance: [provenance(source, evidence)], extractedAt: new Date().toISOString() });
  }
  const events = raw.events;
  for (const [index, item] of events.entries()) {
    if (!isRecord(item) || item.certainty !== "explicit" || !evidenceInText(text, item.evidence)) { result.warnings.push("An AI event was rejected because explicit evidence was missing or unverifiable."); continue; }
    const title = string(item.title); const evidence = string(item.evidence); if (!title || !evidence) continue;
    const start = string(item.startsAt); const end = string(item.endsAt);
    if ((start && Number.isNaN(Date.parse(start))) || (end && Number.isNaN(Date.parse(end)))) { result.warnings.push("An AI event was rejected because its date was invalid."); continue; }
    result.events.push({ id: `${source.id}:ai:event:${index + 1}`, accountId: source.accountId, title, ...(start ? { startsAt: start } : {}), ...(end ? { endsAt: end } : {}), ...(string(item.dayOfWeek) ? { action: `Day: ${string(item.dayOfWeek)}` } : {}), ...(string(item.startTime) ? { action: `Starts at ${string(item.startTime)}` } : {}), ...(string(item.location) ? { location: { name: string(item.location)! } } : {}), ...(string(item.attire) ? { attire: { value: string(item.attire)!, certainty: "explicit" as const } } : {}), ...(Array.isArray(item.requiredItems) ? { requiredItems: item.requiredItems.filter((value): value is string => typeof value === "string") } : {}), factIds: [], provenance: [provenance(source, evidence)], certainty: "explicit" });
  }
  const actionItems = raw.actionItems;
  for (const [index, item] of actionItems.entries()) {
    if (!isRecord(item) || item.certainty !== "explicit" || !evidenceInText(text, item.evidence)) { result.warnings.push("An AI action item was rejected because explicit evidence was missing or unverifiable."); continue; }
    const title = string(item.title) ?? string(item.action); const evidence = string(item.evidence); const dueAt = string(item.dueAt) ?? string(item.dueDate);
    if (!title || !evidence) continue;
    if (dueAt && Number.isNaN(Date.parse(dueAt))) { result.warnings.push("An AI action item was rejected because its due date was invalid."); continue; }
    result.actionItems.push({ id: `${source.id}:ai:action:${index + 1}`, accountId: source.accountId, title, ...(dueAt ? { dueAt } : {}), status: "needs_review", factIds: [], provenance: [provenance(source, evidence)] });
  }
  return result;
}

export function mergeSchoolIntelligence(deterministic: SchoolSourceIntelligence, ai: SchoolSourceIntelligence): SchoolSourceIntelligence {
  const events: SchoolEvent[] = [...deterministic.events];
  const conflicts = [...deterministic.conflicts, ...ai.conflicts];
  for (const candidate of ai.events) {
    const existing = events.find((event) => normalized(event.title) === normalized(candidate.title));
    if (!existing) events.push(candidate);
    else {
      const conflictingFields = [
        existing.startsAt && candidate.startsAt && existing.startsAt !== candidate.startsAt ? "time" : null,
        existing.endsAt && candidate.endsAt && existing.endsAt !== candidate.endsAt ? "end time" : null,
        existing.action && candidate.action && normalized(existing.action) !== normalized(candidate.action) ? "action" : null,
        existing.location?.name && candidate.location?.name && normalized(existing.location.name) !== normalized(candidate.location.name) ? "location" : null,
      ].filter((field): field is string => Boolean(field));
      Object.assign(existing, {
        ...(existing.eventType ? {} : { eventType: candidate.eventType }),
        ...(existing.startsAt ? {} : candidate.startsAt ? { startsAt: candidate.startsAt } : {}),
        ...(existing.endsAt ? {} : candidate.endsAt ? { endsAt: candidate.endsAt } : {}),
        ...(existing.location ? {} : candidate.location ? { location: candidate.location } : {}),
        ...(existing.attire ? {} : candidate.attire ? { attire: candidate.attire } : {}),
        ...(existing.requiredItems?.length ? {} : candidate.requiredItems?.length ? { requiredItems: candidate.requiredItems } : {}),
        provenance: [...existing.provenance, ...candidate.provenance],
      });
      if (conflictingFields.length) conflicts.push({ id: `${existing.id}:ai-conflict:${conflicts.length + 1}`, accountId: existing.accountId, factIds: [], description: `${existing.title} has conflicting explicit ${conflictingFields.join(", ")} values across extractors.`, status: "open", createdAt: new Date().toISOString() });
    }
  }
  return { facts: [...deterministic.facts, ...ai.facts], events, actionItems: [...deterministic.actionItems, ...ai.actionItems], conflicts, warnings: [...new Set([...deterministic.warnings, ...ai.warnings])] };
}

export async function extractWithAIFromProvider(source: SchoolSource, text: string, provider: { generate(input: { messages: Array<{ role: "user"; content: string }>; context: string }): Promise<string> }): Promise<SchoolSourceIntelligence> {
  const chunks = chunkSourceText(text);
  const merged: SchoolSourceIntelligence = { facts: [], events: [], actionItems: [], conflicts: [], warnings: [] };
  for (const chunk of chunks) {
    const response = await provider.generate({ messages: [{ role: "user", content: chunk }], context: "Extract only explicit school facts, events, and action items from the supplied text. Never infer a date, location, uniform, or requirement. Return JSON only with facts, events, and actionItems arrays. Every item must include certainty=explicit and evidence copied exactly from the input. Use startsAt/endsAt only when the input contains an unambiguous full date and time." });
    let parsed: unknown;
    try { parsed = JSON.parse(response); } catch { throw new SchoolAIExtractionError("malformed_response"); }
    let validated: SchoolSourceIntelligence;
    try { validated = validateAIResult(source, chunk, parsed); } catch { throw new SchoolAIExtractionError("schema_validation_failed"); }
    const candidateCount = [parsed && typeof parsed === "object" && "facts" in parsed && Array.isArray(parsed.facts) ? parsed.facts.length : 0, parsed && typeof parsed === "object" && "events" in parsed && Array.isArray(parsed.events) ? parsed.events.length : 0, parsed && typeof parsed === "object" && "actionItems" in parsed && Array.isArray(parsed.actionItems) ? parsed.actionItems.length : 0].reduce((total, count) => total + count, 0);
    if (candidateCount > 0 && !validated.facts.length && !validated.events.length && !validated.actionItems.length) throw new SchoolAIExtractionError("evidence_validation_failed");
    merged.facts.push(...validated.facts); merged.events.push(...validated.events); merged.actionItems.push(...validated.actionItems); merged.warnings.push(...validated.warnings);
  }
  return mergeSchoolIntelligence({ facts: [], events: [], actionItems: [], conflicts: [], warnings: [] }, merged);
}

export async function extractWithAI(source: SchoolSource, text: string): Promise<SchoolSourceIntelligence> {
  const { getAIProvider } = await import("@/services/ai/provider");
  return extractWithAIFromProvider(source, text, getAIProvider());
}
