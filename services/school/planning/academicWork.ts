import type { SchoolEvent } from "@/components/school/data/types";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";

export type AcademicWorkType = "assignment" | "quiz" | "exam" | "project" | "presentation" | "paper" | "lab" | "reading" | "study" | "other";
export type AcademicWorkClassification = { type: AcademicWorkType; confidence: "explicit" | "pattern" | "unknown" };

export const academicWorkConfig = {
  normalHorizonDays: 7,
  majorWorkHorizonDays: 30,
  defaultMinutes: { assignment: 45, quiz: 60, exam: 180, project: 300, presentation: 180, paper: 240, lab: 120, reading: 30, study: 45, other: 45 } satisfies Record<AcademicWorkType, number>,
  preparationBlocks: { quiz: { count: 2, minutes: 30 }, exam: { count: 4, minutes: 45 } },
} as const;

const token = (value: string, expression: RegExp) => expression.test(value);
export function classifyAcademicWork(item: Pick<SchoolPlanningAssignment, "title" | "description"> | Pick<SchoolEvent, "title" | "description" | "type">): AcademicWorkClassification {
  if ("type" in item && item.type === "exam") return { type: "exam", confidence: "explicit" };
  if ("type" in item && item.type === "quiz") return { type: "quiz", confidence: "explicit" };
  const text = `${item.title} ${item.description ?? ""}`.toLocaleLowerCase();
  if (token(text, /\b(final exam|midterm|exam(?:ination)?|test)\b/)) return { type: "exam", confidence: "pattern" };
  if (token(text, /\bquiz(?:zes)?\b/)) return { type: "quiz", confidence: "pattern" };
  if (token(text, /\b(project|capstone|design deliverable)\b/)) return { type: "project", confidence: "pattern" };
  if (token(text, /\b(presentation|slides|speech)\b/)) return { type: "presentation", confidence: "pattern" };
  if (token(text, /\b(essay|paper|research paper|final report)\b/)) return { type: "paper", confidence: "pattern" };
  if (token(text, /\b(lab report|lab write[- ]?up)\b/)) return { type: "lab", confidence: "pattern" };
  if (token(text, /\b(reading|chapter reading|reading response)\b/)) return { type: "reading", confidence: "pattern" };
  return { type: "assignment", confidence: "unknown" };
}

export function isMajorAcademicWork(type: AcademicWorkType) { return ["exam", "project", "presentation", "paper", "lab"].includes(type); }
