export interface AIProviderFailureMetadata { status: number; code?: string; type?: string; retryAfter?: string; requestId?: string; }

export class AIProviderError extends Error {
  public readonly code: "provider_not_configured" | "provider_request_failed";
  public readonly status?: number;
  public readonly metadata?: AIProviderFailureMetadata;

  constructor(code: "provider_not_configured" | "provider_request_failed", status?: number, metadata?: AIProviderFailureMetadata) {
    super(code === "provider_not_configured" ? "AI provider is not configured." : "AI provider request failed.");
    this.name = "AIProviderError";
    this.code = code;
    this.status = status;
    this.metadata = metadata;
  }
}

export async function createAIProviderError(response: Response) {
  let body: unknown;
  try { body = await response.json(); } catch { body = undefined; }
  const error = body && typeof body === "object" && "error" in body && body.error && typeof body.error === "object" ? body.error as Record<string, unknown> : {};
  const stringValue = (value: unknown) => typeof value === "string" && /^[a-zA-Z0-9_.-]{1,100}$/.test(value) ? value : undefined;
  const retryAfter = response.headers.get("Retry-After");
  const metadata: AIProviderFailureMetadata = { status: response.status, ...(stringValue(error.code) ? { code: stringValue(error.code) } : {}), ...(stringValue(error.type) ? { type: stringValue(error.type) } : {}), ...(retryAfter && /^\d+(?:\.\d+)?$/.test(retryAfter) ? { retryAfter } : {}), ...(stringValue(response.headers.get("x-request-id")) ? { requestId: stringValue(response.headers.get("x-request-id")) } : {}) };
  return new AIProviderError("provider_request_failed", response.status, metadata);
}
