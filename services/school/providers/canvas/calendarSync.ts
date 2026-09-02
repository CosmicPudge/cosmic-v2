import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { schoolCanvasCalendarEvents } from "@/services/database/schema";
import { fetchCanvasCalendarEvents } from "@/components/school/data/providers/CanvasCalendarProvider";
import type { ParsedCanvasCalendar } from "@/components/school/data/parser";
import { getSchoolAssignment, updateSchoolAssignment, upsertCanvasAssignments } from "@/services/school/assignmentRepository";
import { canonicalCanvasCalendarId } from "@/services/school/assignmentIdentity";

export interface CanvasCalendarSyncResult { eventsSeen: number; created: number; updated: number; unchanged: number; reconciled: number; unmatched: number; missing: number; errors: number; }
export function canvasCalendarIdentity(sourceId: string, event: ParsedCanvasCalendar["events"][number]) { const uid = event.sourceMetadata?.uid ?? event.id; return `canvas-calendar:${sourceId}:${uid}${event.sourceMetadata?.recurrenceId ? `:${event.sourceMetadata.recurrenceId}` : ""}`; }

export async function persistCanvasCalendarEvents(accountId: string, sourceId: string, parsed: ParsedCanvasCalendar): Promise<CanvasCalendarSyncResult> {
  const db = getDatabase(); const existing = await db.select().from(schoolCanvasCalendarEvents).where(and(eq(schoolCanvasCalendarEvents.userId, accountId), eq(schoolCanvasCalendarEvents.sourceId, sourceId))); const byId = new Map(existing.map((row) => [row.id, row])); const now = new Date(); let created = 0; let updated = 0; let unchanged = 0; let reconciled = 0; let unmatched = 0;
  for (const event of parsed.events) {
    const id = canvasCalendarIdentity(sourceId, event); const old = byId.get(id); const linkedAssignmentId = event.type === "assignment" || event.type === "quiz" || event.type === "module" || event.type === "discussion" ? canonicalCanvasCalendarId(event.id) : null; if (!event.courseId) unmatched += 1;
    const values = { id, userId: accountId, sourceId, uid: event.sourceMetadata?.uid ?? event.id, ...(event.sourceMetadata?.recurrenceId ? { recurrenceId: event.sourceMetadata.recurrenceId } : {}), title: event.title, ...(event.description ? { description: event.description } : {}), ...(event.location ? { location: event.location } : {}), ...(event.sourceMetadata?.url ? { url: event.sourceMetadata.url } : {}), eventType: event.type, ...(event.courseId ? { courseId: event.courseId, courseMatchReason: "canvas_course_id" } : {}), startAt: event.start, endAt: event.end, ...(event.sourceMetadata?.status ? { status: event.sourceMetadata.status } : {}), ...(event.sourceMetadata?.sequence !== undefined ? { sequence: event.sourceMetadata.sequence } : {}), ...(event.sourceMetadata?.lastModified ? { lastModified: event.sourceMetadata.lastModified } : {}), ...(event.sourceMetadata?.dtstamp ? { dtstamp: event.sourceMetadata.dtstamp } : {}), lastSeenAt: now, presence: "present" as const, ...(linkedAssignmentId ? { linkedAssignmentId } : {}) };
    if (linkedAssignmentId) {
      const canvasId = event.sourceMetadata?.url?.match(/\/courses\/(\d+)\/assignments\/(\d+)/i);
      const canonicalId = canvasId ? `canvas-api:${canvasId[1]}:${canvasId[2]}` : linkedAssignmentId;
      const existingAssignment = canvasId ? await getSchoolAssignment(accountId, canonicalId) : null;
      if (existingAssignment) await updateSchoolAssignment(accountId, canonicalId, { title: event.title, ...(event.description ? { description: event.description } : {}), ...(event.courseId ? { courseId: event.courseId } : {}), dueAt: event.allDay ? event.start : event.end, ...(event.sourceMetadata?.url ? { canvasUrl: event.sourceMetadata.url } : {}), lastSyncedAt: now });
      else await upsertCanvasAssignments([{ id: canonicalId, userId: accountId, title: event.title, ...(event.courseId ? { courseId: event.courseId } : {}), sourceType: canvasId ? "canvas-api" as const : "canvas-calendar" as const, sourceId: canvasId?.[1] ?? sourceId, externalId: canvasId?.[2] ?? event.id, ...(event.description ? { description: event.description } : {}), dueAt: event.allDay ? event.start : event.end, completionStatus: "unknown", planningStatus: "not_started", priority: "normal", ...(event.sourceMetadata?.url ? { canvasUrl: event.sourceMetadata.url } : {}), lastSyncedAt: now }]);
      if (canvasId) reconciled += 1;
    }
    if (!old) { await db.insert(schoolCanvasCalendarEvents).values(values); created += 1; continue; }
    const changed = old.title !== values.title || old.description !== (values.description ?? null) || old.startAt?.getTime() !== values.startAt?.getTime() || old.endAt?.getTime() !== values.endAt?.getTime() || old.eventType !== values.eventType || old.courseId !== (values.courseId ?? null) || old.presence !== "present";
    if (!changed) { unchanged += 1; continue; }
    await db.update(schoolCanvasCalendarEvents).set({ ...values, updatedAt: now }).where(and(eq(schoolCanvasCalendarEvents.userId, accountId), eq(schoolCanvasCalendarEvents.id, id))); updated += 1;
    if (old.linkedAssignmentId && linkedAssignmentId) reconciled += 1;
  }
  const seen = parsed.events.map((event) => canvasCalendarIdentity(sourceId, event)); const missingRows = existing.filter((row) => !seen.includes(row.id) && row.presence === "present"); if (missingRows.length) await db.update(schoolCanvasCalendarEvents).set({ presence: "missing", updatedAt: now }).where(and(eq(schoolCanvasCalendarEvents.userId, accountId), eq(schoolCanvasCalendarEvents.sourceId, sourceId), inArray(schoolCanvasCalendarEvents.id, missingRows.map((row) => row.id))));
  return { eventsSeen: parsed.diagnostics.totalIcsEvents, created, updated, unchanged, reconciled, unmatched, missing: missingRows.length, errors: parsed.diagnostics.totalIcsEvents - parsed.diagnostics.parsedEvents };
}

export async function syncCanvasCalendarForAccount(accountId: string, sourceId: string, feedUrl: string): Promise<CanvasCalendarSyncResult> {
  const parsed = await fetchCanvasCalendarEvents(feedUrl); return persistCanvasCalendarEvents(accountId, sourceId, parsed);
}
