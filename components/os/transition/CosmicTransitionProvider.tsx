"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useCosmicAccount } from "@/components/account/AccountProvider";
import { useEntitlements } from "@/hooks/os/useEntitlements";
import { useSettingsData } from "@/components/apps/settings/SettingsProvider";
import { useCosmicScope } from "@/services/storage/scope";

export type CosmicTransitionMode = "cold-boot" | "account-switch" | "navigation" | null;
export type CosmicTransitionIntensity = "BOOT" | "HEAVY" | "NORMAL" | "INSTANT";

export interface RouteReadinessEntry {
  route: string;
  label: string;
  critical: string[];
  ready: boolean;
  status: "ready" | "pending" | "degraded";
}

export const ROUTE_READINESS = [
  ["/os", "Dashboard", ["workspace and dashboard layout"]],
  ["/weather", "Weather", ["current conditions or a known unavailable state"]],
  ["/sports", "Sports", ["primary scores or a known unavailable state"]],
  ["/garage", "Garage", ["garage snapshot and vehicle access"]],
  ["/gmail", "Mail", ["connection state and initial inbox frame"]],
  ["/outlook", "Outlook", ["connection state and initial inbox frame"]],
  ["/calendar", "Calendar", ["connection state and visible event window"]],
  ["/finance", "Finance", ["private account-scoped snapshot"]],
  ["/notes", "Notes", ["account-scoped notes snapshot"]],
  ["/projects", "Projects", ["account-scoped projects snapshot"]],
  ["/school", "School", ["account-scoped school snapshot"]],
  ["/music", "Music", ["provider state and now playing"]],
  ["/search", "Search", ["search frame"]],
  ["/settings", "Settings", ["preferences and connections frame"]],
] as const;

interface TransitionContextValue {
  mode: CosmicTransitionMode;
  intensity: CosmicTransitionIntensity;
  pathname: string;
  destination: string;
  bootComplete: boolean;
  bootOffline: boolean;
  reducedMotion: boolean;
  visible: boolean;
  progress: number;
  tasks: Array<{ id: string; label: string; ready: boolean; critical: boolean }>;
  routeEntries: RouteReadinessEntry[];
  markRouteReady: (route: string, status?: "ready" | "degraded") => void;
  setRouteTask: (route: string, ready: boolean, status?: "ready" | "degraded") => void;
  prefetch: (href: string) => void;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

const routeLabel = (pathname: string) => {
  const entry = ROUTE_READINESS.find(([route]) => pathname === route || pathname.startsWith(`${route}/`));
  return entry?.[1] ?? (pathname.startsWith("/admin") ? "Admin" : pathname.startsWith("/support") ? "Support" : "Cosmic");
};

const routeKey = (pathname: string) => ROUTE_READINESS.find(([route]) => pathname === route || pathname.startsWith(`${route}/`))?.[0] ?? pathname;

export function CosmicTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { account, loading: accountLoading } = useCosmicAccount();
  const { loading: entitlementsLoading } = useEntitlements();
  const settings = useSettingsData();
  const scope = useCosmicScope();
  const router = useRouter();
  const [bootComplete, setBootComplete] = useState(false);
  const [bootOffline, setBootOffline] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(false);
  const [routeStates, setRouteStates] = useState<Record<string, { ready: boolean; status: "ready" | "degraded" }>>({});
  const [navigation, setNavigation] = useState<{ from: string; to: string; startedAt: number; accountSwitch: boolean }>();
  const initialPath = useRef(pathname);
  const lastScope = useRef(scope.id);
  const routeStatesRef = useRef(routeStates);

