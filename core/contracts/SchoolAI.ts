export type SchoolAIProviderId = "mock" | (string & {});

export interface SchoolAssignmentInterpretationInput {
  title: string;
  description?: string;
  courseId?: string;
  courseName?: string;
  dueAt?: string;
  availableAt?: string;
  lockAt?: string;
  pointsPossible?: number;
  gradingType?: string;
  submissionTypes?: string[];
  /** Safe, assignment-local metadata only. Credentials and unrelated context are never allowed here. */
  sourceType?: "canvas-api" | "canvas-calendar" | "school-source" | "manual";
}

const interpretationSourceTypes = ["canvas-api", "canvas-calendar", "school-source", "manual"] as const;

function boundedText(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;
}

/** Client-safe whitelist used before an assignment is sent to the server action. */
export function toSchoolAssignmentInterpretationInput(assignment: {
  title: string;
  description?: string;
  courseId?: string;
  courseName?: string;
  dueAt?: Date;
  availableAt?: Date;
  lockAt?: Date;
  pointsPossible?: number;
  providerMetadata?: { canvas?: { gradingType?: string; submissionTypes?: string[] } };
  sourceType: SchoolAssignmentInterpretationInput["sourceType"];
}): SchoolAssignmentInterpretationInput {
  const gradingType = boundedText(assignment.providerMetadata?.canvas?.gradingType, 120);
  const submissionTypes = assignment.providerMetadata?.canvas?.submissionTypes?.slice(0, 20)
    .flatMap((value) => { const item = boundedText(value, 120); return item ? [item] : []; });
  const description = boundedText(assignment.description, 12_000);
  const courseId = boundedText(assignment.courseId, 120);
  const courseName = boundedText(assignment.courseName, 300);
  return {
    title: boundedText(assignment.title, 500) ?? "Untitled assignment",
    ...(description ? { description } : {}),
    ...(courseId ? { courseId } : {}),
    ...(courseName ? { courseName } : {}),
    ...(assignment.dueAt ? { dueAt: assignment.dueAt.toISOString() } : {}),
    ...(assignment.availableAt ? { availableAt: assignment.availableAt.toISOString() } : {}),
    ...(assignment.lockAt ? { lockAt: assignment.lockAt.toISOString() } : {}),
    ...(assignment.pointsPossible !== undefined ? { pointsPossible: assignment.pointsPossible } : {}),
    ...(gradingType ? { gradingType } : {}),
    ...(submissionTypes ? { submissionTypes } : {}),
    sourceType: assignment.sourceType,
  };
}

/** Strictly parse the already-whitelisted request body; arbitrary prompts are rejected. */
export function parseSchoolAssignmentInterpretationInput(value: unknown): SchoolAssignmentInterpretationInput | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const allowed = new Set(["title", "description", "courseId", "courseName", "dueAt", "availableAt", "lockAt", "pointsPossible", "gradingType", "submissionTypes", "sourceType"]);
  if (Object.keys(record).some((key) => !allowed.has(key))) return undefined;
  const title = boundedText(record.title, 500);
  if (!title) return undefined;
  const date = (key: string) => record[key] === undefined ? undefined : typeof record[key] === "string" && !Number.isNaN(Date.parse(record[key] as string)) ? record[key] as string : null;
  const dueAt = date("dueAt"); const availableAt = date("availableAt"); const lockAt = date("lockAt");
  if (dueAt === null || availableAt === null || lockAt === null) return undefined;
  if (record.pointsPossible !== undefined && (typeof record.pointsPossible !== "number" || !Number.isFinite(record.pointsPossible) || record.pointsPossible < 0 || record.pointsPossible > 1_000_000)) return undefined;
  const submissionTypes = record.submissionTypes === undefined ? undefined : Array.isArray(record.submissionTypes) && record.submissionTypes.length <= 20 && record.submissionTypes.every((item) => typeof item === "string" && Boolean(item.trim()) && item.length <= 120) ? record.submissionTypes.map((item) => (item as string).trim()) : null;
  if (submissionTypes === null) return undefined;
  if (record.sourceType !== undefined && !interpretationSourceTypes.includes(record.sourceType as typeof interpretationSourceTypes[number])) return undefined;
  const optionalText = (key: string, max: number) => record[key] === undefined ? undefined : boundedText(record[key], max);
  return {
    title,
    ...(optionalText("description", 12_000) ? { description: optionalText("description", 12_000) } : {}),
    ...(optionalText("courseId", 120) ? { courseId: optionalText("courseId", 120) } : {}),
    ...(optionalText("courseName", 300) ? { courseName: optionalText("courseName", 300) } : {}),
    ...(dueAt ? { dueAt } : {}), ...(availableAt ? { availableAt } : {}), ...(lockAt ? { lockAt } : {}),
    ...(record.pointsPossible !== undefined ? { pointsPossible: record.pointsPossible as number } : {}),
    ...(optionalText("gradingType", 120) ? { gradingType: optionalText("gradingType", 120) } : {}),
    ...(submissionTypes ? { submissionTypes } : {}),
    ...(record.sourceType ? { sourceType: record.sourceType as SchoolAssignmentInterpretationInput["sourceType"] } : {}),
  };
}

export interface SchoolAIRequestOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface SchoolAIUsageMetadata {
  inputTokens?: number;
  outputTokens?: number;
}

export interface SchoolAIProviderResult {
  /** Untrusted candidate data; consumers must normalize it before use. */
  candidate: unknown;
  providerId: SchoolAIProviderId;
  modelId?: string;
  responseStatus: "ok" | "degraded";
  warnings: string[];
  durationMs?: number;
  usage?: SchoolAIUsageMetadata;
}
