import "server-only";
import { CanvasCalendarProvider } from "@/components/school/data/providers/CanvasCalendarProvider";
import { getSchoolAccess } from "./access";
import { getProviderCredentials, listProviderConnections } from "@/services/providers/store";
import { buildSchoolSnapshot, type SchoolCanvasCourse, type SchoolSnapshot } from "./domain";
import { emptySchoolSourceIntelligence } from "./domain";
import { listSchoolSources, type SchoolSourceRow } from "./sources/repository";
import { listSchoolAssignments } from "./assignmentRepository";
import { buildSchoolTimeline, detectSchoolTimelineConflicts, rankSchoolAssignments } from "./planning";
import type { SchoolPlanningAssignment, SchoolTimelineEntry } from "@/core/contracts/SchoolPlanning";
import { buildDashboard } from "@/components/school/data/engine/engine";
import type { SchoolDashboardData } from "@/components/school/data/types";
import type { SchoolSourceIntelligence } from "@/core/contracts/SchoolIntelligence";
import { detectSourceConflicts } from "./sources/conflicts";
import { listSchoolNotes } from "./noteRepository";
import { listSchoolFindingsForAccount } from "./findingRepository";
import { requirementCategory, resolveRequirementDate } from "./requirements";
import { applyCoursePlanOverrides, buildCoursePlans } from "./coursePlan";
import { listCoursePlanOverrides } from "./coursePlanOverrideRepository";
import { canonicalCanvasCalendarId, dedupeSchoolAssignments } from "./assignmentIdentity";
import { CanvasAcademicProvider, canvasErrorStatus } from "./providers/canvas/provider";
import { fetchKioskCanvasIcal } from "@/services/kiosk/icalFallback";
import { resolveDeveloperKioskSchoolSources } from "./developerKioskSourceResolution";

const providerAccountId = "canvas-personal-calendar";
async function safeCoursePlanOverrides(accountId: string) { try { return await listCoursePlanOverrides(accountId); } catch { return []; } }

function sourceIntelligence(rows: SchoolSourceRow[]): SchoolSourceIntelligence {
  const combined = emptySchoolSourceIntelligence();
  for (const row of rows) {
    const item = row.intelligence as Partial<SchoolSourceIntelligence> | null;
    if (!item) continue;
    combined.facts.push(...(item.facts ?? []));
    combined.events.push(...(item.events ?? []));
    combined.actionItems.push(...(item.actionItems ?? []));
    combined.conflicts.push(...(item.conflicts ?? []));
    combined.warnings.push(...(item.warnings ?? []));
  }
  combined.conflicts.push(...detectSourceConflicts(combined.events));
  return combined;
}

function withSourceIntelligence(snapshot: SchoolSnapshot, rows: SchoolSourceRow[]): SchoolSnapshot {
  return { ...snapshot, sourceIntelligence: sourceIntelligence(rows) };
}