  useEffect(() => { routeStatesRef.current = routeStates; }, [routeStates]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const slow = process.env.NODE_ENV !== "production" && query.get("transitionDebug") === "slow";
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches || settings.data.appearance.reducedEffects);
    updateMotion();
    media.addEventListener("change", updateMotion);
    const offline = () => setBootOffline(true);
    const online = () => setBootOffline(false);
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    if (slow) document.documentElement.dataset.cosmicTransitionSlow = "true";
    return () => {
      media.removeEventListener("change", updateMotion);
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
      delete document.documentElement.dataset.cosmicTransitionSlow;
    };
  }, [settings.data.appearance.reducedEffects]);

  const tasks = useMemo(() => [
    { id: "account", label: "Account", ready: !accountLoading, critical: true },
    { id: "scope", label: "Workspace", ready: !accountLoading && (account ? scope.id === `account-${account.id}` : scope.id === "local"), critical: true },
    { id: "preferences", label: "Preferences", ready: settings.ready, critical: true },
    { id: "entitlements", label: "Access", ready: !entitlementsLoading, critical: true },
    { id: "dashboard", label: "Dashboard", ready: !accountLoading && settings.ready && !entitlementsLoading, critical: true },
  ], [account, accountLoading, entitlementsLoading, scope.id, settings.ready]);

  const criticalReady = tasks.filter((task) => task.critical).every((task) => task.ready);

  useEffect(() => {
    if (bootComplete) return;
    const startedAt = performance.now();
    const minimum = reducedMotion ? 250 : 900;
    const maxTimer = window.setTimeout(() => setBootComplete(true), 7000);
    const finish = () => {
      const remaining = Math.max(0, minimum - (performance.now() - startedAt));
      window.setTimeout(() => setBootComplete(true), remaining);
    };
    if (criticalReady) finish();
    return () => window.clearTimeout(maxTimer);
  }, [bootComplete, criticalReady, reducedMotion]);

  useEffect(() => {
    if (initialPath.current === pathname) return;
    const from = initialPath.current;
    initialPath.current = pathname;
    const accountChanged = lastScope.current !== scope.id;
    lastScope.current = scope.id;
    setNavigation({ from, to: pathname, startedAt: performance.now(), accountSwitch: accountChanged });
    setRouteStates((current) => ({ ...current, [routeKey(pathname)]: { ready: false, status: "ready" } }));
    setVisible(true);
    if (process.env.NODE_ENV !== "production") console.info("[cosmic-transition] start", routeLabel(pathname), accountChanged ? "account-switch" : "navigation");
  }, [pathname, scope.id]);

  useEffect(() => {
    if (initialPath.current !== pathname || lastScope.current === scope.id) return;
    const from = lastScope.current;
    lastScope.current = scope.id;
    setNavigation({ from, to: pathname, startedAt: performance.now(), accountSwitch: true });
    setRouteStates((current) => ({ ...current, [routeKey(pathname)]: { ready: false, status: "ready" } }));
    setVisible(true);
    if (process.env.NODE_ENV !== "production") console.info("[cosmic-transition] start", routeLabel(pathname), "account-switch");
  }, [pathname, scope.id]);

  const markRouteReady = useCallback((route: string, status: "ready" | "degraded" = "ready") => {
    setRouteStates((current) => ({ ...current, [routeKey(route)]: { ready: true, status } }));
  }, []);

  const setRouteTask = useCallback((route: string, ready: boolean, status: "ready" | "degraded" = "ready") => {
    setRouteStates((current) => ({ ...current, [routeKey(route)]: { ready, status } }));
  }, []);

  const prefetch = useCallback((href: string) => {
    if (process.env.NODE_ENV !== "production" && href.startsWith("/dev/")) return;
    router.prefetch(href);
  }, [router]);

  const currentRoute = routeKey(pathname);
  useEffect(() => {
    if (!navigation) return;
    const started = navigation.startedAt;
    const max = window.setTimeout(() => {
      setVisible(false);
      if (process.env.NODE_ENV !== "production") console.info("[cosmic-transition] timeout", routeLabel(pathname));
    }, reducedMotion ? 700 : 1400);
    const settle = window.setTimeout(() => {
      if ((!navigation.accountSwitch || criticalReady) && (routeStatesRef.current[currentRoute]?.ready || !routeStatesRef.current[currentRoute])) {
        setVisible(false);
        if (process.env.NODE_ENV !== "production") console.info("[cosmic-transition] complete", routeLabel(pathname), `${Math.round(performance.now() - started)}ms`);
      }
    }, reducedMotion ? 180 : 320);
    return () => { window.clearTimeout(max); window.clearTimeout(settle); };
  }, [criticalReady, currentRoute, navigation, pathname, reducedMotion]);

  const progress = Math.round((tasks.filter((task) => task.ready).length / tasks.length) * 100);
  const mode: CosmicTransitionMode = !bootComplete ? "cold-boot" : navigation ? (navigation.accountSwitch ? "account-switch" : "navigation") : null;
  const intensity: CosmicTransitionIntensity = mode === "cold-boot" ? "BOOT" : mode === "account-switch" ? "HEAVY" : visible ? "NORMAL" : "INSTANT";
  const routeEntries = ROUTE_READINESS.map(([route, label, critical]) => ({ route, label, critical: [...critical], ready: Boolean(routeStates[route]?.ready), status: routeStates[route]?.status ?? "pending" })) satisfies RouteReadinessEntry[];
  const value = useMemo(() => ({ mode, intensity, pathname, destination: routeLabel(pathname), bootComplete, bootOffline, reducedMotion, visible, progress, tasks, routeEntries, markRouteReady, setRouteTask, prefetch }), [bootComplete, bootOffline, intensity, markRouteReady, mode, pathname, prefetch, progress, reducedMotion, routeEntries, setRouteTask, tasks, visible]);

  return <TransitionContext.Provider value={value}>{children}<CosmicTransitionSurface /></TransitionContext.Provider>;
}

