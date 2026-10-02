"use client";

import { useEffect, useState } from "react";

import type { WeatherData } from "@/engines/environment";
import type { CalendarEventCategory } from "@/core/contracts";
import { buildKioskTimeBuckets, filterKioskSchoolAssignments } from "@/services/kiosk/timeBuckets";
import { readSchoolCompletionOverrides } from "@/services/school/completionOverrides";

export interface DeveloperKioskData {
  location: { lat: number; lon: number; label: string } | null;
  weather: WeatherData | null;
  calendar: { events: Array<{ id: string; title: string; start: string; end: string; allDay: boolean; location?: string; calendar?: string; category?: CalendarEventCategory }>; nextEvent?: DeveloperKioskData["calendar"]["events"][number]; todayEvents: DeveloperKioskData["calendar"]["events"]; weekEvents: DeveloperKioskData["calendar"]["events"]; connected: boolean; error?: string };
  school: { assignments: Array<{ id: string; title: string; due: string; course?: string; completed: boolean }>; nextAssignment?: DeveloperKioskData["school"]["assignments"][number]; dueToday: DeveloperKioskData["school"]["assignments"]; dueThisWeek: DeveloperKioskData["school"]["assignments"]; overdueCount: number; sceneState: "clear" | "upcoming" | "urgent" | "overdue" | "unavailable"; connected: boolean; error?: string };
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

let cached: DeveloperKioskData | null = null;
let request: Promise<DeveloperKioskData> | null = null;

export function useDeveloperKioskData() {
  const enabled = typeof window !== "undefined" && window.location.pathname === "/kiosk";
  const [data, setData] = useState<DeveloperKioskData | null>(enabled ? cached : null);
  const [loading, setLoading] = useState(enabled && !cached);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const load = async () => {
      try {
        request ??= fetch("/api/kiosk/data", { cache: "no-store" }).then(async (response) => {
          if (!response.ok) throw new Error("Developer kiosk data is unavailable.");
          return normalizeKioskData(await response.json() as DeveloperKioskData);
        }).then((value) => { cached = value; return value; }).finally(() => { request = null; });
        const value = await request;
        if (active) setData(value);
      } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : "Developer kiosk data is unavailable."); }
      finally { if (active) setLoading(false); }
    };
    void load();
    const timer = window.setInterval(() => { cached = null; void load(); }, 5 * 60_000);
    const completionChanged = () => { cached = null; void load(); };
    window.addEventListener("cosmic:school-completion-changed", completionChanged);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("cosmic:school-completion-changed", completionChanged); };
  }, [enabled]);
  return { data, loading, error };
}
