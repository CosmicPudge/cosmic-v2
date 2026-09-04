export interface AIProviderFailureMetadata { status: number; code?: string; type?: string; message?: string; retryAfter?: string; requestId?: string; }

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
  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const error = record.error && typeof record.error === "object" ? record.error as Record<string, unknown> : {};
  const cloudflareError = Array.isArray(record.errors) && record.errors[0] && typeof record.errors[0] === "object" ? record.errors[0] as Record<string, unknown> : {};
  const codeValue = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) ? String(value) : typeof value === "string" && /^[a-zA-Z0-9_.-]{1,100}$/.test(value) ? value : undefined;
  const stringValue = (value: unknown) => typeof value === "string" && value.length > 0 ? value : undefined;
  const messageValue = (value: unknown) => typeof value === "string" && value.length > 0 ? value.replace(/\s+/g, " ").slice(0, 300) : undefined;
  const retryAfter = response.headers.get("Retry-After");
  const metadata: AIProviderFailureMetadata = { status: response.status, ...(codeValue(cloudflareError.code ?? error.code) ? { code: codeValue(cloudflareError.code ?? error.code) } : {}), ...(stringValue(cloudflareError.type ?? error.type) ? { type: stringValue(cloudflareError.type ?? error.type) } : {}), ...(messageValue(cloudflareError.message ?? error.message) ? { message: messageValue(cloudflareError.message ?? error.message) } : {}), ...(retryAfter && /^\d+(?:\.\d+)?$/.test(retryAfter) ? { retryAfter } : {}), ...(stringValue(response.headers.get("x-request-id") ?? response.headers.get("cf-ray")) ? { requestId: stringValue(response.headers.get("x-request-id") ?? response.headers.get("cf-ray")) } : {}) };
  return new AIProviderError("provider_request_failed", response.status, metadata);
}