function withKnowledge(snapshot: SchoolSnapshot, notes: Awaited<ReturnType<typeof listSchoolNotes>>, findings: Awaited<ReturnType<typeof listSchoolFindingsForAccount>>, sources: SchoolSourceRow[], overrides: Awaited<ReturnType<typeof listCoursePlanOverrides>> = []): SchoolSnapshot {
  const normalizedNotes = notes.slice(0, 25).map((note) => ({ id: note.id, ...(note.courseId ? { courseId: note.courseId } : {}), ...(note.sourceId ? { sourceId: note.sourceId } : {}), title: note.title, content: note.content.slice(0, 2_000), topics: Array.isArray(note.topics) ? note.topics.filter((item): item is string => typeof item === "string").slice(0, 20) : [], ...(note.classDate ? { classDate: note.classDate } : {}), createdAt: note.createdAt, updatedAt: note.updatedAt, provenance: note.provenance }));
  const approved = findings.filter((finding) => finding.reviewState === "approved" || finding.reviewState === "edited_then_approved");
  const requirements = approved.filter((finding) => finding.type === "requirement").flatMap((finding) => { const payload = finding.payload as Record<string, unknown>; const value = typeof payload.content === "string" ? payload.content : typeof payload.value === "string" ? payload.value : finding.evidence; const source = sources.find((item) => item.id === finding.sourceId); const relevantDate = source ? resolveRequirementDate(payload, source.createdAt) : undefined; const categoryValue = typeof payload.requirementCategory === "string" ? payload.requirementCategory : payload.kind === "required-item" ? "bring" : payload.kind; return value ? [{ id: finding.id, ...(typeof payload.courseId === "string" ? { courseId: payload.courseId } : {}), category: requirementCategory(categoryValue), value: value.slice(0, 300), sourceId: finding.sourceId, evidence: finding.evidence.slice(0, 500), ...(relevantDate ? { relevantDate } : {}), ...(typeof payload.eventContext === "string" ? { eventContext: payload.eventContext } : {}), recurrence: payload.recurrence === "recurring" ? "recurring" as const : "once" as const }] : []; }).slice(0, 50);
  const importantFacts = approved.filter((finding) => finding.type === "fact" || finding.type === "policy" || finding.type === "important_fact").flatMap((finding) => { const payload = finding.payload as Record<string, unknown>; const subject = typeof payload.subject === "string" ? payload.subject : finding.type; const value = typeof payload.value === "string" ? payload.value : finding.evidence; return [{ id: finding.id, subject, value: value.slice(0, 300), sourceId: finding.sourceId, evidence: finding.evidence.slice(0, 500) }]; }).slice(0, 50);
  const topics = normalizedNotes.flatMap((note) => note.topics.map((value) => ({ value, noteId: note.id, ...(note.courseId ? { courseId: note.courseId } : {}), ...(note.sourceId ? { sourceId: note.sourceId } : {}), createdAt: note.updatedAt }))).slice(0, 50);
  const knowledgeConflicts = findings.filter((finding) => finding.type === "conflict" && finding.reviewState === "pending").flatMap((finding) => { const payload = finding.payload as Record<string, unknown>; return typeof payload.existingFindingId === "string" && typeof payload.incomingFindingId === "string" ? [{ id: finding.id, firstId: payload.existingFindingId, secondId: payload.incomingFindingId, description: finding.evidence }] : []; });
  const plans = buildCoursePlans(findings.map((row) => ({ sourceId: row.sourceId, type: row.type, payload: row.payload, reviewState: row.reviewState })), new Map(sources.map((source) => [source.id, source.courseId])));
  return { ...snapshot, notes: normalizedNotes, topics, requirements, importantFacts, coursePlans: applyCoursePlanOverrides(plans, overrides.map((item) => ({ semanticField: item.semanticField, targetId: item.targetId, value: item.value }))), conflicts: [...(snapshot.conflicts ?? []), ...knowledgeConflicts] };
}

function canvasCourses(connection: Awaited<ReturnType<typeof listProviderConnections>>[number] | null): SchoolCanvasCourse[] {
  const metadata = connection?.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const courses = (metadata as Record<string, unknown>).courses;
  if (!Array.isArray(courses)) return [];
  return courses.flatMap((course) => {
    if (!course || typeof course !== "object") return [];
    const item = course as Record<string, unknown>;
    if (typeof item.id !== "string" || typeof item.name !== "string") return [];
    return [{ id: item.id, name: item.name, ...(typeof item.courseCode === "string" ? { courseCode: item.courseCode } : {}), ...(typeof item.startAt === "string" ? { startAt: item.startAt } : {}), ...(typeof item.endAt === "string" ? { endAt: item.endAt } : {}), ...(typeof item.workflowState === "string" ? { workflowState: item.workflowState } : {}), ...(typeof item.url === "string" ? { url: item.url } : {}) }];
  });
}

