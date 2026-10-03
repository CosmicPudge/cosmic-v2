export const KIOSK_HEALTH_SERVICES = ["network", "weather", "calendar", "school", "sports", "music"] as const;
export type KioskHealthService = typeof KIOSK_HEALTH_SERVICES[number];
export type KioskConnectionState = "connected" | "reconnecting" | "stale" | "disconnected";

export interface ConnectionHealth {
  state: KioskConnectionState;
  lastSuccessfulAt?: string;
  lastAttemptAt?: string;
  lostAt?: string;
  recoveredAt?: string;
  consecutiveFailures: number;
  staleAgeMs?: number;
  lastErrorCategory?: string;
}

export type ConnectionHealthMap = Record<KioskHealthService, ConnectionHealth>;
export type ConnectionHealthEvent =
  | { type: "attempt"; at: string }
  | { type: "success"; at: string }
  | { type: "failure"; at: string; category?: string }
  | { type: "offline"; at: string }
  | { type: "online"; at: string };

const emptyHealth: ConnectionHealth = { state: "reconnecting", consecutiveFailures: 0 };
const STALE_AFTER_MS = 5 * 60_000;

export function createInitialConnectionHealth(): ConnectionHealthMap {
  return Object.fromEntries(KIOSK_HEALTH_SERVICES.map((service) => [service, { ...emptyHealth }])) as ConnectionHealthMap;
}

export function reduceConnectionHealth(current: ConnectionHealth, event: ConnectionHealthEvent): ConnectionHealth {
  if (event.type === "attempt") {
    return { ...current, lastAttemptAt: event.at, state: current.lostAt || current.state === "stale" ? "reconnecting" : current.state };
  }
  if (event.type === "success") {
    return {
      ...current,
      state: "connected",
      lastSuccessfulAt: event.at,
      lastAttemptAt: event.at,
      recoveredAt: current.lostAt ? event.at : current.recoveredAt,
      lostAt: undefined,
      consecutiveFailures: 0,
      staleAgeMs: 0,
      lastErrorCategory: undefined,
    };
  }
  if (event.type === "online") {
    return { ...current, state: current.lostAt ? "reconnecting" : current.state, lastAttemptAt: event.at };
  }
  const lostAt = current.lostAt ?? event.at;
  return {
    ...current,
    state: event.type === "offline" ? "disconnected" : "disconnected",
    lastAttemptAt: event.at,
    lostAt,
    consecutiveFailures: current.consecutiveFailures + 1,
    lastErrorCategory: event.type === "failure" ? event.category : "network-offline",
  };
}

export function withStaleAges(health: ConnectionHealthMap, now = Date.now()): ConnectionHealthMap {
  return Object.fromEntries(Object.entries(health).map(([service, value]) => [service, {
    ...value,
    state: value.state === "connected" && value.lastSuccessfulAt && now - Date.parse(value.lastSuccessfulAt) > STALE_AFTER_MS ? "stale" : value.state,
    staleAgeMs: value.lastSuccessfulAt ? Math.max(0, now - Date.parse(value.lastSuccessfulAt)) : undefined,
  }])) as ConnectionHealthMap;
}

export function formatKioskHealthTime(value?: string, timeZone?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", ...(timeZone ? { timeZone } : {}) }).format(date);
}

export function formatKioskHealthTimestamp(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
