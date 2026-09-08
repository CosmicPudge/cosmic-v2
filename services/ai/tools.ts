import "server-only";
import type { CosmicAIPermissions } from "@/core/contracts/AI";
import type { CosmicAccount } from "@/core/contracts/Account";
import type { CalendarEvent } from "@/core/contracts/Calendar";
import { getEnvironment } from "@/engines/environment";
import { calendarRangeForRequest, serializeAccountSettings, serializeSportsEvent, serializeWeatherData } from "./deterministic";
import { getCalendarEngineForRequest } from "@/services/calendar/accountProvider";
import { recordToolMetric } from "@/services/observability/metrics";
import { getSportsSnapshot } from "@/services/sports/snapshot";
import { prioritizeFollowedEvents } from "@/services/sports/preferences";
import { getAccountPreferences } from "@/services/settings/accountPreferences";
import { neutralPreferences } from "@/services/settings/preferences";
import { readCloudSnapshot } from "@/services/sync/repository";
import { validateFinanceSync, validateGarageSync, validateNotesSync, validateProjectsSync, validateSchoolSync } from "@/services/sync/validation";
import { getSchoolSnapshotForAccount } from "@/services/school/server";

export const aiToolDefinitions = [
  { name: "private_summary", description: "Read a bounded summary from an explicitly permitted Cosmic module." },
  { name: "public_web_search", description: "Search the public web for current information." },
  { name: "current_weather", description: "Read current weather for a supplied location." },
  { name: "sports_lookup", description: "Read current sports events and favorite-team context." },
  { name: "calendar_lookup", description: "Read a bounded range of the authenticated account calendar." },
  { name: "account_settings", description: "Read safe account settings for the authenticated account." },
] as const;

const labels = { finance: "Finance", garage: "Garage", notes: "Notes", projects: "Projects", school: "School" } as const;
type PrivateModule = keyof typeof labels;
function count(value: unknown, key: string) { return Array.isArray(value) ? value.length : value && typeof value === "object" && key in value && Array.isArray((value as Record<string, unknown>)[key]) ? ((value as Record<string, unknown>)[key] as unknown[]).length : 0; }

type ToolArgs = { module?: string; query?: string; latitude?: number; longitude?: number; locationLabel?: string; startDate?: string; endDate?: string; sport?: string; eventId?: string };
function unavailable(code: string, reason: string) { return { available: false, code, reason }; }

