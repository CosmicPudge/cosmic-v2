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
