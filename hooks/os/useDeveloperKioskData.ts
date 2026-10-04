"use client";

import { useEffect, useState } from "react";

import type { WeatherData } from "@/engines/environment";
import type { CalendarEventCategory } from "@/core/contracts";
import { buildKioskTimeBuckets, filterKioskSchoolAssignments } from "@/services/kiosk/timeBuckets";
import { readSchoolCompletionOverrides } from "@/services/school/completionOverrides";
import { useConnectionHealth } from "@/services/kiosk/ConnectionHealthProvider";
import { kioskApiUrl } from "@/services/kioskRequest";
import { readKioskDeviceLocation } from "@/hooks/os/useKioskDeviceLocation";
import { classifyKioskDataHealth } from "@/services/kiosk/dataHealth";
import { traceKioskHealth } from "@/services/kiosk/healthTrace";
import { startKioskResource } from "@/services/kiosk/resourceLifecycle";
import { fetchWithTimeout } from "@/services/kiosk/fetchWithTimeout";

export interface DeveloperKioskData {
  location: { lat: number; lon: number; label: string; source?: "current" | "last-known" | "fallback" | "unavailable"; stale?: boolean } | null;
  weather: WeatherData | null;
  calendar: { events: Array<{ id: string; title: string; start: string; end: string; allDay: boolean; location?: string; calendar?: string; category?: CalendarEventCategory }>; nextEvent?: DeveloperKioskData["calendar"]["events"][number]; todayEvents: DeveloperKioskData["calendar"]["events"]; weekEvents: DeveloperKioskData["calendar"]["events"]; connected: boolean; error?: string; diagnostics?: { category?: string } };
  school: { assignments: Array<{ id: string; title: string; due: string; course?: string; completed: boolean }>; nextAssignment?: DeveloperKioskData["school"]["assignments"][number]; dueToday: DeveloperKioskData["school"]["assignments"]; dueThisWeek: DeveloperKioskData["school"]["assignments"]; overdueCount: number; sceneState: "clear" | "upcoming" | "urgent" | "overdue" | "unavailable"; connected: boolean; error?: string; diagnostics?: { category?: string } };
  refreshDiagnostics?: {
    weather?: { effectiveRefreshMs: number; lastSuccessfulRefreshAt?: string; staleAgeMs?: number; refreshMode: "idle" | "active" | "near-live" | "live" };
    calendar?: { effectiveRefreshMs: number; lastSuccessfulRefreshAt?: string; staleAgeMs?: number; refreshMode: "idle" | "active" | "near-live" | "live" };
    school?: { effectiveRefreshMs: number; lastSuccessfulRefreshAt?: string; staleAgeMs?: number; refreshMode: "idle" | "active" | "near-live" | "live" };
  };
}

interface DeveloperKioskOptions {
  enabled?: boolean;
  poll?: boolean;
}

function normalizeKioskData(value: DeveloperKioskData): DeveloperKioskData {
  const calendarBuckets = buildKioskTimeBuckets(value.calendar.events);
  const overrides = readSchoolCompletionOverrides();
  const schoolAssignments = filterKioskSchoolAssignments(value.school.assignments, overrides);
  const schoolItems = schoolAssignments.map((item) => ({ ...item, start: item.due, end: new Date(new Date(item.due).getTime() + 24 * 60 * 60 * 1000).toISOString() }));
  const schoolBuckets = buildKioskTimeBuckets(schoolItems);
  return {
    ...value,
    calendar: { ...value.calendar, nextEvent: calendarBuckets.next, todayEvents: calendarBuckets.today, weekEvents: calendarBuckets.week },
    school: { ...value.school, assignments: schoolAssignments, nextAssignment: schoolBuckets.next, dueToday: schoolBuckets.today, dueThisWeek: schoolBuckets.week, overdueCount: 0, sceneState: schoolBuckets.next ? "upcoming" : "clear" },
  };
}

function mergeKioskData(previous: DeveloperKioskData | null, next: Partial<DeveloperKioskData>): DeveloperKioskData {
  if (!previous) return next as DeveloperKioskData;
  return {
    ...previous,
    ...next,
    weather: next.weather ?? previous.weather,
    calendar: next.calendar ? { ...previous.calendar, ...next.calendar } : previous.calendar,
    school: next.school ? { ...previous.school, ...next.school } : previous.school,
    refreshDiagnostics: next.refreshDiagnostics ? { ...previous.refreshDiagnostics, ...next.refreshDiagnostics } : previous.refreshDiagnostics,
  };
}

let cached: DeveloperKioskData | null = null;
let request: Promise<DeveloperKioskData> | null = null;
let requestToken = 0;
let lastHealthReportToken = 0;

