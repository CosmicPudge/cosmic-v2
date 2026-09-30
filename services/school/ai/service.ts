import "server-only";
import { toSchoolAssignmentInterpretationInput } from "@/core/contracts/SchoolAI";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { SCHOOL_AI_ENABLED } from "@/services/school/capabilities";
import { normalizeSchoolAssignmentIntelligenceStrict } from "@/services/school/assignmentIntelligence";
import { getSchoolAIProvider, isSupportedSchoolAIProvider } from "./registry";
import { sanitizeSchoolAIError, SchoolAIError, type SchoolAIResult } from "./errors";
import type { SchoolAIProvider } from "./provider";

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
export { toSchoolAssignmentInterpretationInput } from "@/core/contracts/SchoolAI";

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