function withPlanning(accountId: string, snapshot: SchoolSnapshot, data: SchoolDashboardData, rows: SchoolSourceRow[], stored: SchoolPlanningAssignment[]): SchoolSnapshot {
  const sourceAssignments: SchoolPlanningAssignment[] = rows.flatMap((row) => {
    const intelligence = row.intelligence as Partial<SchoolSourceIntelligence> | null;
    return (intelligence?.actionItems ?? []).flatMap((item) => {
      if (!item.dueAt) return [];
      const dueAt = new Date(item.dueAt); if (Number.isNaN(dueAt.getTime())) return [];
      return [{ id: `school-source:${row.id}:${item.id}`, accountId: row.userId, title: item.title, sourceType: "school-source" as const, sourceId: row.id, externalId: item.id, dueAt, completionStatus: "unknown" as const, planningStatus: "not_started" as const, priority: "normal" as const, provenance: (item.provenance ?? []).map((itemProvenance) => ({ sourceType: "school-source" as const, sourceId: itemProvenance.sourceId, evidence: itemProvenance.excerpt, extractor: itemProvenance.extractor })), createdAt: row.createdAt, updatedAt: row.updatedAt }];
    });
  });
  const canvasAssignments: SchoolPlanningAssignment[] = data.assignments.map((item) => { const event = data.events.find((candidate) => candidate.id === item.id); const completionStatus = item.completionStatus === "completed" ? "completed" as const : "unknown" as const; return { id: `canvas-calendar:${item.id}`, accountId, title: item.title, ...(event?.description ? { description: event.description } : {}), ...(item.course ? { courseName: item.course } : {}), ...(item.sourceUrl ? { canvasUrl: item.sourceUrl } : {}), sourceType: "canvas-calendar" as const, externalId: item.id, dueAt: item.due, completionStatus, planningStatus: "not_started" as const, priority: item.priority === "high" ? "high" as const : "normal" as const, createdAt: snapshot.updatedAt ? new Date(snapshot.updatedAt) : new Date(), updatedAt: new Date(), lastSyncedAt: new Date() }; });
  const assignments = dedupeSchoolAssignments([...stored, ...canvasAssignments, ...sourceAssignments].map((item) => item.sourceType === "canvas-calendar" ? { ...item, id: canonicalCanvasCalendarId(item.id) } : item));
  const entries: SchoolTimelineEntry[] = [
    ...data.classes.map((item) => ({ id: `class:${item.id}`, title: item.name, start: item.start, end: item.end, kind: "class" as const, location: item.location, sourceType: "school" })),
    ...data.events.map((item) => ({ id: `${item.source}:${item.id}`, title: item.title, start: item.start, end: item.end, kind: item.type === "afrotc" ? "afrotc" as const : "event" as const, location: item.location, courseName: item.course, sourceType: item.source })),
    ...assignments.flatMap((item) => item.dueAt ? [{ id: item.id, title: item.title, start: item.dueAt, kind: "deadline" as const, courseName: item.courseName, status: item.completionStatus, sourceType: item.sourceType, sourceId: item.sourceId, provenance: item.provenance }] : []),
  ];
  const timelineEntries = buildSchoolTimeline(entries); const conflicts = detectSchoolTimelineConflicts(timelineEntries);
  return { ...snapshot, planningAssignments: assignments, timelineEntries, planningRecommendations: rankSchoolAssignments(assignments).slice(0, 3), conflicts };
}

export interface SchoolServerData {
  data: SchoolDashboardData;
  snapshot: SchoolSnapshot;
  error?: string;
  errorCategory?: "configuration-error" | "authentication-error" | "provider-error" | "parse-error";
  kioskSource?: "account-provider" | "kiosk-canvas-ical";
  accountProviderSucceeded?: boolean;
  canvasIcalConfigured?: boolean;
  canvasIcalAttempted?: boolean;
  canvasIcalSucceeded?: boolean;
  credentialAvailable?: boolean;
}

