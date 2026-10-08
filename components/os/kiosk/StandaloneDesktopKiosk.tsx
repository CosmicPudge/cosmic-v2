"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import useKioskDeviceLocation from "@/hooks/os/useKioskDeviceLocation";
import { DashboardReadinessProvider } from "@/components/dashboard/readiness/DashboardReadiness";
import KioskAmbientFrame from "./KioskAmbientFrame";
import KioskSlideshow from "./KioskSlideshow";
import { KioskRuntimeProvider } from "./KioskRuntimeContext";
import { ConnectionHealthProvider } from "@/services/kiosk/ConnectionHealthProvider";
import KioskDiagnosticsView from "./KioskDiagnosticsView";
import { isKioskDiagnosticsRequested, kioskDiagnosticsRenderState } from "./kioskDiagnosticsPolicy";
import CosmosKioskLoadingScreen from "./CosmosKioskLoadingScreen";

export default function StandaloneDesktopKiosk() {
  const searchParams = useSearchParams();
  const [runtimeReady, setRuntimeReady] = useState(false);
  const diagnosticsRequested = isKioskDiagnosticsRequested(searchParams, "dev.cosmicpudge.shop");
  const renderState = kioskDiagnosticsRenderState(diagnosticsRequested, runtimeReady);
  useKioskDeviceLocation();
  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    let inFlight = false;
    const heartbeat = async () => {
      if (stopped || inFlight) return;
      inFlight = true;
      try {
        await fetch("http://127.0.0.1:8766/heartbeat", { method: "GET", mode: "no-cors", cache: "no-store", credentials: "omit" });
      } catch { /* The external watchdog owns recovery when the renderer cannot heartbeat. */ }
      finally {
        inFlight = false;
        if (!stopped) timer = window.setTimeout(() => void heartbeat(), 10_000);
      }
    };
    void heartbeat();
    return () => { stopped = true; if (timer !== undefined) window.clearTimeout(timer); };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.cosmicKiosk = "true";
    document.body.dataset.cosmicKiosk = "true";
    return () => { delete document.documentElement.dataset.cosmicKiosk; delete document.body.dataset.cosmicKiosk; };
  }, []);
  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    const diagnostics = hostname === "dev.cosmicpudge.shop" || hostname === "localhost" || hostname === "127.0.0.1";
    const log = (message: string) => { if (diagnostics) console.info(`[kiosk-auth] ${message}`); };
    const bootId = new URLSearchParams(window.location.search).get("cosmic-boot")?.trim() ?? "";
    if (!bootId) { log("standalone-handoff skipped reason=no_boot_id"); return; }
    let stopped = false;
    let retryTimer: number | undefined;
    let retryDelay = 5_000;
    let attemptInFlight = false;
    const scheduleRetry = () => {
      if (stopped || retryTimer !== undefined) return;
      log("retry scheduled=true");
      retryTimer = window.setTimeout(() => { retryTimer = undefined; void attempt(); }, retryDelay);
      retryDelay = Math.min(60_000, retryDelay * 2);
    };
    const attempt = async () => {
      if (stopped || attemptInFlight) return;
      attemptInFlight = true;
      log("helper-status attempted");
      try {
        const helper = await fetch("http://127.0.0.1:8765/v1/browser-handoff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bootId }), credentials: "omit", cache: "no-store" });
        const body = await helper.json().catch(() => null) as { state?: string; handoffToken?: string } | null;
        log(`helper-handoff status=${helper.status} state=${body?.state ?? "none"} tokenIssued=${Boolean(body?.handoffToken)}`);
        if (!helper.ok || !body?.handoffToken) { scheduleRetry(); return; }
        log("handoff redemption attempted");
        const redemption = await fetch("/api/devices/handoff/consume", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bootId, handoffToken: body.handoffToken }), credentials: "include", cache: "no-store" });
        log(`redeem status=${redemption.status}`);
        if (!redemption.ok) { log("sessionEstablished=false"); scheduleRetry(); return; }
        const session = await fetch(`/api/account/session?cosmic-kiosk=1&cosmic-boot=${encodeURIComponent(bootId)}`, { credentials: "include", cache: "no-store" });
        const sessionBody = await session.json().catch(() => null) as { authenticated?: boolean; sessionType?: string; authenticatedBootId?: string } | null;
        const sessionEstablished = session.ok && sessionBody?.authenticated === true && sessionBody.sessionType === "device" && sessionBody.authenticatedBootId === bootId;
        log(`sessionEstablished=${sessionEstablished} bootMatch=${sessionBody?.authenticatedBootId === bootId}`);
        if (sessionEstablished) {
          retryDelay = 5_000;
          setRuntimeReady(true);
          window.dispatchEvent(new CustomEvent("cosmic:kiosk-session-renewed"));
        }
        else scheduleRetry();
      } catch {
        log("helper-status failed category=unreachable");
        scheduleRetry();
      } finally {
        attemptInFlight = false;
      }
    };
    const requestRenewal = () => { setRuntimeReady(false); void attempt(); };
    window.addEventListener("cosmic:kiosk-auth-needed", requestRenewal);
    void attempt();
    return () => { stopped = true; setRuntimeReady(false); if (retryTimer !== undefined) window.clearTimeout(retryTimer); window.removeEventListener("cosmic:kiosk-auth-needed", requestRenewal); };
  }, []);
  return (
    <div className="fixed inset-0 z-[100] h-[100dvh] w-[100dvw] overflow-hidden bg-[#02040e] text-white" data-desktop-kiosk>
      <KioskRuntimeProvider ready={runtimeReady}>
        {renderState === "establishing-session" ? <CosmosKioskLoadingScreen label="Connecting your display" /> : null}
        {renderState === "diagnostics" ? <KioskDiagnosticsView /> : null}
        {renderState === "normal" ? <ConnectionHealthProvider><DashboardReadinessProvider criticalWidgetIds={[]}><KioskAmbientFrame><KioskSlideshow /></KioskAmbientFrame></DashboardReadinessProvider></ConnectionHealthProvider> : null}
      </KioskRuntimeProvider>
      <span className="sr-only">Cosmic developer kiosk presentation.</span>
    </div>
  );
}
