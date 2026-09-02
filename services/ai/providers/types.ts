export type AIErrorCategory = "not_configured" | "unauthorized" | "forbidden" | "rate_limited" | "quota_exhausted" | "server_error" | "timeout" | "malformed_response" | "request_failed";

export interface NormalizedAIResult<T = string> {
  provider: string;
  model: string;
  success: boolean;
  value?: T;
  errorCategory?: AIErrorCategory;
  retryable?: boolean;
  usage?: { inputTokens?: number; outputTokens?: number };
}