/** Server-side School boundary. Consumers receive normalized data only. */
export async function getSchoolDataForAccount(accountId: string): Promise<SchoolServerData> {
  if (!getSchoolAccess({ id: accountId }).enabled) {
    return { data: buildDashboard([]), snapshot: { courses: [], assignments: [], events: [], actionItems: [], facts: [], notes: [], topics: [], requirements: [], importantFacts: [], sources: [], updatedAt: new Date().toISOString(), sourceStatus: { canvas: "not_connected" }, sourceIntelligence: emptySchoolSourceIntelligence() } };
  }

  const sources = await listSchoolSources(accountId);
  const [notes, findings, overrides] = await Promise.all([listSchoolNotes(accountId), listSchoolFindingsForAccount(accountId), safeCoursePlanOverrides(accountId)]);
  let storedAssignments: SchoolPlanningAssignment[] = [];
  try { storedAssignments = await listSchoolAssignments(accountId); } catch { /* The planning table may not exist until migration 0028 is applied. */ }

  const providerConnections = await listProviderConnections(accountId);
  const connection = providerConnections.find((item) => item.provider === "canvas" && item.providerAccountId === providerAccountId);
  const academicConnection = providerConnections.find((item) => item.provider === "canvas" && item.providerType === "rest");
  if (!connection) {
    const empty = buildDashboard([]); const snapshot = withKnowledge(withSourceIntelligence({ courses: [], assignments: [], events: [], actionItems: [], facts: [], notes: [], topics: [], requirements: [], importantFacts: [], sources: [], updatedAt: new Date().toISOString(), sourceStatus: { canvas: "not_connected" } }, sources), notes, findings, sources, overrides);
    return { data: empty, snapshot: { ...withPlanning(accountId, snapshot, empty, sources, storedAssignments), ...(academicConnection ? { canvasCourses: canvasCourses(academicConnection) } : {}) } };
  }

  try {
    const credentials = await getProviderCredentials<{ feedUrl?: unknown }>(accountId, connection.id);
    const feedUrl = typeof credentials?.feedUrl === "string" ? credentials.feedUrl : undefined;
    const result = await new CanvasCalendarProvider(feedUrl).getDashboardDataWithDiagnostics();
    const snapshot = buildSchoolSnapshot(result.data);
    const enriched = withKnowledge(withSourceIntelligence({ ...snapshot, sourceStatus: { canvas: "healthy", lastSyncedAt: connection.lastSuccessfulRefreshAt?.toISOString() ?? null } }, sources), notes, findings, sources, overrides);
    return { data: result.data, snapshot: { ...withPlanning(accountId, enriched, result.data, sources, storedAssignments), ...(academicConnection ? { canvasCourses: canvasCourses(academicConnection) } : {}) } };
  } catch {
    const empty = buildDashboard([]); const snapshot = withKnowledge(withSourceIntelligence({ courses: [], assignments: [], events: [], actionItems: [], facts: [], notes: [], topics: [], requirements: [], importantFacts: [], sources: [], updatedAt: new Date().toISOString(), sourceStatus: { canvas: "error", lastSyncedAt: connection.lastSuccessfulRefreshAt?.toISOString() ?? null } }, sources), notes, findings, sources, overrides);
    return { data: empty, snapshot: { ...withPlanning(accountId, snapshot, empty, sources, storedAssignments), ...(academicConnection ? { canvasCourses: canvasCourses(academicConnection) } : {}) }, error: "Canvas data is temporarily unavailable." };
  }
}

export async function getSchoolSnapshotForAccount(accountId: string): Promise<SchoolSnapshot> {
  return (await getSchoolDataForAccount(accountId)).snapshot;
}

/**
 * The dedicated developer kiosk may read the existing encrypted Canvas REST
 * connection live when the legacy calendar-feed path has no data. This is a
 * read-only kiosk boundary; normal School consumers keep their current path.
 */
