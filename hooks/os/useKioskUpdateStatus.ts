"use client";

import { useEffect, useState } from "react";
import type { CosmicUpdateStatus } from "@/core/contracts/Updates";

export function useKioskUpdateStatus() {
  const [status, setStatus] = useState<CosmicUpdateStatus | null>(null);
  useEffect(() => {
    if (window.location.pathname !== "/kiosk") return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch("/api/kiosk/data", { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const body = await response.json() as { cosmicUpdate?: CosmicUpdateStatus };
        if (body.cosmicUpdate) setStatus(body.cosmicUpdate);
      } catch { /* Kiosk remains usable when update metadata is unavailable. */ }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5 * 60_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);
  return status;
}
