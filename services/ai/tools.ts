import "server-only";
import type { CosmicAIPermissions } from "@/core/contracts/AI";
import { readCloudSnapshot } from "@/services/sync/repository";
import { validateFinanceSync, validateGarageSync, validateNotesSync, validateProjectsSync, validateSchoolSync } from "@/services/sync/validation";
import { getSchoolSnapshotForAccount } from "@/services/school/server";

export const aiToolDefinitions = [
  { name: "private_summary", description: "Read a bounded summary from an explicitly permitted Cosmic module." },
  { name: "public_web_search", description: "Search the public web for current information." },
] as const;

const labels = { finance: "Finance", garage: "Garage", notes: "Notes", projects: "Projects", school: "School" } as const;
type PrivateModule = keyof typeof labels;
function count(value: unknown, key: string) { return Array.isArray(value) ? value.length : value && typeof value === "object" && key in value && Array.isArray((value as Record<string, unknown>)[key]) ? ((value as Record<string, unknown>)[key] as unknown[]).length : 0; }

export async function executeAITool(name: string, args: { module?: string; query?: string }, accountId: string, permissions: CosmicAIPermissions) {
  if (name === "public_web_search") {
    if (!permissions.modules.publicWeb) return { blocked: true, reason: "Public web access is disabled in AI Settings." };
    const key = process.env.TAVILY_API_KEY; if (!key) return { available: false, reason: "Public web search is not configured." };
    const query = String(args.query || "").slice(0, 400); if (!query) return { available: false, reason: "A search query is required." };
    const response = await fetch("https://api.tavily.com/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: key, query, search_depth: "basic", max_results: 5, include_answer: false }), signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return { available: false, reason: "Public search is temporarily unavailable." };
    const data = await response.json() as { results?: Array<{ title?: string; url?: string; content?: string }> };
    return { available: true, results: (data.results ?? []).slice(0, 5).map((item) => ({ title: String(item.title || "Untitled").slice(0, 200), url: String(item.url || "").slice(0, 500), snippet: String(item.content || "").slice(0, 800) })) };
  }
  if (name !== "private_summary") return { available: false, reason: "Tool unavailable." };
  const selectedModule = args.module as PrivateModule; if (!(selectedModule in labels) || !permissions.modules[selectedModule]) return { blocked: true, reason: `${labels[selectedModule as PrivateModule] || "This module"} access is not enabled in AI Settings.` };
  if (selectedModule === "school") {
    const snapshot = await getSchoolSnapshotForAccount(accountId);
    return {
      available: snapshot.sourceStatus?.canvas !== "error",
      module: selectedModule,
      sourceStatus: snapshot.sourceStatus,
      courses: snapshot.courses.slice(0, 20).map((course) => ({ id: course.id, name: course.name, start: course.start.toISOString(), end: course.end.toISOString(), location: course.location })),
      assignments: snapshot.assignments.slice(0, 50).map((assignment) => ({ id: assignment.id, title: assignment.title, due: assignment.due.toISOString(), status: assignment.completed ? "completed" : "upcoming", priority: assignment.priority })),
      events: snapshot.events.slice(0, 50).map((event) => ({ id: event.id, title: event.title, type: event.type, start: event.start.toISOString(), end: event.end.toISOString(), location: event.location })),
      sourceFacts: (snapshot.sourceIntelligence?.facts ?? []).slice(0, 50).map((fact) => ({ kind: fact.kind, subject: fact.subject, value: fact.value, certainty: fact.certainty, sourceId: fact.provenance[0]?.sourceId, evidence: fact.provenance[0]?.excerpt })),
      sourceEvents: (snapshot.sourceIntelligence?.events ?? []).slice(0, 50).map((event) => ({ id: event.id, title: event.title, startsAt: event.startsAt, location: event.location?.name, attire: event.attire, requiredItems: event.requiredItems, certainty: event.certainty, sourceId: event.provenance[0]?.sourceId, evidence: event.provenance[0]?.excerpt })),
      sourceActionItems: (snapshot.sourceIntelligence?.actionItems ?? []).slice(0, 50).map((item) => ({ id: item.id, title: item.title, dueAt: item.dueAt, status: item.status, sourceId: item.provenance[0]?.sourceId, evidence: item.provenance[0]?.excerpt })),
      planningAssignments: (snapshot.planningAssignments ?? []).slice(0, 50).map((item) => ({ id: item.id, title: item.title, courseName: item.courseName, dueAt: item.dueAt?.toISOString(), status: item.completionStatus, planningStatus: item.planningStatus, priority: item.priority, estimatedMinutes: item.estimatedMinutes, sourceType: item.sourceType })),
      planningRecommendations: (snapshot.planningRecommendations ?? []).slice(0, 10),
      conflicts: (snapshot.conflicts ?? []).slice(0, 20),
    };
  }
  const row = await readCloudSnapshot(accountId, selectedModule); if (!row) return { available: false, module: selectedModule, reason: "No cloud snapshot is available." };
  const validators = { finance: validateFinanceSync, garage: validateGarageSync, notes: validateNotesSync, projects: validateProjectsSync, school: validateSchoolSync } as const;
  if (!validators[selectedModule](row.snapshot)) return { available: false, module: selectedModule, reason: "The stored snapshot failed validation." };
  const snapshot = row.snapshot as unknown as Record<string, unknown>;
  return { available: true, module: selectedModule, freshness: row.updatedAt, counts: Object.fromEntries(Object.keys(snapshot).filter((key) => Array.isArray(snapshot[key])).slice(0, 10).map((key) => [key, count(snapshot[key], key)])) };
}