export async function getDeveloperKioskSchoolData(accountId: string): Promise<SchoolServerData> {
  const feedUrl = process.env.COSMIC_KIOSK_CANVAS_ICAL_URL?.trim();
  let providerResult: SchoolServerData | undefined;
  let credentialAvailable = false;
  const resolution = await resolveDeveloperKioskSchoolSources({
    canvasIcalConfigured: Boolean(feedUrl),
    accountProvider: async () => {
      let existing: SchoolServerData;
      try { existing = await getSchoolDataForAccount(accountId); }
      catch { existing = { data: buildDashboard([]), snapshot: { courses: [], assignments: [], events: [], actionItems: [], facts: [], notes: [], topics: [], requirements: [], importantFacts: [], sources: [], updatedAt: new Date().toISOString(), sourceStatus: { canvas: "error" }, sourceIntelligence: emptySchoolSourceIntelligence() }, error: "Canvas data is temporarily unavailable.", errorCategory: "provider-error" }; }
      providerResult = existing.error && !existing.errorCategory ? { ...existing, errorCategory: "provider-error" } : existing;
      const connection = (await listProviderConnections(accountId)).find((item) => item.provider === "canvas" && item.providerType === "rest" && item.status === "connected" && !item.reconnectRequired);
      if (existing.snapshot.sourceStatus?.canvas === "healthy" && !existing.error) return { ...existing, kioskSource: "account-provider", credentialAvailable: true };
      if (!connection) return providerResult;
      try {
        const credentials = await getProviderCredentials<{ baseUrl?: unknown; token?: unknown }>(accountId, connection.id);
        if (typeof credentials?.baseUrl !== "string" || typeof credentials.token !== "string") return providerResult = { ...providerResult, error: "Canvas credentials are unavailable.", errorCategory: "configuration-error" };
        credentialAvailable = true;
        const result = await new CanvasAcademicProvider(credentials.baseUrl, credentials.token).sync(accountId);
        return providerResult = { ...existing, kioskSource: "account-provider", credentialAvailable: true, snapshot: { ...existing.snapshot, planningAssignments: [...(existing.snapshot.planningAssignments ?? []), ...result.assignments], canvasCourses: result.courses.map(({ startAt, endAt, ...course }) => ({ ...course, ...(startAt ? { startAt: startAt.toISOString() } : {}), ...(endAt ? { endAt: endAt.toISOString() } : {}) })), sourceStatus: { canvas: "healthy", lastSyncedAt: connection.lastSuccessfulRefreshAt?.toISOString() ?? null } } };
      } catch (error) {
        const status = canvasErrorStatus(error);
        return providerResult = { ...providerResult, error: "Canvas data is temporarily unavailable.", errorCategory: status === "invalid_token" || status === "forbidden" ? "authentication-error" : "provider-error" };
      }
    },
    accountProviderUsable: (value) => value.snapshot.sourceStatus?.canvas === "healthy" && !value.error,
    canvasIcalProvider: async () => {
      if (!feedUrl) throw new Error("Canvas iCal is not configured.");
      const fallback = await fetchKioskCanvasIcal(feedUrl);
      if (fallback.parsedEvents === 0) throw new SyntaxError("Canvas calendar feed contained no events.");
      const base = providerResult ?? { data: buildDashboard([]), snapshot: { courses: [], assignments: [], events: [], actionItems: [], facts: [], notes: [], topics: [], requirements: [], importantFacts: [], sources: [], updatedAt: new Date().toISOString(), sourceStatus: { canvas: "error" }, sourceIntelligence: emptySchoolSourceIntelligence() } };
      return { ...base, data: fallback.data, snapshot: withPlanning(accountId, { ...base.snapshot, sourceStatus: { canvas: "healthy", lastSyncedAt: new Date().toISOString() } }, fallback.data, [], []), error: undefined, errorCategory: undefined, kioskSource: "kiosk-canvas-ical", credentialAvailable };
    },
  });
  const value = resolution.value ?? providerResult ?? { data: buildDashboard([]), snapshot: { courses: [], assignments: [], events: [], actionItems: [], facts: [], notes: [], topics: [], requirements: [], importantFacts: [], sources: [], updatedAt: new Date().toISOString(), sourceStatus: { canvas: "error" }, sourceIntelligence: emptySchoolSourceIntelligence() }, error: "Canvas data is temporarily unavailable.", errorCategory: "provider-error" };
  return { ...value, kioskSource: resolution.source, accountProviderSucceeded: resolution.accountProviderSucceeded, canvasIcalConfigured: resolution.canvasIcalConfigured, canvasIcalAttempted: resolution.canvasIcalAttempted, canvasIcalSucceeded: resolution.canvasIcalSucceeded, credentialAvailable: value.credentialAvailable ?? credentialAvailable };
}
