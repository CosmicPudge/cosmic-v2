"use client";

import { useEffect } from "react";
import { formatKioskHealthTime, type KioskHealthService } from "@/services/kiosk/connectionHealth";
import { useConnectionHealth } from "@/services/kiosk/ConnectionHealthProvider";
import { traceKioskHealth } from "@/services/kiosk/healthTrace";

export default function KioskConnectionStatus({ service, lastUpdated }: { service: KioskHealthService; lastUpdated?: string }) {
  const { health } = useConnectionHealth();
  const current = health[service];
  useEffect(() => {
    traceKioskHealth(service, `consumer-${service}`, { status: current.state });
  }, [current.state, service]);
  if (current.state === "connected") return null;
  if (current.state === "reconnecting") return <span className="kiosk-connection-status is-reconnecting">Reconnecting…</span>;
  const lostAt = formatKioskHealthTime(current.lostAt) ?? "unknown time";
  const updatedAt = formatKioskHealthTime(lastUpdated ?? current.lastSuccessfulAt);
  if (current.state === "stale") return <span className="kiosk-connection-status is-stale">Showing a stale update{updatedAt ? ` from ${updatedAt}` : ""} · reconnecting…</span>;
  return <span className="kiosk-connection-status is-stale">Connection lost at {lostAt}{updatedAt ? ` · Showing last update from ${updatedAt}` : ""}</span>;
}
