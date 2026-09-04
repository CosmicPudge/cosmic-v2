import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { deleteSchoolNote, getSchoolNote, updateSchoolNote } from "@/services/school/noteRepository";
import { assertSameOrigin } from "@/services/security/origin";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const account = await requireSchoolAccess(request);
    const id = (await context.params).id;
    if (!(await getSchoolNote(account.id, id))) return NextResponse.json({ error: "Note not found." }, { status: 404 });
    const deleted = await deleteSchoolNote(account.id, id);
    return deleted ? NextResponse.json({ deleted: true, id: deleted.id }) : NextResponse.json({ deleted: true, id });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Note could not be deleted." }, { status: 503 });
  }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) { const account = await requireSchoolAccess(request); const note = await getSchoolNote(account.id, (await context.params).id); return note ? NextResponse.json({ note }) : NextResponse.json({ error: "Note not found." }, { status: 404 }); }
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) { try { assertSameOrigin(request); const account = await requireSchoolAccess(request); const body = await request.json() as Record<string, unknown>; const id = (await context.params).id; const input: Record<string, unknown> = {}; if (typeof body.title === "string" && body.title.trim()) input.title = body.title.trim().slice(0, 500); if (typeof body.content === "string" && body.content.trim()) input.content = body.content.trim().slice(0, 50_000); if (Array.isArray(body.topics)) input.topics = body.topics.filter((item): item is string => typeof item === "string").slice(0, 30); if ("courseId" in body) input.courseId = typeof body.courseId === "string" && body.courseId.trim() ? body.courseId.trim() : null; if ("classDate" in body) input.classDate = typeof body.classDate === "string" && !Number.isNaN(Date.parse(body.classDate)) ? new Date(body.classDate) : null; const note = await updateSchoolNote(account.id, id, input as Parameters<typeof updateSchoolNote>[2]); return note ? NextResponse.json({ note }) : NextResponse.json({ error: "Note not found." }, { status: 404 }); } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Note could not be updated." }, { status: 503 }); } }
