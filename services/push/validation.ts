export interface ValidPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

const MAX_ENDPOINT_LENGTH = 2_048;
const MAX_KEY_LENGTH = 512;

export function parsePushSubscription(value: unknown): ValidPushSubscription | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const input = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (typeof input.endpoint !== "string" || input.endpoint.length === 0 || input.endpoint.length > MAX_ENDPOINT_LENGTH) return null;
  let endpoint: URL;
  try { endpoint = new URL(input.endpoint); } catch { return null; }
  if (endpoint.protocol !== "https:") return null;
  if (typeof input.keys?.p256dh !== "string" || input.keys.p256dh.length === 0 || input.keys.p256dh.length > MAX_KEY_LENGTH) return null;
  if (typeof input.keys.auth !== "string" || input.keys.auth.length === 0 || input.keys.auth.length > MAX_KEY_LENGTH) return null;
  return { endpoint: input.endpoint, keys: { p256dh: input.keys.p256dh, auth: input.keys.auth } };
}

export function safeDeviceLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const label = value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 120);
  return label || null;
}
