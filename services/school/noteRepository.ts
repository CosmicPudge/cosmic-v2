import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { schoolNotes } from "@/services/database/schema";
import { prepareSchoolOwnerWrite } from "./ownershipTransition";

export async function listSchoolNotes(accountId: string) { return getDatabase().select().from(schoolNotes).where(eq(schoolNotes.userId, accountId)).orderBy(desc(schoolNotes.updatedAt)); }
export async function listSchoolNotesForCourse(accountId: string, courseId: string) { return getDatabase().select().from(schoolNotes).where(and(eq(schoolNotes.userId, accountId), eq(schoolNotes.courseId, courseId))).orderBy(desc(schoolNotes.updatedAt)); }
export async function createSchoolNote(input: typeof schoolNotes.$inferInsert) { const values = await prepareSchoolOwnerWrite(input, input.userId); return (await getDatabase().insert(schoolNotes).values(values).returning())[0] ?? null; }
export async function getSchoolNote(accountId: string, id: string) { return (await getDatabase().select().from(schoolNotes).where(and(eq(schoolNotes.userId, accountId), eq(schoolNotes.id, id))).limit(1))[0] ?? null; }
export async function updateSchoolNote(accountId: string, id: string, input: Partial<typeof schoolNotes.$inferInsert>) { const values = await prepareSchoolOwnerWrite(input, accountId); return (await getDatabase().update(schoolNotes).set({ ...values, updatedAt: new Date() }).where(and(eq(schoolNotes.userId, accountId), eq(schoolNotes.id, id))).returning())[0] ?? null; }
export async function deleteSchoolNote(accountId: string, id: string) { return (await getDatabase().delete(schoolNotes).where(and(eq(schoolNotes.userId, accountId), eq(schoolNotes.id, id))).returning({ id: schoolNotes.id }))[0] ?? null; }
