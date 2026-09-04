export type OrganizedAudioNote = { title: string; content: string; topics: string[] };
export type SummaryFailureClassification = "initial_output_invalid" | "schema_validation_failed" | "repair_output_invalid";

export class SchoolSummaryValidationError extends Error {
  readonly issuePaths: string[];
  readonly classification: SummaryFailureClassification;

  constructor(issuePaths: string[], classification: SummaryFailureClassification = "initial_output_invalid") {
    super("AI summary could not be validated.");
    this.name = "SchoolSummaryValidationError";
    this.issuePaths = issuePaths;
    this.classification = classification;
  }
}

export class SchoolSummaryRepairProviderError extends Error {
  constructor() {
    super("AI summary repair could not be completed.");
    this.name = "SchoolSummaryRepairProviderError";
  }
}

type SummaryRecord = Record<string, unknown>;

function logDiagnostics(details: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "test") console.info("school_transcript_summary_parse", { operation: "school_transcript_summary", ...details });
}

function responseType(value: unknown) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function extractJsonCandidate(response: string) {
  const trimmed = response.trim();
  const startsWithJsonFence = /^```(?:json)?(?:\s|$)/i.test(trimmed);
  const endsWithJsonFence = /```\s*$/.test(trimmed);
  let candidate = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const firstObject = candidate.indexOf("{");
  const lastObject = candidate.lastIndexOf("}");
  if (!candidate.startsWith("{") && firstObject >= 0 && lastObject > firstObject) candidate = candidate.slice(firstObject, lastObject + 1);
  return { candidate, startsWithJsonObject: candidate.startsWith("{"), startsWithJsonFence, endsWithJsonFence };
}

export function parseOrganizedAudioNote(response: string): OrganizedAudioNote {
  const envelope = extractJsonCandidate(response);
  const baseDiagnostics = { responseCharacterCount: response.length, responseValueType: typeof response, responsePresent: Boolean(response), startsWithJsonObject: envelope.startsWithJsonObject, startsWithJsonFence: envelope.startsWithJsonFence, endsWithJsonFence: envelope.endsWithJsonFence };
  let parsed: unknown;
  try {
    parsed = JSON.parse(envelope.candidate);
  } catch {
    logDiagnostics({ ...baseDiagnostics, jsonParseResult: "failed", parsedTopLevelType: "unavailable", parsedTopLevelKeys: [], schemaValidationResult: "not_run", schemaIssuePaths: [], normalizationResult: "not_run" });
    throw new SchoolSummaryValidationError(["$"], "initial_output_invalid");
  }

  const parsedTopLevelType = responseType(parsed);
  const parsedTopLevelKeys = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? Object.keys(parsed) : [];
  const record = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as SummaryRecord : undefined;
  const issuePaths: string[] = [];
  if (!record) issuePaths.push("$");
  if (typeof record?.title !== "string" || !record.title.trim()) issuePaths.push("title");
  if (typeof record?.content !== "string" || !record.content.trim()) issuePaths.push("content");
  if (record?.topics !== undefined && !Array.isArray(record.topics)) issuePaths.push("topics");
  if (issuePaths.length) {
    logDiagnostics({ ...baseDiagnostics, jsonParseResult: "success", parsedTopLevelType, parsedTopLevelKeys, schemaValidationResult: "failed", schemaIssuePaths: issuePaths, normalizationResult: "not_run" });
    throw new SchoolSummaryValidationError(issuePaths, "schema_validation_failed");
  }

  const normalized = { title: (record?.title as string).trim().slice(0, 500), content: (record?.content as string).trim().slice(0, 50_000), topics: Array.isArray(record?.topics) ? record.topics.filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean).slice(0, 30) : [] };
  logDiagnostics({ ...baseDiagnostics, jsonParseResult: "success", parsedTopLevelType, parsedTopLevelKeys, schemaValidationResult: "passed", schemaIssuePaths: [], normalizationResult: "success" });
  return normalized;
}
