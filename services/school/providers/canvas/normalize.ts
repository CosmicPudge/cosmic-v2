import type { SchoolAssignmentCompletion, SchoolCanvasAssignmentMetadata, SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import type { CanvasAssignment, CanvasCourse, CanvasSubmission } from "./types";

export interface CanvasCourseRecord { id: string; name: string; courseCode?: string; startAt?: Date; endAt?: Date; workflowState?: string; url?: string; }

function parsed(value: string | null | undefined) { if (!value) return undefined; const result = new Date(value); return Number.isNaN(result.getTime()) ? undefined : result; }
function safeText(value: string | null | undefined) { return value?.replace(/<[^>]*>/g, " ").replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " }[entity] ?? " ")).replace(/\s+/g, " ").trim() || undefined; }

function escapedAttribute(value: string) { return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function safeCanvasHref(value: string) {
  try {
    const url = new URL(value);
    if (!(url.protocol === "https:" || url.protocol === "http:" || url.protocol === "mailto:")) return undefined;
    if (url.username || url.password || /(?:access[_-]?token|auth|api[_-]?key|signature|sig|token)/i.test(url.search)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

/** Allow the small rich-text subset used by Canvas while dropping scripts, styles, and event attributes. */
export function sanitizeCanvasHtml(value: string | null | undefined) {
  if (!value?.trim()) return undefined;
  const withoutDangerousBlocks = value.replace(/<!--[\s\S]*?-->/g, "").replace(/<\s*(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  const normalizedLinks = withoutDangerousBlocks.replace(/<\s*a\b([^>]*)>([\s\S]*?)<\s*\/\s*a\s*>/gi, (_full, rawAttributes: string, content: string) => {
    const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(rawAttributes);
    const safeHref = safeCanvasHref(href?.[1] ?? href?.[2] ?? href?.[3] ?? "");
    return safeHref ? `<a href="${escapedAttribute(safeHref)}">${content}</a>` : `<span>${content}</span>`;
  });
  const allowed = new Set(["p", "br", "div", "span", "ul", "ol", "li", "strong", "b", "em", "i", "u", "code", "pre", "blockquote", "a"]);
  return normalizedLinks.replace(/<\s*(\/?)\s*([a-z0-9]+)([^>]*)>/gi, (full, closing: string, rawName: string, rawAttributes: string) => {
    const name = rawName.toLowerCase();
    if (!allowed.has(name)) return "";
    if (closing) return `</${name}>`;
    if (name !== "a") return `<${name}>`;
    const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(rawAttributes);
    const safeHref = safeCanvasHref(href?.[1] ?? href?.[2] ?? href?.[3] ?? "");
    return safeHref ? `<a href="${escapedAttribute(safeHref)}" target="_blank" rel="noopener noreferrer">` : "<span>";
  }).trim() || undefined;
}

function safeCanvasUrl(value: string | null | undefined) { return value ? safeCanvasHref(value) : undefined; }

export function normalizeCanvasCourse(course: CanvasCourse): CanvasCourseRecord | null {
  if (typeof course.id !== "number" || typeof course.name !== "string" || !course.name.trim()) return null;
  const url = safeCanvasUrl(course.html_url);
  return { id: String(course.id), name: course.name.trim(), ...(course.course_code ? { courseCode: course.course_code } : {}), ...(parsed(course.start_at) ? { startAt: parsed(course.start_at) } : {}), ...(parsed(course.end_at) ? { endAt: parsed(course.end_at) } : {}), ...(course.workflow_state ? { workflowState: course.workflow_state } : {}), ...(url ? { url } : {}) };
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
  const description = safeText(assignment.description);
  const descriptionHtml = sanitizeCanvasHtml(assignment.description);
  const canvasUrl = safeCanvasUrl(assignment.html_url);
  const canvas: SchoolCanvasAssignmentMetadata = {
    assignmentId: String(assignment.id),
    courseId: String(assignment.course_id),
    ...(descriptionHtml ? { descriptionHtml } : {}),
    ...(assignment.grading_type ? { gradingType: assignment.grading_type } : {}),
    ...(assignment.submission_types?.length ? { submissionTypes: assignment.submission_types.filter((item): item is string => typeof item === "string") } : {}),
    ...(typeof assignment.assignment_group_id === "number" ? { assignmentGroupId: String(assignment.assignment_group_id) } : {}),
    ...(typeof assignment.quiz_id === "number" ? { quizId: String(assignment.quiz_id) } : {}),
    ...(typeof assignment.discussion_topic?.id === "number" ? { discussionTopicId: String(assignment.discussion_topic.id) } : {}),
    ...(assignment.discussion_topic?.html_url ? { discussionTopicUrl: safeCanvasUrl(assignment.discussion_topic.html_url) } : {}),
    ...(typeof assignment.allowed_attempts === "number" ? { allowedAttempts: assignment.allowed_attempts } : {}),
    ...(assignment.workflow_state ? { workflowState: assignment.workflow_state } : {}),
    ...(assignment.submission ? { submission: {
      ...(assignment.submission.workflow_state ? { workflowState: assignment.submission.workflow_state } : {}),
      ...(assignment.submission.submitted_at ? { submittedAt: assignment.submission.submitted_at } : {}),
      ...(typeof assignment.submission.late === "boolean" ? { late: assignment.submission.late } : {}),
      ...(typeof assignment.submission.missing === "boolean" ? { missing: assignment.submission.missing } : {}),
      ...(typeof assignment.submission.score === "number" ? { score: assignment.submission.score } : {}),
    } } : {}),
  };
  return { id: `canvas-api:${assignment.course_id}:${assignment.id}`, accountId, title: assignment.name.trim(), ...(description ? { description } : {}), courseId: String(assignment.course_id), sourceType: "canvas-api", sourceId: String(assignment.course_id), externalId: String(assignment.id), ...(dueAt ? { dueAt } : {}), ...(availableAt ? { availableAt } : {}), ...(lockAt ? { lockAt } : {}), completionStatus, planningStatus: "not_started", priority: "normal", ...(typeof assignment.points_possible === "number" ? { pointsPossible: assignment.points_possible } : {}), ...(typeof assignment.published === "boolean" ? { published: assignment.published } : {}), ...(canvasUrl ? { canvasUrl } : {}), providerMetadata: { canvas }, provenance: [{ sourceType: "canvas-api", sourceId: String(assignment.course_id), externalId: String(assignment.id), extractor: "deterministic", providerMetadata: { canvas } }], createdAt: now, updatedAt: now, ...(sourceUpdatedAt ? { sourceUpdatedAt } : {}) };
}
