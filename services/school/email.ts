import type { MailMessage } from "@/core/contracts/Mail";
import type { SchoolEmailMessage, SchoolEmailProposal, SchoolEmailRelevance, SchoolEmailTrust } from "@/core/contracts/SchoolEmail";

export function schoolEmailSourceId(message: Pick<SchoolEmailMessage, "provider" | "connectionId" | "messageId">) { return `email:${message.provider}:${message.connectionId}:${message.messageId}`; }

export function normalizeSchoolEmail(message: MailMessage, connectionId: string, accountId: string): SchoolEmailMessage {
  const body = message.bodyText.replace(/\s+/g, " ").trim();
  return { accountId, provider: message.provider, connectionId, messageId: message.id, ...(message.threadId ? { threadId: message.threadId } : {}), subject: message.subject.trim().slice(0, 500), ...(message.from.name ? { senderName: message.from.name.slice(0, 200) } : {}), senderAddress: message.from.email.slice(0, 320), receivedAt: message.receivedAt, plainTextBody: body.slice(0, 20_000), snippet: body.slice(0, 500), hasAttachments: Boolean(message.hasAttachments) };
}

export function classifySchoolEmail(message: Pick<SchoolEmailMessage, "subject" | "plainTextBody" | "senderAddress">, knownTerms: string[] = []): { relevance: SchoolEmailRelevance; trust: SchoolEmailTrust } {
  const text = `${message.subject}\n${message.plainTextBody}`; const lower = text.toLocaleLowerCase();
  const explicit = /\b(llab|afrotc|pt\b|assignment|quiz|exam|class|course|instructor|office hours|due|deadline|canceled|cancelled|rescheduled|moved to|uniform|wear|bring|training|briefing)\b/i.test(text);
  const known = knownTerms.some((term) => term.trim() && lower.includes(term.trim().toLocaleLowerCase()));
  const marketing = /\b(store|sale|discount|fundrais|merchandise|newsletter|unsubscribe)\b/i.test(text) && !explicit;
  const domainKnown = /@(?:usu\.edu|instructure\.com)$/i.test(message.senderAddress);
  return { relevance: marketing ? "not_relevant" : explicit || known ? "relevant" : domainKnown ? "uncertain" : "not_relevant", trust: known || /\b(?:afrotc|canvas|instructure)\b/i.test(message.senderAddress) ? "known" : "unknown" };
}

function time(value: string) { const military = /\b([01]\d|2[0-3])([0-5]\d)\b/.exec(value); if (military) return `${military[1]}:${military[2]}`; const match = /\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\b/i.exec(value); if (!match) return undefined; let hour = Number(match[1]); const minute = Number(match[2] ?? 0); if (hour > 23 || minute > 59) return undefined; if (match[3]?.toUpperCase() === "PM" && hour < 12) hour += 12; if (match[3]?.toUpperCase() === "AM" && hour === 12) hour = 0; return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`; }
function resolvedDate(value: string, receivedAt: Date) { const match = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,\s*(20\d{2}))?\b/i.exec(value); if (!match) return undefined; const months = ["january","february","march","april","may","june","july","august","september","october","november","december"]; const date = new Date(Number(match[3] ?? receivedAt.getFullYear()), months.indexOf(match[1].toLowerCase()), Number(match[2]), 23, 59); if (!match[3] && date < receivedAt) date.setFullYear(date.getFullYear() + 1); return Number.isNaN(date.getTime()) ? undefined : date; }

export function extractSchoolEmailProposals(message: SchoolEmailMessage, relevance: SchoolEmailRelevance, now = new Date()): SchoolEmailProposal[] {
  if (relevance !== "relevant") return [];
  const text = `${message.subject}. ${message.plainTextBody}`; const sourceId = schoolEmailSourceId(message); const proposals: SchoolEmailProposal[] = [];
  const ref = (type: SchoolEmailProposal["type"], title: string, description: string, evidence: string, confidence = 0.9): SchoolEmailProposal => ({ id: `school-email:${sourceId}:${type}:${proposals.length + 1}`, accountId: message.accountId, sourceId, type, title, description, evidence: evidence.slice(0, 500), confidence, status: "pending", createdAt: now, updatedAt: now });
  const due = /(.+?)\s+(?:is\s+)?(?:now\s+)?due\s+(?:on\s+)?((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,\s*20\d{2})?(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)?)/i.exec(text);
  if (due) { const date = resolvedDate(due[2], message.receivedAt); const clock = time(due[2]); if (date && clock) { const [hour, minute] = clock.split(":").map(Number); date.setHours(hour, minute, 0, 0); } if (date) proposals.push(ref("assignment_due_date_changed", `${due[1].trim()} deadline update`, `Due ${date.toLocaleString()}.`, due[0])); }
  const canceled = /(.{0,80})\b(?:class|course|llab|pt|training)\b.{0,80}\b(?:canceled|cancelled)\b/i.exec(text); if (canceled) proposals.push(ref("event_canceled", "School event cancellation", "An event was explicitly canceled; the existing event was not deleted.", canceled[0]));
  const moved = /(.{0,100})\b(?:moved|rescheduled)\s+to\s+([^.;]+)/i.exec(text); if (moved) { const clock = time(moved[2]); const location = /\b(?:in|at)\s+(?:the\s+)?([^.;]+)$/i.exec(moved[2]); if (clock) proposals.push(ref("event_time_changed", "School event time change", `New time ${clock}.`, moved[0])); if (location) proposals.push(ref("event_location_changed", "School event location change", `New location ${location[1].trim()}.`, moved[0])); }
  const uniform = /\b(?:wear|uniform\s*:)\s*([^.;]+)/i.exec(text); if (uniform) proposals.push(ref("uniform_changed", "Uniform update", `Uniform: ${uniform[1].trim()}.`, uniform[0]));
  const bring = /\bbring\s+([^.;]+)/i.exec(text); if (bring) proposals.push(ref("required_items_changed", "Required items update", `Bring: ${bring[1].trim()}.`, bring[0]));
  return proposals;
}
