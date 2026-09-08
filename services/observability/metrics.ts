export type MetricErrorCategory = "timeout" | "rate_limit" | "connection" | "validation" | "upstream" | "unknown";

type Counter = {
  requests: number;
  successes: number;
  failures: number;
  totalDurationMs: number;
  totalRows: number;
  responseBytes: number;
  timeouts: number;
  rateLimits: number;
  errors: Record<MetricErrorCategory, number>;
};

type CacheCounter = {
  hits: number;
  misses: number;
  coalesced: number;
  refreshes: number;
  evictions: number;
  stale: number;
  failures: number;
};

type AICounter = {
  requests: number;
  failures: number;
  totalDurationMs: number;
  usageKnownRequests: number;
  usageUnknownRequests: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  estimatedCostUsd: number | null;
};

const MAX_KEYS = 128;
const database = new Map<string, Counter>();
const providers = new Map<string, Counter>();
const caches = new Map<string, CacheCounter>();
const ai = new Map<string, AICounter>();

function emptyErrors(): Record<MetricErrorCategory, number> {
  return { timeout: 0, rate_limit: 0, connection: 0, validation: 0, upstream: 0, unknown: 0 };
}

function emptyCounter(): Counter {
  return { requests: 0, successes: 0, failures: 0, totalDurationMs: 0, totalRows: 0, responseBytes: 0, timeouts: 0, rateLimits: 0, errors: emptyErrors() };
}

function emptyCacheCounter(): CacheCounter {
  return { hits: 0, misses: 0, coalesced: 0, refreshes: 0, evictions: 0, stale: 0, failures: 0 };
}

function emptyAICounter(): AICounter {
  return { requests: 0, failures: 0, totalDurationMs: 0, usageKnownRequests: 0, usageUnknownRequests: 0, inputTokens: 0, outputTokens: 0, cachedTokens: 0, estimatedCostUsd: null };
}

function boundedGet<T>(map: Map<string, T>, key: string, create: () => T): T {
  const existing = map.get(key);
  if (existing) return existing;
  if (map.size >= MAX_KEYS) map.delete(map.keys().next().value as string);
  const value = create();
  map.set(key, value);
  return value;
}

function safeKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9._:-]/g, "_").slice(0, 80) || "unknown";
}

function duration(value: number | undefined): number {
  return Number.isFinite(value) && value && value > 0 ? Math.round(value) : 0;
}

function recordError(counter: Counter, category: MetricErrorCategory | undefined) {
  if (!category) return;
  counter.errors[category] += 1;
  if (category === "timeout") counter.timeouts += 1;
  if (category === "rate_limit") counter.rateLimits += 1;
}

export function classifyMetricError(error: unknown): MetricErrorCategory {
  const name = error instanceof Error ? error.name.toLowerCase() : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (name.includes("timeout") || message.includes("timeout") || message.includes("timed out")) return "timeout";
  if (message.includes("429") || message.includes("rate limit")) return "rate_limit";
  if (message.includes("connect") || message.includes("enotfound") || message.includes("econn")) return "connection";
  if (message.includes("invalid") || message.includes("validation")) return "validation";
  if (message.includes("request failed") || message.includes("upstream")) return "upstream";
  return "unknown";
}

export function recordDatabaseMetric(input: { operation: string; durationMs?: number; rows?: number; errorCategory?: MetricErrorCategory }) {
  const counter = boundedGet(database, safeKey(input.operation), emptyCounter);
  counter.requests += 1;
  counter.totalDurationMs += duration(input.durationMs);
  counter.totalRows += Number.isFinite(input.rows) && input.rows && input.rows > 0 ? Math.round(input.rows) : 0;
  if (input.errorCategory) { counter.failures += 1; recordError(counter, input.errorCategory); } else counter.successes += 1;
}

export function recordProviderMetric(input: { provider: string; operation: string; durationMs?: number; responseBytes?: number; errorCategory?: MetricErrorCategory }) {
  const counter = boundedGet(providers, `${safeKey(input.provider)}:${safeKey(input.operation)}`, emptyCounter);
  counter.requests += 1;
  counter.totalDurationMs += duration(input.durationMs);
  counter.responseBytes += Number.isFinite(input.responseBytes) && input.responseBytes && input.responseBytes > 0 ? Math.round(input.responseBytes) : 0;
  if (input.errorCategory) { counter.failures += 1; recordError(counter, input.errorCategory); } else counter.successes += 1;
}

export function recordCacheMetric(input: { cache: string; event: keyof CacheCounter }) {
  const counter = boundedGet(caches, safeKey(input.cache), emptyCacheCounter);
  counter[input.event] += 1;
}

export function recordAIMetric(input: { provider: string; model: string; feature: string; durationMs?: number; inputTokens?: number; outputTokens?: number; cachedTokens?: number; estimatedCostUsd?: number; errorCategory?: MetricErrorCategory }) {
  const counter = boundedGet(ai, `${safeKey(input.provider)}:${safeKey(input.model)}:${safeKey(input.feature)}`, emptyAICounter);
  counter.requests += 1;
  counter.totalDurationMs += duration(input.durationMs);
  if (input.errorCategory) counter.failures += 1;
  const hasUsage = [input.inputTokens, input.outputTokens, input.cachedTokens].some((value) => Number.isFinite(value));
  if (hasUsage) {
    counter.usageKnownRequests += 1;
    counter.inputTokens += input.inputTokens ?? 0;
    counter.outputTokens += input.outputTokens ?? 0;
    counter.cachedTokens += input.cachedTokens ?? 0;
  } else counter.usageUnknownRequests += 1;
  if (Number.isFinite(input.estimatedCostUsd)) counter.estimatedCostUsd = (counter.estimatedCostUsd ?? 0) + (input.estimatedCostUsd ?? 0);
}

export function getObservabilitySnapshot() {
  return {
    generatedAt: new Date().toISOString(),
    database: Object.fromEntries(database),
    providers: Object.fromEntries(providers),
    caches: Object.fromEntries(caches),
    ai: Object.fromEntries(ai),
    limits: { maxKeysPerCategory: MAX_KEYS },
  };
}

export function resetObservabilityForTests() {
  database.clear();
  providers.clear();
  caches.clear();
  ai.clear();
}
