"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createInitialConnectionHealth,
  KIOSK_HEALTH_SERVICES,
  reduceConnectionHealth,
  withStaleAges,
  type ConnectionHealthMap,
  type KioskHealthService,
} from "./connectionHealth";

const STORAGE_KEY = "cosmic:kiosk-connection-health:v1";
const MAX_PERSISTED_AGE_MS = 7 * 24 * 60 * 60_000;

interface ConnectionHealthContextValue {
  health: ConnectionHealthMap;
  recordAttempt(service: KioskHealthService): void;
  recordSuccess(service: KioskHealthService): void;
  recordFailure(service: KioskHealthService, category?: string): void;
}

const ConnectionHealthContext = createContext<ConnectionHealthContextValue | null>(null);
const EMPTY_HEALTH_CONTEXT: ConnectionHealthContextValue = {
  health: createInitialConnectionHealth(),
  recordAttempt: () => undefined,
  recordSuccess: () => undefined,
  recordFailure: () => undefined,
};

function readPersisted(): ConnectionHealthMap {
  if (typeof window === "undefined") return createInitialConnectionHealth();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<ConnectionHealthMap> | null;
    const initial = createInitialConnectionHealth();
    for (const service of KIOSK_HEALTH_SERVICES) {
      const value = parsed?.[service];
      if (!value || typeof value !== "object") continue;
      const last = Date.parse(value.lostAt ?? value.lastSuccessfulAt ?? "");
      if (Number.isFinite(last) && Date.now() - last <= MAX_PERSISTED_AGE_MS) initial[service] = { ...initial[service], ...value };
    }
    return withStaleAges(initial);
  } catch {
    return createInitialConnectionHealth();
  }
}

export function ConnectionHealthProvider({ children }: { children: React.ReactNode }) {
  const [health, setHealth] = useState<ConnectionHealthMap>(() => readPersisted());
  const update = useCallback((service: KioskHealthService, event: Parameters<typeof reduceConnectionHealth>[1]) => {
    setHealth((current) => {
      const previous = current[service];
      const next = reduceConnectionHealth(previous, event);
      if (process.env.NODE_ENV !== "production" && previous.state !== next.state) {
        console.info(`[kiosk-health] service=${service} event=${event.type} previous=${previous.state} next=${next.state} failures=${next.consecutiveFailures}`);
      }
      return { ...current, [service]: next };
    });
  }, []);
  const recordAttempt = useCallback((service: KioskHealthService) => update(service, { type: "attempt", at: new Date().toISOString() }), [update]);
  const recordSuccess = useCallback((service: KioskHealthService) => {
    const at = new Date().toISOString();
    update(service, { type: "success", at });
    if (service !== "network") update("network", { type: "success", at });
  }, [update]);
  const recordFailure = useCallback((service: KioskHealthService, category?: string) => update(service, { type: "failure", at: new Date().toISOString(), category }), [update]);

  useEffect(() => {
    const persist = () => window.localStorage.setItem(STORAGE_KEY, JSON.stringify(health));
    try { persist(); } catch { /* Storage is optional on kiosk browsers. */ }
  }, [health]);

  useEffect(() => {
    const offline = () => {
      const at = new Date().toISOString();
      setHealth((current) => Object.fromEntries(KIOSK_HEALTH_SERVICES.map((service) => [service, reduceConnectionHealth(current[service], { type: "offline", at })])) as ConnectionHealthMap);
    };
    const online = () => {
      const at = new Date().toISOString();
      setHealth((current) => Object.fromEntries(KIOSK_HEALTH_SERVICES.map((service) => [service, reduceConnectionHealth(current[service], { type: "online", at })])) as ConnectionHealthMap);
    };
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    if (!navigator.onLine) offline();
    return () => { window.removeEventListener("offline", offline); window.removeEventListener("online", online); };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setHealth((current) => withStaleAges(current)), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const value = useMemo(() => ({ health: withStaleAges(health), recordAttempt, recordSuccess, recordFailure }), [health, recordAttempt, recordFailure, recordSuccess]);
  return <ConnectionHealthContext.Provider value={value}>{children}</ConnectionHealthContext.Provider>;
}

export function useConnectionHealth() {
  return useContext(ConnectionHealthContext) ?? EMPTY_HEALTH_CONTEXT;
}