export function useDeveloperKioskData({ enabled: requestedEnabled, poll = true }: DeveloperKioskOptions = {}) {
  const enabled = (requestedEnabled ?? true) && typeof window !== "undefined" && window.location.pathname === "/kiosk";
  const [data, setData] = useState<DeveloperKioskData | null>(enabled ? cached : null);
  const [loading, setLoading] = useState(enabled && !cached);
  const [error, setError] = useState<string | null>(null);
  const { recordAttempt, recordSuccess, recordFailure } = useConnectionHealth();
  useEffect(() => {
    if (!enabled) return;
    const stopResource = poll ? startKioskResource("kiosk-data") : undefined;
    let active = true;
    const load = async () => {
      try {
        recordAttempt("weather"); recordAttempt("calendar"); recordAttempt("school");
        const prior = cached;
        if (!request) requestToken += 1;
        const currentRequestToken = requestToken;
        const location = readKioskDeviceLocation();
        const locationAge = location?.resolvedAt ? Date.now() - Date.parse(location.resolvedAt) : Number.POSITIVE_INFINITY;
        const locationSource = location && locationAge >= 0 && locationAge <= 15 * 60_000 ? "current" : "last-known";
        const params = new URLSearchParams({ "cosmic-kiosk": "1", "cosmic-boot": new URLSearchParams(window.location.search).get("cosmic-boot") ?? "" });
        if (location) {
          params.set("kioskLat", String(location.latitude));
          params.set("kioskLon", String(location.longitude));
          params.set("kioskLocationAt", location.resolvedAt ?? "");
          params.set("kioskLocationSource", locationSource);
        }
        request ??= fetchWithTimeout(kioskApiUrl(`/api/kiosk/data?${params.toString()}`), { cache: "no-store", credentials: "include" }).then(async (response) => {
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) window.dispatchEvent(new CustomEvent("cosmic:kiosk-auth-needed"));
            throw new Error(response.status === 401 || response.status === 403 ? "Kiosk session renewal is required." : "Developer kiosk data is unavailable.");
          }
          const body = await response.json() as Partial<DeveloperKioskData>;
          for (const service of ["weather", "calendar", "school"] as const) traceKioskHealth(service, "response", { present: body[service] !== undefined });
          return normalizeKioskData(mergeKioskData(prior, body));
        }).then((value) => { cached = value; return value; }).finally(() => { request = null; });
        const value = await request;
        const displayValue: DeveloperKioskData = {
          ...value,
          weather: value.weather ?? prior?.weather ?? null,
          calendar: value.calendar.connected || !prior?.calendar.connected ? value.calendar : { ...prior.calendar, error: value.calendar.error, diagnostics: value.calendar.diagnostics },
          school: value.school.connected || !prior?.school.connected ? value.school : { ...prior.school, error: value.school.error, diagnostics: value.school.diagnostics },
        };
        if (currentRequestToken !== lastHealthReportToken) {
          lastHealthReportToken = currentRequestToken;
          const health = classifyKioskDataHealth(value);
          for (const service of ["weather", "calendar", "school"] as const) traceKioskHealth(service, "classify", { result: health[service] ? "success" : "failure" });
          if (health.weather) recordSuccess("weather"); else recordFailure("weather", "unavailable");
          if (health.calendar) recordSuccess("calendar"); else recordFailure("calendar", value.calendar.diagnostics?.category ?? "provider-error");
          if (health.school) recordSuccess("school"); else recordFailure("school", value.school.diagnostics?.category ?? "provider-error");
        }
        if (active) { setData(displayValue); window.dispatchEvent(new CustomEvent("cosmic:kiosk-data-updated")); }
      } catch (reason) {
        if (requestToken !== lastHealthReportToken) {
          lastHealthReportToken = requestToken;
          recordFailure("weather", "request-error"); recordFailure("calendar", "request-error"); recordFailure("school", "request-error");
        }
        if (active) { setData(cached); setError(reason instanceof Error ? reason.message : "Developer kiosk data is unavailable."); }
      }
      finally { if (active) setLoading(false); }
    };
    if (poll) void load();
    const timer = poll ? window.setInterval(() => { void load(); }, 30_000) : undefined;
    const completionChanged = () => { cached = null; if (poll) void load(); };
    const locationChanged = () => { cached = null; request = null; if (poll) void load(); };
    window.addEventListener("cosmic:school-completion-changed", completionChanged);
    window.addEventListener("cosmic:kiosk-location-changed", locationChanged);
    window.addEventListener("cosmic:kiosk-location-moved", locationChanged);
    const sessionRenewed = () => { if (poll) void load(); };
    window.addEventListener("cosmic:kiosk-session-renewed", sessionRenewed);
    const syncCachedData = () => { if (cached && active) { setData(cached); setLoading(false); setError(null); } };
    const retryWhenOnline = () => { if (poll) void load(); };
    const retryWhenVisible = () => { if (poll && document.visibilityState === "visible") void load(); };
    window.addEventListener("cosmic:kiosk-data-updated", syncCachedData);
    window.addEventListener("online", retryWhenOnline);
    document.addEventListener("visibilitychange", retryWhenVisible);
    return () => { active = false; if (timer !== undefined) window.clearInterval(timer); stopResource?.(); window.removeEventListener("cosmic:school-completion-changed", completionChanged); window.removeEventListener("cosmic:kiosk-location-changed", locationChanged); window.removeEventListener("cosmic:kiosk-location-moved", locationChanged); window.removeEventListener("cosmic:kiosk-session-renewed", sessionRenewed); window.removeEventListener("cosmic:kiosk-data-updated", syncCachedData); window.removeEventListener("online", retryWhenOnline); document.removeEventListener("visibilitychange", retryWhenVisible); };
  }, [enabled, poll, recordAttempt, recordFailure, recordSuccess]);
  return { data, loading, error };
}
