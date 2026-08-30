import type { SchoolEventType } from "./types";

export interface CanvasEventMetadata {
  uid?: string;
  url?: string;
  categories?: string[];
}

export function classifyEvent(
  title: string,
  description?: string,
  metadata?: CanvasEventMetadata
): SchoolEventType {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  const structuredText = [
    metadata?.uid,
    metadata?.url,
    ...(metadata?.categories ?? []),
    description,
  ].filter(Boolean).join(" ").toLowerCase();

  // Canvas assignment links are more reliable than natural-language title
  // matching (many assignments have titles such as "Reading Response 8").
  if (/\/assignments(?:\/|\?|$)/i.test(structuredText)) return "assignment";
  if (/\bassignment\b|\bhomework\b|\blab\b/.test(text)) return "assignment";

  // Canvas course calendar events have a distinct calendar-event URL. Keep
  // office hours and other non-course events out of the class bucket.
  if (/\/calendar_events(?:\/|\?|$)/i.test(structuredText)) return "class";
  if (/\bclass meeting\b|\blecture\b|\bclass\b/.test(text)) return "class";

  if (/\bexam\b|\bmidterm\b|\bfinal\b/.test(text)) return "exam";

  if (/\bquiz\b/.test(text)) return "quiz";

  if (text.includes("afrotc")) return "afrotc";

  if (text.includes("meeting")) return "meeting";

  return "other";
}
