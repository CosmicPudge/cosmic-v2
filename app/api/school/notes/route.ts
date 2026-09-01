import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { createSchoolNote, listSchoolNotes } from "@/services/school/noteRepository";
import { assertSameOrigin } from "@/services/security/origin";

export const dynamic = "force-dynamic";

function topics(value: unknown) { return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim().slice(0, 120)))].slice(0, 30) : []; }
export async function GET(request: Request) { const account = await requireSchoolAccess(request); return NextResponse.json({ notes: await listSchoolNotes(account.id) }, { headers: { "Cache-Control": "no-store" } }); }
export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const account = await requireSchoolAccess(request); const body = await request.json() as Record<string, unknown>;
    if (typeof body.title !== "string" || !body.title.trim() || typeof body.content !== "string" || !body.content.trim()) return NextResponse.json({ error: "Title and content are required." }, { status: 400 });
    const classDate = typeof body.classDate === "string" && !Number.isNaN(Date.parse(body.classDate)) ? new Date(body.classDate) : undefined;
    const row = await createSchoolNote({ id: crypto.randomUUID(), userId: account.id, title: body.title.trim().slice(0, 500), content: body.content.trim().slice(0, 50_000), ...(typeof body.courseId === "string" && body.courseId ? { courseId: body.courseId } : {}), ...(classDate ? { classDate } : {}), topics: topics(body.topics), extractionMethod: "manual", provenance: { type: "manual", createdAt: new Date().toISOString() } });
    return NextResponse.json({ note: row }, { status: 201 });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Note could not be saved." }, { status: 503 }); }
}
