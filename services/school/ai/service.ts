import "server-only";
import type { SchoolAssignmentInterpretationInput } from "@/core/contracts/SchoolAI";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { SCHOOL_AI_ENABLED } from "@/services/school/capabilities";
import { normalizeSchoolAssignmentIntelligenceStrict } from "@/services/school/assignmentIntelligence";
import { getSchoolAIProvider, isSupportedSchoolAIProvider } from "./registry";
import { sanitizeSchoolAIError, SchoolAIError, type SchoolAIResult } from "./errors";
import type { SchoolAIProvider } from "./provider";

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function safeText(value: string | undefined, max: number) { return value?.trim().slice(0, max) || undefined; }

export function toSchoolAssignmentInterpretationInput(assignment: SchoolPlanningAssignment): SchoolAssignmentInterpretationInput {
  const canvas = assignment.providerMetadata?.canvas;
  const gradingType = safeText(canvas?.gradingType, 120);
  const submissionTypes = canvas?.submissionTypes?.slice(0, 20).flatMap((value) => { const item = safeText(value, 120); return item ? [item] : []; });
  return {
    title: safeText(assignment.title, 500) ?? "Untitled assignment",
    ...(safeText(assignment.description, 12_000) ? { description: safeText(assignment.description, 12_000) } : {}),
    ...(safeText(assignment.courseId, 120) ? { courseId: safeText(assignment.courseId, 120) } : {}),
    ...(safeText(assignment.courseName, 300) ? { courseName: safeText(assignment.courseName, 300) } : {}),
    ...(assignment.dueAt ? { dueAt: assignment.dueAt.toISOString() } : {}),
    ...(assignment.availableAt ? { availableAt: assignment.availableAt.toISOString() } : {}),
    ...(assignment.lockAt ? { lockAt: assignment.lockAt.toISOString() } : {}),
    ...(assignment.pointsPossible !== undefined ? { pointsPossible: assignment.pointsPossible } : {}),
    ...(gradingType ? { gradingType } : {}),
    ...(submissionTypes ? { submissionTypes } : {}),
    sourceType: assignment.sourceType,
  };
}

export async function interpretSchoolAssignment(assignment: SchoolPlanningAssignment, options: { provider?: SchoolAIProvider; timeoutMs?: number; enabledForTests?: boolean } = {}): Promise<SchoolAIResult<NonNullable<SchoolPlanningAssignment["intelligence"]>>> {
  const enabled = SCHOOL_AI_ENABLED || (process.env.NODE_ENV === "test" && options.enabledForTests === true);
  if (!enabled) return { ok: false, error: new SchoolAIError("DISABLED", "School AI interpretation is disabled.") };
  const selected = process.env.SCHOOL_AI_PROVIDER?.trim().toLowerCase();
  if (selected && !isSupportedSchoolAIProvider(selected) && !options.provider) return { ok: false, error: new SchoolAIError("NO_PROVIDER", "No supported School AI provider is configured.") };
  const provider = options.provider ?? getSchoolAIProvider();
  if (!provider) return { ok: false, error: new SchoolAIError(selected ? "NOT_CONFIGURED" : "NO_PROVIDER", selected ? "The configured School AI provider is unavailable." : "No School AI provider is configured.") };
  try {
    const response = await provider.interpretAssignment(toSchoolAssignmentInterpretationInput(assignment), { timeoutMs: options.timeoutMs });
    if (!isRecord(response) || typeof response.providerId !== "string" || !Array.isArray(response.warnings) || response.warnings.length > 20 || !response.warnings.every((warning) => typeof warning === "string" && warning.trim().length > 0 && warning.length <= 500) || (response.responseStatus !== "ok" && response.responseStatus !== "degraded")) {
      return { ok: false, error: new SchoolAIError("MALFORMED_RESPONSE", "School AI returned an invalid provider response.", { providerId: provider.id, modelId: provider.model }) };
    }
    const intelligence = normalizeSchoolAssignmentIntelligenceStrict(response.candidate);
    if (!intelligence) return { ok: false, error: new SchoolAIError("MALFORMED_RESPONSE", "School AI returned an invalid assignment interpretation.", { providerId: provider.id, modelId: provider.model }) };
    return { ok: true, value: { ...intelligence, source: "ai", generatedAt: new Date().toISOString(), ...(response.warnings.length ? { warnings: [...intelligence.warnings, ...response.warnings.map((text, index) => ({ id: `provider-warning:${index + 1}`, text, severity: "medium" as const, category: "provider" }))] } : {}) } };
  } catch (error) {
    return { ok: false, error: sanitizeSchoolAIError(error, provider) };
  }
}
