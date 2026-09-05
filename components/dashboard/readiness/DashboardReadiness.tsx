"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CosmicSettingsLocalData } from "@/core/contracts/Settings";
import type { DisplayProfile } from "@/components/os/display";
import { dashboardWidgets } from "@/config/widgets";
import { WIDGET_REGISTRY } from "@/components/dashboard/layout/widgetRegistry";
import { GRID_PROFILES } from "@/components/dashboard/grid/gridProfiles";

export type DashboardWidgetReadiness = "loading" | "ready" | "degraded";

export interface DashboardReadinessSnapshot {
  shellReady: boolean;
  criticalReady: boolean;
  widgets: Array<{ id: string; status: DashboardWidgetReadiness; critical: boolean }>;
  shellMountedAt: number | null;
  criticalSettledAt: number | null;
}

interface DashboardReadinessContextValue extends DashboardReadinessSnapshot {
  setWidgetReadiness: (id: string, status: DashboardWidgetReadiness) => void;
}

const DashboardReadinessContext = createContext<DashboardReadinessContextValue | null>(null);

function activeWidgets(settings: CosmicSettingsLocalData) {
  const moduleByWidget: Record<string, keyof typeof settings.preferences.modules | undefined> = { sports: "sports", finance: "finance", school: "school", garage: "garage", projects: "projects", notes: "notes", calendar: "calendar", outlook: "mail" };
  return dashboardWidgets.filter((widget) => WIDGET_REGISTRY.some((entry) => entry.id === widget.id && entry.enabled) && (settings.preferences.dashboard.visibleWidgets.length === 0 || settings.preferences.dashboard.visibleWidgets.includes(widget.id)) && (moduleByWidget[widget.id] ? settings.preferences.modules[moduleByWidget[widget.id]!] : true)).sort((left, right) => {
    const leftIndex = settings.preferences.dashboard.widgetOrder.indexOf(left.id);
    const rightIndex = settings.preferences.dashboard.widgetOrder.indexOf(right.id);
    if (leftIndex >= 0 || rightIndex >= 0) return (leftIndex < 0 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex < 0 ? Number.MAX_SAFE_INTEGER : rightIndex);
    return left.priority - right.priority;
  });
}

export function getCriticalDashboardWidgetIds(settings: CosmicSettingsLocalData, profile: DisplayProfile, height: number, schoolEnabled = true) {
  const grid = GRID_PROFILES[profile];
  const reservedViewport = profile === "pocket" ? 500 : profile === "compact" ? 540 : profile === "comfortable" ? 600 : 660;
  const visibleRows = Math.max(1, Math.floor((height - reservedViewport) / grid.rowHeight));
  const ids: string[] = ["hero-weather"];
  let row = 0;
  let column = 0;
  for (const widget of activeWidgets(settings).filter((item) => item.id !== "school" || schoolEnabled)) {
    const cols = profile === "pocket" ? 1 : Math.min(widget.cols, profile === "compact" ? 3 : 4);
    if (column + cols > grid.columns) { row += 1; column = 0; }
    if (row >= visibleRows) break;
    ids.push(widget.id);
    column += cols;
    if (column >= grid.columns) { row += 1; column = 0; }
  }
  return ids;
}

export function DashboardReadinessProvider({ criticalWidgetIds, children }: { criticalWidgetIds: string[]; children: ReactNode }) {
  const [statuses, setStatuses] = useState<Record<string, DashboardWidgetReadiness>>({});
  const [shellMountedAt, setShellMountedAt] = useState<number | null>(null);
  const [criticalSettledAt, setCriticalSettledAt] = useState<number | null>(null);
  const setWidgetReadiness = useCallback((id: string, status: DashboardWidgetReadiness) => setStatuses((current) => current[id] === status ? current : { ...current, [id]: status }), []);
  useEffect(() => { const frame = window.requestAnimationFrame(() => setShellMountedAt(performance.now())); return () => window.cancelAnimationFrame(frame); }, []);
  const criticalReady = criticalWidgetIds.every((id) => statuses[id] === "ready" || statuses[id] === "degraded");
  useEffect(() => { const frame = window.requestAnimationFrame(() => setCriticalSettledAt(criticalReady ? performance.now() : null)); return () => window.cancelAnimationFrame(frame); }, [criticalReady]);
  const widgets = useMemo(() => criticalWidgetIds.map((id) => ({ id, status: statuses[id] ?? "loading", critical: true })), [criticalWidgetIds, statuses]);
  const value = useMemo(() => ({ shellReady: shellMountedAt !== null, criticalReady, widgets, shellMountedAt, criticalSettledAt, setWidgetReadiness }), [criticalReady, criticalSettledAt, shellMountedAt, setWidgetReadiness, widgets]);
  return <DashboardReadinessContext.Provider value={value}>{children}</DashboardReadinessContext.Provider>;
}

export function useDashboardReadiness() {
  const value = useContext(DashboardReadinessContext);
  if (!value) throw new Error("useDashboardReadiness must be used inside DashboardReadinessProvider.");
  return value;
}

export function useDashboardWidgetReadiness(id: string, status: DashboardWidgetReadiness | null) {
  const { setWidgetReadiness } = useDashboardReadiness();
  useEffect(() => { if (status) setWidgetReadiness(id, status); }, [id, setWidgetReadiness, status]);
}
