import { SchoolEventType } from "./types";

export function classifyEvent(
  title: string,
  description?: string
): SchoolEventType {
  const text = `${title} ${description ?? ""}`.toLowerCase();

  if (text.includes("assignment")) return "assignment";
  if (text.includes("homework")) return "assignment";
  if (text.includes("lab")) return "assignment";

  if (text.includes("exam")) return "exam";
  if (text.includes("midterm")) return "exam";
  if (text.includes("final")) return "exam";

  if (text.includes("quiz")) return "quiz";

  if (text.includes("afrotc")) return "afrotc";

  if (text.includes("meeting")) return "meeting";

  return "other";
}