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

/** Strict boundary for untrusted provider output. Hydration remains permissive; providers do not. */
export function normalizeSchoolAssignmentIntelligenceStrict(value: unknown): SchoolAssignmentIntelligence | undefined {
  if (!record(value)) return undefined;
  const requiredArrays = ["requirements", "deliverables", "suggestedSteps", "studyTopics", "ambiguities", "warnings"] as const;
  if (requiredArrays.some((key) => !Array.isArray(value[key]))) return undefined;
  const arrays = requiredArrays.map((key) => value[key] as unknown[]);
  if (arrays.some((items) => items.length > MAX_ITEMS)) return undefined;
  const ids = new Set<string>();
  const boundedText = (input: unknown, max = MAX_TEXT) => typeof input === "string" && input.trim().length > 0 && input.length <= max;
  const checkId = (input: unknown) => {
    if (input === undefined) return true;
    if (!boundedText(input, 120) || ids.has(input as string)) return false;
    ids.add(input as string);
    return true;
  };
  const checkDiagnostic = (item: unknown) => record(item) && boundedText(item.text) && checkId(item.id) && severities.includes(item.severity as SchoolAssignmentDiagnosticSeverity) && (item.category === undefined || boundedText(item.category, 120));
  const validRequirements = arrays[0].every((item) => record(item) && boundedText(item.text) && checkId(item.id) && requirementKinds.includes(item.kind as SchoolAssignmentRequirementKind) && (item.completed === undefined || typeof item.completed === "boolean") && (item.evidence === undefined || boundedText(item.evidence)));
  const validDeliverables = arrays[1].every((item) => record(item) && boundedText(item.text) && checkId(item.id) && (item.format === undefined || boundedText(item.format, 300)) && (item.evidence === undefined || boundedText(item.evidence)));
  const validSteps = arrays[2].every((item) => record(item) && boundedText(item.text) && checkId(item.id) && typeof item.order === "number" && Number.isSafeInteger(item.order) && item.order >= 0 && (item.estimatedMinutes === undefined || boundedMinutes(item.estimatedMinutes) !== undefined));
  const validTopics = arrays[3].every((item) => boundedText(item, MAX_TOPIC));
  const validAmbiguities = arrays[4].every(checkDiagnostic);
  const validWarnings = arrays[5].every(checkDiagnostic);
  if (!validRequirements || !validDeliverables || !validSteps || !validTopics || !validAmbiguities || !validWarnings) return undefined;
  if (value.summary !== undefined && !boundedText(value.summary)) return undefined;
  if (value.estimatedMinutes !== undefined && value.estimatedMinutes !== null && boundedMinutes(value.estimatedMinutes) === undefined) return undefined;
  if (value.effortCategory !== undefined && !effortCategories.includes(value.effortCategory as SchoolAssignmentEffortCategory)) return undefined;
  if (value.confidence !== undefined && (typeof value.confidence !== "number" || !Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1)) return undefined;
  if (value.generatedAt !== undefined && (typeof value.generatedAt !== "string" || value.generatedAt.length > 80 || Number.isNaN(Date.parse(value.generatedAt)))) return undefined;
  if (value.source !== undefined && !sources.includes(value.source as typeof sources[number])) return undefined;
  return normalizeSchoolAssignmentIntelligence(value);
}

export function isSchoolAssignmentIntelligence(value: unknown): value is SchoolAssignmentIntelligence { return normalizeSchoolAssignmentIntelligence(value) !== undefined; }
