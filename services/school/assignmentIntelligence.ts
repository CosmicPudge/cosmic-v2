import type {
  SchoolAssignmentAmbiguity,
  SchoolAssignmentDeliverable,
  SchoolAssignmentDiagnosticSeverity,
  SchoolAssignmentEffortCategory,
  SchoolAssignmentIntelligence,
  SchoolAssignmentRequirement,
  SchoolAssignmentRequirementKind,
  SchoolAssignmentStep,
  SchoolAssignmentWarning,
} from "@/core/contracts/SchoolPlanning";

const MAX_ITEMS = 50;
const MAX_TEXT = 2_000;
const MAX_TOPIC = 200;
const MAX_MINUTES = 2_000;
const requirementKinds: readonly SchoolAssignmentRequirementKind[] = ["task", "format", "length", "submission", "grading", "material", "other"];
const severities: readonly SchoolAssignmentDiagnosticSeverity[] = ["low", "medium", "high"];
const effortCategories: readonly SchoolAssignmentEffortCategory[] = ["quick", "moderate", "heavy", "major"];
const sources = ["manual", "deterministic", "ai"] as const;

function record(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function text(value: unknown, max = MAX_TEXT): string | undefined { return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined; }
function boundedMinutes(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= MAX_MINUTES ? value : undefined;
}
function confidence(value: unknown): number | undefined { return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : undefined; }
function id(prefix: string, value: string, index: number): string { const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70); return `${prefix}:${slug || "item"}:${index + 1}`; }
function severity(value: unknown): SchoolAssignmentDiagnosticSeverity { return severities.includes(value as SchoolAssignmentDiagnosticSeverity) ? value as SchoolAssignmentDiagnosticSeverity : "medium"; }

function normalizeRequirement(value: unknown, index: number): SchoolAssignmentRequirement | undefined {
  if (!record(value)) return undefined;
  const item = text(value.text); if (!item) return undefined;
  return { id: text(value.id, 120) ?? id("requirement", item, index), text: item, kind: requirementKinds.includes(value.kind as SchoolAssignmentRequirementKind) ? value.kind as SchoolAssignmentRequirementKind : "other", ...(typeof value.completed === "boolean" ? { completed: value.completed } : {}), ...(text(value.evidence, 2_000) ? { evidence: text(value.evidence, 2_000) } : {}) };
}

function normalizeDeliverable(value: unknown, index: number): SchoolAssignmentDeliverable | undefined {
  if (!record(value)) return undefined;
  const item = text(value.text); if (!item) return undefined;
  return { id: text(value.id, 120) ?? id("deliverable", item, index), text: item, ...(text(value.format, 300) ? { format: text(value.format, 300) } : {}), ...(text(value.evidence, 2_000) ? { evidence: text(value.evidence, 2_000) } : {}) };
}

function normalizeStep(value: unknown, index: number): SchoolAssignmentStep | undefined {
  if (!record(value)) return undefined;
  const item = text(value.text); if (!item) return undefined;
  return { id: text(value.id, 120) ?? id("step", item, index), text: item, order: typeof value.order === "number" && Number.isSafeInteger(value.order) && value.order >= 0 ? value.order : index, ...(boundedMinutes(value.estimatedMinutes) ? { estimatedMinutes: boundedMinutes(value.estimatedMinutes) } : {}) };
}

function normalizeDiagnostic(value: unknown, index: number): SchoolAssignmentAmbiguity | SchoolAssignmentWarning | undefined {
  if (!record(value)) return undefined;
  const item = text(value.text); if (!item) return undefined;
  return { id: text(value.id, 120) ?? id("diagnostic", item, index), text: item, severity: severity(value.severity), ...(text(value.category, 120) ? { category: text(value.category, 120) } : {}) };
}

function list<T>(value: unknown, normalize: (item: unknown, index: number) => T | undefined): T[] {
  return Array.isArray(value) ? value.slice(0, MAX_ITEMS).flatMap((item, index) => { const parsed = normalize(item, index); return parsed ? [parsed] : []; }) : [];
}

/** Normalize untrusted future/manual intelligence without throwing or changing source facts. */
export function normalizeSchoolAssignmentIntelligence(value: unknown): SchoolAssignmentIntelligence | undefined {
  if (!record(value)) return undefined;
  const summary = text(value.summary);
  const requirements = list(value.requirements, normalizeRequirement);
  const deliverables = list(value.deliverables, normalizeDeliverable);
  const suggestedSteps = list(value.suggestedSteps, normalizeStep).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const studyTopics = Array.isArray(value.studyTopics) ? [...new Set(value.studyTopics.flatMap((item) => { const parsed = text(item, MAX_TOPIC); return parsed ? [parsed] : []; }))].slice(0, MAX_ITEMS) : [];
  const ambiguities = list(value.ambiguities, normalizeDiagnostic) as SchoolAssignmentAmbiguity[];
  const warnings = list(value.warnings, normalizeDiagnostic) as SchoolAssignmentWarning[];
  const estimatedMinutes = value.estimatedMinutes === null ? null : boundedMinutes(value.estimatedMinutes);
  const parsedSource = sources.includes(value.source as typeof sources[number]) ? value.source as typeof sources[number] : undefined;
  const generatedAt = typeof value.generatedAt === "string" && !Number.isNaN(Date.parse(value.generatedAt)) ? value.generatedAt.slice(0, 80) : undefined;
  return { ...(summary ? { summary } : {}), requirements, deliverables, ...(estimatedMinutes !== undefined ? { estimatedMinutes } : {}), ...(effortCategories.includes(value.effortCategory as SchoolAssignmentEffortCategory) ? { effortCategory: value.effortCategory as SchoolAssignmentEffortCategory } : {}), suggestedSteps, studyTopics, ambiguities, warnings, ...(confidence(value.confidence) !== undefined ? { confidence: confidence(value.confidence) } : {}), ...(generatedAt ? { generatedAt } : {}), ...(parsedSource ? { source: parsedSource } : {}) };
}

export function isSchoolAssignmentIntelligence(value: unknown): value is SchoolAssignmentIntelligence { return normalizeSchoolAssignmentIntelligence(value) !== undefined; }
