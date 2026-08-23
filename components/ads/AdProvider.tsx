"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAdRuntimeConfig, type AdProviderMode } from "@/core/contracts/Advertising";
import { useEntitlements } from "@/hooks/os/useEntitlements";

interface AdRuntimeState { mode: AdProviderMode; provider: "google-adsense"; eligible: boolean; scriptReady: boolean; consentReady: boolean; reason: string; }
const AdRuntimeContext = createContext<AdRuntimeState>({ mode: "disabled", provider: "google-adsense", eligible: false, scriptReady: false, consentReady: false, reason: "Loading ad configuration." });
export function AdProvider({ children }: { children: React.ReactNode }) {
  const { data } = useEntitlements(); const config = useMemo(() => getAdRuntimeConfig(), []); const [scriptReady, setScriptReady] = useState(false);
  const eligible = data.ads.adEligible && data.ads.thirdPartyAds;
  const consentReady = config.mode === "test" || typeof window !== "undefined" && ("__tcfapi" in window || "__gpp" in window);
  useEffect(() => {
    if (config.mode === "disabled" || !config.enabled || !eligible || config.mode === "placeholder") return;
    if (!consentReady || !config.publisherId || !Object.keys(config.slots).length) return;
    if (document.querySelector("script[data-cosmic-ad-provider]")) return;
    const script = document.createElement("script"); script.async = true; script.crossOrigin = "anonymous"; script.dataset.cosmicAdProvider = "google-adsense"; script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${encodeURIComponent(config.publisherId)}`; script.onload = () => setScriptReady(true); script.onerror = () => setScriptReady(false); document.head.appendChild(script); return () => { /* Singleton remains for document lifetime. */ };
  }, [config, eligible, consentReady]);
  const value = { mode: config.mode, provider: config.provider, eligible, scriptReady, consentReady, reason: !eligible ? "Cosmic+ or an ineligible account has no ad layer." : !config.enabled || config.mode === "disabled" ? "Advertising kill switch is disabled." : config.mode === "placeholder" ? "Development placeholder mode." : !config.publisherId ? "Publisher ID is not configured." : !Object.keys(config.slots).length ? "No provider slot IDs are configured." : !consentReady ? "Provider consent signal is not available." : !scriptReady ? "Provider script is loading or unavailable." : "Configured." };
  return <AdRuntimeContext.Provider value={value}>{children}</AdRuntimeContext.Provider>;
}
export function useAdRuntime() { return useContext(AdRuntimeContext); }