export function useCosmicTransition() {
  const value = useContext(TransitionContext);
  if (!value) throw new Error("useCosmicTransition must be used inside CosmicTransitionProvider.");
  return value;
}

export function useRouteReadiness(route: string, ready = true, status: "ready" | "degraded" = "ready") {
  const { setRouteTask } = useCosmicTransition();
  useEffect(() => { setRouteTask(route, ready, status); }, [ready, route, setRouteTask, status]);
}

function CosmicTransitionSurface() {
  const { mode, destination, bootComplete, bootOffline, reducedMotion, visible, progress, tasks } = useCosmicTransition();
  const showingBoot = !bootComplete;
  if (!showingBoot && !visible) return null;
  return <div className={`cosmic-transition-surface ${showingBoot ? "cosmic-transition-boot" : "cosmic-transition-navigation"} ${reducedMotion ? "cosmic-transition-reduced" : ""}`} role="status" aria-live={showingBoot ? "polite" : "assertive"} aria-label={showingBoot ? "Preparing your Cosmic workspace" : `Opening ${destination}`}>
    <div className="cosmic-transition-stars" aria-hidden="true" />
    <div className="cosmic-transition-content">
      <p className="cosmic-transition-mark" aria-hidden="true">✦</p>
      <p className="cosmic-transition-kicker">COSMIC OS</p>
      <h1>{showingBoot ? "Preparing your workspace" : mode === "account-switch" ? "Switching workspace" : `Opening ${destination}`}</h1>
      <p className="cosmic-transition-copy">{showingBoot ? bootOffline ? "Using your saved Cosmic state while you’re offline." : "Getting the essentials ready…" : "Almost ready…"}</p>
      {showingBoot ? <><div className="cosmic-transition-progress" aria-hidden="true"><span style={{ width: `${Math.max(8, progress)}%` }} /></div><p className="cosmic-transition-count">{tasks.filter((task) => task.ready).length} of {tasks.length} essentials ready</p></> : <p className="cosmic-transition-destination">{destination}</p>}
    </div>
  </div>;
}
