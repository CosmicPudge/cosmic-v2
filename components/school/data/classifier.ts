import type { SchoolEventType } from "./types";

export interface CanvasEventMetadata {
  uid?: string;
  url?: string;
  categories?: string[];
  /** Provider-owned completion signal; never derived from dates or titles. */
  completionState?: string;
  completionFlag?: boolean;
}

export type CanvasCalendarCompletion = "completed" | "incomplete" | "unknown";

function normalized(value: string | undefined) { return value?.trim().toLowerCase(); }

/** Maps only explicit Canvas/provider completion signals. */
export function normalizeCanvasCalendarCompletion(metadata: CanvasEventMetadata): CanvasCalendarCompletion {
  const state = normalized(metadata.completionState);
  if (metadata.completionFlag === true || ["completed", "complete", "submitted", "graded", "excused"].includes(state ?? "")) return "completed";
  if (metadata.completionFlag === false || ["incomplete", "unsubmitted", "not_submitted", "pending"].includes(state ?? "")) return "incomplete";
  return "unknown";
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
  if (/\bquiz\b/.test(text)) return "quiz";
  if (/\bexam\b|\bmidterm\b|\bfinal\b/.test(text)) return "exam";
  if (/\bdiscussion\b|\bdiscuss\b/.test(text)) return "discussion";
  if (/\bmodule\b.*\b(due|deadline)\b|\b(due|deadline)\b.*\bmodule\b/.test(text)) return "module";
  if (/\breading\b|\bread\b/.test(text)) return "reading";
  if (/\bassignment\b|\bhomework\b|\blab\b/.test(text)) return "assignment";

  // Canvas course calendar events have a distinct calendar-event URL. Keep
  // office hours and other non-course events out of the class bucket.
  if (/\boffice hours?\b/.test(title.toLowerCase())) return "office-hours";
  if (/\/calendar_events(?:\/|\?|$)/i.test(structuredText)) return "class";
  if (/\bclass meeting\b|\blecture\b|\bclass\b/.test(text)) return "class";

  if (text.includes("afrotc")) return "afrotc";

  if (text.includes("meeting")) return "meeting";

  return "other";
}
