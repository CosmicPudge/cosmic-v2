import "server-only";

import { and, desc, eq, ilike, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { supportReportEvents, supportReports, users } from "@/services/database/schema";
import { getDatabase } from "@/services/database/client";
import type { SupportReportStatus } from "@/core/contracts/Support";

export function createPublicReference() { return `COS-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`; }

export async function createSupportReport(input: typeof supportReports.$inferInsert) {
  const database = getDatabase();
  const [report] = await database.insert(supportReports).values(input).returning();
  if (!report) throw new Error("Support report could not be created.");
  await database.insert(supportReportEvents).values({ id: `support_event_${randomUUID()}`, reportId: report.id, actorAccountId: report.accountId, kind: "status", toStatus: "submitted" });
  return report;
}

export async function listUserReports(accountId: string) { return getDatabase().select().from(supportReports).where(eq(supportReports.accountId, accountId)).orderBy(desc(supportReports.updatedAt)).limit(100); }
export async function getUserReport(id: string, accountId: string) { const rows = await getDatabase().select().from(supportReports).where(and(eq(supportReports.id, id), eq(supportReports.accountId, accountId))).limit(1); return rows[0] ?? null; }
export async function listAdminReports(filters: { status?: string; module?: string; severity?: string; q?: string }) {
  const clauses = [];
  if (filters.status) clauses.push(eq(supportReports.status, filters.status));
  if (filters.module) clauses.push(eq(supportReports.module, filters.module));
  if (filters.severity) clauses.push(eq(supportReports.severity, filters.severity));
  if (filters.q) clauses.push(or(ilike(supportReports.title, `%${filters.q}%`), ilike(supportReports.publicReference, `%${filters.q}%`), ilike(users.email, `%${filters.q}%`)));
  return getDatabase().select({ report: supportReports, email: users.email }).from(supportReports).leftJoin(users, eq(users.id, supportReports.accountId)).where(clauses.length ? and(...clauses) : undefined).orderBy(desc(supportReports.updatedAt)).limit(100);
}
export async function getAdminReport(id: string) {
  const database = getDatabase();
  const rows = await database.select({ report: supportReports, email: users.email }).from(supportReports).leftJoin(users, eq(users.id, supportReports.accountId)).where(eq(supportReports.id, id)).limit(1);
  if (!rows[0]) return null;
  const events = await database.select().from(supportReportEvents).where(eq(supportReportEvents.reportId, id)).orderBy(desc(supportReportEvents.createdAt));
  return { ...rows[0], events };
}
export async function updateSupportReport(id: string, actorAccountId: string, status?: SupportReportStatus, userMessage?: string) {
  const database = getDatabase(); const current = await database.select({ status: supportReports.status }).from(supportReports).where(eq(supportReports.id, id)).limit(1); if (!current[0]) return null;
  const now = new Date(); const [report] = await database.update(supportReports).set({ ...(status ? { status, resolvedAt: status === "fixed" || status === "closed" ? now : null } : {}), ...(userMessage !== undefined ? { userVisibleMessage: userMessage || null } : {}), updatedAt: now }).where(eq(supportReports.id, id)).returning();
  if (status && status !== current[0].status) await database.insert(supportReportEvents).values({ id: `support_event_${randomUUID()}`, reportId: id, actorAccountId, kind: "status", fromStatus: current[0].status, toStatus: status, userMessage: userMessage || null });
  return report ?? null;
}
export async function addInternalNote(id: string, actorAccountId: string, note: string) { await getDatabase().insert(supportReportEvents).values({ id: `support_event_${randomUUID()}`, reportId: id, actorAccountId, kind: "note", internalNote: note }); }
