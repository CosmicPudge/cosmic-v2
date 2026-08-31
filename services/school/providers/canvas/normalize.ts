import type { SchoolAssignmentCompletion, SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import type { CanvasAssignment, CanvasCourse, CanvasSubmission } from "./types";

export interface CanvasCourseRecord { id: string; name: string; courseCode?: string; startAt?: Date; endAt?: Date; workflowState?: string; url?: string; }

function parsed(value: string | null | undefined) { if (!value) return undefined; const result = new Date(value); return Number.isNaN(result.getTime()) ? undefined : result; }
function safeText(value: string | null | undefined) { return value?.replace(/<[^>]*>/g, " ").replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " }[entity] ?? " ")).replace(/\s+/g, " ").trim() || undefined; }

export function normalizeCanvasCourse(course: CanvasCourse): CanvasCourseRecord | null {
  if (typeof course.id !== "number" || typeof course.name !== "string" || !course.name.trim()) return null;
  return { id: String(course.id), name: course.name.trim(), ...(course.course_code ? { courseCode: course.course_code } : {}), ...(parsed(course.start_at) ? { startAt: parsed(course.start_at) } : {}), ...(parsed(course.end_at) ? { endAt: parsed(course.end_at) } : {}), ...(course.workflow_state ? { workflowState: course.workflow_state } : {}), ...(course.html_url ? { url: course.html_url } : {}) };
}

export function normalizeCanvasSubmission(submission: CanvasSubmission | null | undefined): SchoolAssignmentCompletion {
  if (!submission) return "unknown";
  if (submission.missing === true) return "missing";
  if (submission.workflow_state === "graded") return "graded";
  if (submission.workflow_state === "submitted" || submission.submitted_at) return "submitted";
  if (submission.late === true) return "overdue";
  if (submission.workflow_state === "unsubmitted") return "upcoming";
  return "unknown";
}

export function normalizeCanvasAssignment(accountId: string, assignment: CanvasAssignment, now = new Date()): SchoolPlanningAssignment | null {
  if (typeof assignment.id !== "number" || typeof assignment.course_id !== "number" || typeof assignment.name !== "string" || !assignment.name.trim()) return null;
  const dueAt = parsed(assignment.due_at); const availableAt = parsed(assignment.unlock_at); const lockAt = parsed(assignment.lock_at); const sourceUpdatedAt = parsed(assignment.updated_at);
  const completionStatus = normalizeCanvasSubmission(assignment.submission);
  return { id: `canvas-api:${assignment.course_id}:${assignment.id}`, accountId, title: assignment.name.trim(), ...(safeText(assignment.description) ? { description: safeText(assignment.description) } : {}), courseId: String(assignment.course_id), sourceType: "canvas-api", sourceId: String(assignment.course_id), externalId: String(assignment.id), ...(dueAt ? { dueAt } : {}), ...(availableAt ? { availableAt } : {}), ...(lockAt ? { lockAt } : {}), completionStatus, planningStatus: "not_started", priority: "normal", ...(typeof assignment.points_possible === "number" ? { pointsPossible: assignment.points_possible } : {}), ...(typeof assignment.published === "boolean" ? { published: assignment.published } : {}), ...(assignment.html_url ? { canvasUrl: assignment.html_url } : {}), provenance: [{ sourceType: "canvas-api", sourceId: String(assignment.course_id), externalId: String(assignment.id), extractor: "deterministic" }], createdAt: now, updatedAt: now, ...(sourceUpdatedAt ? { sourceUpdatedAt } : {}) };
}
