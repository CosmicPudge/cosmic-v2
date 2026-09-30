import "server-only";

export const schoolAIErrorCodes = [
  "DISABLED",
  "NO_PROVIDER",
  "NOT_CONFIGURED",
  "AUTHENTICATION",
  "RATE_LIMIT",
  "QUOTA",
  "TIMEOUT",
  "NETWORK",
  "PROVIDER_UNAVAILABLE",
  "MALFORMED_RESPONSE",
  "SAFETY_REFUSAL",
  "UNKNOWN",
] as const;

export type SchoolAIErrorCode = typeof schoolAIErrorCodes[number];

export interface SchoolAIDiagnosticMetadata {
  status?: number;
  providerId?: string;
  modelId?: string;
  retryAfterSeconds?: number;
}

export class SchoolAIError extends Error {
  public readonly code: SchoolAIErrorCode;
  public readonly retryable: boolean;
  public readonly providerId?: string;
  public readonly modelId?: string;
  public readonly diagnostic?: SchoolAIDiagnosticMetadata;

  constructor(code: SchoolAIErrorCode, message: string, options: { retryable?: boolean; providerId?: string; modelId?: string; diagnostic?: SchoolAIDiagnosticMetadata } = {}) {
    super(message);
    this.name = "SchoolAIError";
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.providerId = options.providerId;
    this.modelId = options.modelId;
    this.diagnostic = options.diagnostic;
  }
}

export type SchoolAIResult<T> = { ok: true; value: T } | { ok: false; error: SchoolAIError };

export function sanitizeSchoolAIError(error: unknown, provider?: Pick<SchoolAIProviderLike, "id" | "model">): SchoolAIError {
  if (error instanceof SchoolAIError) return error;
  if (error instanceof DOMException && error.name === "TimeoutError") return new SchoolAIError("TIMEOUT", "School AI interpretation timed out.", { retryable: true, providerId: provider?.id, modelId: provider?.model });
  if (error instanceof Error && /timeout|timed out/i.test(error.message)) return new SchoolAIError("TIMEOUT", "School AI interpretation timed out.", { retryable: true, providerId: provider?.id, modelId: provider?.model });
  if (error instanceof TypeError) return new SchoolAIError("NETWORK", "School AI is temporarily unavailable.", { retryable: true, providerId: provider?.id, modelId: provider?.model });
  return new SchoolAIError("UNKNOWN", "School AI interpretation failed safely.", { providerId: provider?.id, modelId: provider?.model });
}

type SchoolAIProviderLike = { id: string; model?: string };
