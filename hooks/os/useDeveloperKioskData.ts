"use client";

import { useEffect, useState } from "react";

import type { WeatherData } from "@/engines/environment";
import type { CalendarEventCategory } from "@/core/contracts";
import { buildKioskTimeBuckets, filterKioskSchoolAssignments } from "@/services/kiosk/timeBuckets";
import { readSchoolCompletionOverrides } from "@/services/school/completionOverrides";
import { useConnectionHealth } from "@/services/kiosk/ConnectionHealthProvider";
import { kioskApiUrl } from "@/services/kioskRequest";
import { readKioskDeviceLocation } from "@/hooks/os/useKioskDeviceLocation";

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

export function useDeveloperKioskData() {
  const enabled = typeof window !== "undefined" && window.location.pathname === "/kiosk";
  const [data, setData] = useState<DeveloperKioskData | null>(enabled ? cached : null);
  const [loading, setLoading] = useState(enabled && !cached);
  const [error, setError] = useState<string | null>(null);
  const { recordAttempt, recordSuccess, recordFailure } = useConnectionHealth();
  useEffect(() => {
    if (!enabled) return;
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
        request ??= fetch(kioskApiUrl(`/api/kiosk/data?${params.toString()}`), { cache: "no-store", credentials: "include" }).then(async (response) => {
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) window.dispatchEvent(new CustomEvent("cosmic:kiosk-auth-needed"));
            throw new Error(response.status === 401 || response.status === 403 ? "Kiosk session renewal is required." : "Developer kiosk data is unavailable.");
          }
          return normalizeKioskData(mergeKioskData(prior, await response.json() as Partial<DeveloperKioskData>));
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
          if (value.weather) recordSuccess("weather"); else recordFailure("weather", "unavailable");
          if (value.calendar.connected) recordSuccess("calendar"); else recordFailure("calendar", value.calendar.diagnostics?.category ?? "provider-error");
          if (value.school.connected) recordSuccess("school"); else recordFailure("school", value.school.diagnostics?.category ?? "provider-error");
        }
        if (active) setData(displayValue);
      } catch (reason) {
        if (requestToken !== lastHealthReportToken) {
          lastHealthReportToken = requestToken;
          recordFailure("weather", "request-error"); recordFailure("calendar", "request-error"); recordFailure("school", "request-error");
        }
        if (active) { setData(cached); setError(reason instanceof Error ? reason.message : "Developer kiosk data is unavailable."); }
      }
      finally { if (active) setLoading(false); }
    };
    void load();
    const timer = window.setInterval(() => { void load(); }, 30_000);
    const completionChanged = () => { cached = null; void load(); };
    const locationChanged = () => { cached = null; request = null; void load(); };
    window.addEventListener("cosmic:school-completion-changed", completionChanged);
    window.addEventListener("cosmic:kiosk-location-changed", locationChanged);
    window.addEventListener("cosmic:kiosk-location-moved", locationChanged);
    const sessionRenewed = () => { void load(); };
    window.addEventListener("cosmic:kiosk-session-renewed", sessionRenewed);
    const retryWhenOnline = () => { void load(); };
    const retryWhenVisible = () => { if (document.visibilityState === "visible") void load(); };
    window.addEventListener("online", retryWhenOnline);
    document.addEventListener("visibilitychange", retryWhenVisible);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("cosmic:school-completion-changed", completionChanged); window.removeEventListener("cosmic:kiosk-location-changed", locationChanged); window.removeEventListener("cosmic:kiosk-location-moved", locationChanged); window.removeEventListener("cosmic:kiosk-session-renewed", sessionRenewed); window.removeEventListener("online", retryWhenOnline); document.removeEventListener("visibilitychange", retryWhenVisible); };
  }, [enabled, recordAttempt, recordFailure, recordSuccess]);
  return { data, loading, error };
}