async function executeCurrentWeather(args: ToolArgs) {
  const latitude = args.latitude; const longitude = args.longitude;
  if (typeof latitude !== "number" || !Number.isFinite(latitude) || typeof longitude !== "number" || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return unavailable("location_required", "A valid location is required for current weather.");
  try {
    const weather = await getEnvironment(latitude, longitude);
    return serializeWeatherData(weather, args.locationLabel);
  } catch { return unavailable("provider_unavailable", "Current weather is temporarily unavailable."); }
}

async function executeSportsLookup(args: ToolArgs, accountId: string) {
  let preferences = neutralPreferences; let preferencesAvailable = false;
  if (process.env.DATABASE_URL) { try { preferences = await getAccountPreferences(accountId); preferencesAvailable = true; } catch { return unavailable("database_unavailable", "Sports preferences are temporarily unavailable."); } }
  try {
    const snapshot = await getSportsSnapshot(new Date(), preferences);
    const all = [...snapshot.live, ...snapshot.upcoming, ...snapshot.recent]; const query = String(args.query ?? "").toLowerCase();
    const terms = query.split(/\s+/).filter((term) => term.length >= 3); const filtered = args.eventId ? all.filter((event) => event.id === args.eventId) : all.filter((event) => !query || terms.some((term) => `${event.title} ${event.homeTeam?.name ?? ""} ${event.awayTeam?.name ?? ""} ${event.sport}`.toLowerCase().includes(term)));
    const ordered = prioritizeFollowedEvents(filtered, preferences); const events = [...ordered, ...filtered.filter((event) => !ordered.includes(event))].filter((event, index, list) => list.findIndex((item) => item.id === event.id) === index).slice(0, 12);
    const standings = /standings/i.test(query) ? Object.fromEntries(Object.entries(snapshot.standings).map(([sport, rows]) => [sport, rows.slice(0, 10).map((row) => ({ rank: row.rank, name: row.name, team: row.team }))])) : undefined;
    return { available: true, preferencesAvailable, events: events.map((event) => serializeSportsEvent(event, preferences)), ...(standings ? { standings } : {}) };
  } catch { return unavailable("provider_unavailable", "Sports data is temporarily unavailable."); }
}

function serializeCalendarEvent(event: CalendarEvent) { return { title: event.title, start: event.start.toISOString(), end: event.end.toISOString(), location: event.location, allDay: event.allDay, category: event.category, source: event.source, readOnly: event.readOnly }; }

async function executeCalendarLookup(args: ToolArgs, accountId: string) {
  const range = calendarRangeForRequest(args.query, new Date(), args.startDate, args.endDate); if (!range.valid) return unavailable("validation", range.reason);
  try { const context = await getCalendarEngineForRequest(accountId); if (!context) return unavailable("not_connected", "No calendar is connected."); const events = (await context.engine.getEvents({ start: range.start, end: range.end })).sort((a, b) => a.start.getTime() - b.start.getTime()).slice(0, 50); return { available: true, range: { start: range.start.toISOString(), end: range.end.toISOString() }, events: events.map(serializeCalendarEvent) }; } catch { return unavailable("database_unavailable", "Calendar is temporarily unavailable."); }
}

async function executeAccountSettings(account: CosmicAccount | undefined, accountId: string) {
  if (!account) return unavailable("authentication_required", "Account settings require authentication.");
  let preferences = neutralPreferences; let preferencesAvailable = false;
  if (process.env.DATABASE_URL) { try { preferences = await getAccountPreferences(accountId); preferencesAvailable = true; } catch { return unavailable("database_unavailable", "Account settings are temporarily unavailable."); } }
  return serializeAccountSettings(account, preferences, preferencesAvailable);
}

function toolErrorCategory(result: unknown) { const code = result && typeof result === "object" && "code" in result ? String((result as { code?: unknown }).code) : ""; return code === "database_unavailable" ? "connection" : code === "location_required" || code === "validation" ? "validation" : code === "provider_unavailable" ? "upstream" : "unknown"; }

export async function executeAITool(name: string, args: ToolArgs, accountId: string, permissions: CosmicAIPermissions, account?: CosmicAccount) {
  const started = performance.now();
  const finish = (result: unknown) => { const failed = result && typeof result === "object" && ((result as { available?: boolean }).available === false || (result as { blocked?: boolean }).blocked === true); recordToolMetric({ tool: name, durationMs: performance.now() - started, success: !failed, ...(failed ? { errorCategory: toolErrorCategory(result) as "connection" | "validation" | "upstream" | "unknown" } : {}) }); return result; };
  if (name === "current_weather") return finish(await executeCurrentWeather(args));
  if (name === "sports_lookup") return finish(await executeSportsLookup(args, accountId));
  if (name === "calendar_lookup") { if (!permissions.modules.calendar) return finish({ blocked: true, reason: "Calendar access is not enabled in AI Settings." }); return finish(await executeCalendarLookup(args, accountId)); }
  if (name === "account_settings") return finish(await executeAccountSettings(account, accountId));
  if (name === "public_web_search") {
    if (!permissions.modules.publicWeb) return finish({ blocked: true, reason: "Public web access is disabled in AI Settings." });
    const key = process.env.TAVILY_API_KEY; if (!key) return finish({ available: false, reason: "Public web search is not configured." });
    const query = String(args.query || "").slice(0, 400); if (!query) return finish({ available: false, reason: "A search query is required." });
    const response = await fetch("https://api.tavily.com/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: key, query, search_depth: "basic", max_results: 5, include_answer: false }), signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return finish({ available: false, reason: "Public search is temporarily unavailable." });
    const data = await response.json() as { results?: Array<{ title?: string; url?: string; content?: string }> };
    return finish({ available: true, results: (data.results ?? []).slice(0, 5).map((item) => ({ title: String(item.title || "Untitled").slice(0, 200), url: String(item.url || "").slice(0, 500), snippet: String(item.content || "").slice(0, 800) })) });
  }
  if (name !== "private_summary") return finish({ available: false, reason: "Tool unavailable." });
  const selectedModule = args.module as PrivateModule; if (!(selectedModule in labels) || !permissions.modules[selectedModule]) return finish({ blocked: true, reason: `${labels[selectedModule as PrivateModule] || "This module"} access is not enabled in AI Settings.` });
  if (selectedModule === "school") {
    const snapshot = await getSchoolSnapshotForAccount(accountId);
    return finish({
      available: snapshot.sourceStatus?.canvas !== "error",
      module: selectedModule,
      sourceStatus: snapshot.sourceStatus,
      courses: snapshot.courses.slice(0, 20).map((course) => ({ id: course.id, name: course.name, start: course.start.toISOString(), end: course.end.toISOString(), location: course.location })),
      assignments: snapshot.assignments.slice(0, 50).map((assignment) => ({ id: assignment.id, title: assignment.title, due: assignment.due.toISOString(), status: assignment.completed ? "completed" : "upcoming", priority: assignment.priority })),
      events: snapshot.events.slice(0, 50).map((event) => ({ id: event.id, title: event.title, type: event.type, start: event.start.toISOString(), end: event.end.toISOString(), location: event.location })),
      planningAssignments: (snapshot.planningAssignments ?? []).slice(0, 50).map((item) => ({ id: item.id, title: item.title, courseName: item.courseName, dueAt: item.dueAt?.toISOString(), status: item.completionStatus, planningStatus: item.planningStatus, priority: item.priority, estimatedMinutes: item.estimatedMinutes, sourceType: item.sourceType })),
      planningRecommendations: (snapshot.planningRecommendations ?? []).slice(0, 10),
      conflicts: (snapshot.conflicts ?? []).slice(0, 20),
      contextPolicy: "Use approved normalized School data. Unresolved conflicts are advisory only; do not choose between conflicting values without user confirmation.",
      notes: (snapshot.notes ?? []).slice(0, 15).map((note) => ({ id: note.id, title: note.title, courseId: note.courseId, content: note.content, topics: note.topics, sourceId: note.sourceId, provenance: note.provenance })),
      topics: (snapshot.topics ?? []).slice(0, 30),
      requirements: (snapshot.requirements ?? []).slice(0, 30),
      importantFacts: (snapshot.importantFacts ?? []).slice(0, 30),
      coursePlans: (snapshot.coursePlans ?? []).slice(0, 10),
    });
  }
  const row = await readCloudSnapshot(accountId, selectedModule); if (!row) return finish({ available: false, module: selectedModule, reason: "No cloud snapshot is available." });
  const validators = { finance: validateFinanceSync, garage: validateGarageSync, notes: validateNotesSync, projects: validateProjectsSync, school: validateSchoolSync } as const;
  if (!validators[selectedModule](row.snapshot)) return finish({ available: false, module: selectedModule, reason: "The stored snapshot failed validation." });
  const snapshot = row.snapshot as unknown as Record<string, unknown>;
  return finish({ available: true, module: selectedModule, freshness: row.updatedAt, counts: Object.fromEntries(Object.keys(snapshot).filter((key) => Array.isArray(snapshot[key])).slice(0, 10).map((key) => [key, count(snapshot[key], key)])) });
}
