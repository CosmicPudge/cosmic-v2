import type { CanvasPage } from "./types";

export type CanvasErrorKind = "invalid_token" | "forbidden" | "not_found" | "rate_limited" | "unavailable" | "malformed";

export class CanvasProviderError extends Error {
  public readonly kind: CanvasErrorKind;
  public readonly status?: number;
  constructor(kind: CanvasErrorKind, message: string, status?: number) { super(message); this.name = "CanvasProviderError"; this.kind = kind; this.status = status; }
}

function baseUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") throw new Error();
    return url.toString().replace(/\/$/, "");
  } catch { throw new CanvasProviderError("malformed", "Canvas base URL is invalid."); }
}

export function canvasApiUrl(base: string, path: string, params?: URLSearchParams) {
  const url = new URL(`/api/v1/${path.replace(/^\//, "")}`, baseUrl(base));
  if (params) url.search = params.toString();
  return url;
}

export async function canvasRequest<T>(base: string, token: string, path: string, params?: URLSearchParams, fetchImpl: typeof fetch = fetch): Promise<{ data: T; headers: Headers }> {
  if (!token.trim()) throw new CanvasProviderError("invalid_token", "Canvas token is missing.");
  let response: Response;
  try {
    response = await fetchImpl(canvasApiUrl(base, path, params), { headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  } catch { throw new CanvasProviderError("unavailable", "Canvas is temporarily unavailable."); }
  if (response.ok) {
    try { return { data: await response.json() as T, headers: response.headers }; }
    catch { throw new CanvasProviderError("malformed", "Canvas returned malformed data.", response.status); }
  }
  if (response.status === 401) throw new CanvasProviderError("invalid_token", "Canvas token was rejected.", 401);
  if (response.status === 403) throw new CanvasProviderError("forbidden", "Canvas denied access.", 403);
  if (response.status === 404) throw new CanvasProviderError("not_found", "Canvas resource was not found.", 404);
  if (response.status === 429) throw new CanvasProviderError("rate_limited", "Canvas rate limit reached.", 429);
  throw new CanvasProviderError("unavailable", "Canvas is temporarily unavailable.", response.status);
}

export function nextCanvasPage(headers: Headers): string | null {
  const link = headers.get("link"); if (!link) return null;
  const next = link.split(",").map((part) => /<([^>]+)>;\s*rel="next"/.exec(part)?.[1]).find(Boolean);
  return next ?? null;
}

export async function canvasRequestUrl<T>(url: string, token: string, fetchImpl: typeof fetch = fetch): Promise<{ data: T; headers: Headers }> {
  try {
    const response = await fetchImpl(url, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (response.status === 401) throw new CanvasProviderError("invalid_token", "Canvas token was rejected.", 401);
    if (response.status === 403) throw new CanvasProviderError("forbidden", "Canvas denied access.", 403);
    if (!response.ok) throw new CanvasProviderError(response.status === 429 ? "rate_limited" : "unavailable", "Canvas is temporarily unavailable.", response.status);
    return { data: await response.json() as T, headers: response.headers };
  } catch (error) { if (error instanceof CanvasProviderError) throw error; throw new CanvasProviderError("unavailable", "Canvas is temporarily unavailable."); }
}

export async function canvasPaginated<T>(base: string, token: string, path: string, params: URLSearchParams, maxPages = 20, fetchImpl: typeof fetch = fetch): Promise<CanvasPage<T>> {
  const items: T[] = []; let url: string | null = canvasApiUrl(base, path, params).toString(); let pages = 0;
  while (url && pages < maxPages) { const page = await canvasRequestUrl<T[]>(url, token, fetchImpl); if (!Array.isArray(page.data)) throw new CanvasProviderError("malformed", "Canvas returned malformed list data."); items.push(...page.data); url = nextCanvasPage(page.headers); pages += 1; }
  return { items, truncated: Boolean(url) };
}
