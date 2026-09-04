import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { deleteSchoolAssignment, getSchoolAssignment, updateSchoolAssignment } from "@/services/school/assignmentRepository";
import { assertSameOrigin } from "@/services/security/origin";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await requireSchoolAccess(request); const assignment = await getSchoolAssignment(account.id, (await context.params).id);
  return assignment ? NextResponse.json({ assignment }, { headers: { "Cache-Control": "no-store" } }) : NextResponse.json({ error: "Assignment not found." }, { status: 404 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request); const account = await requireSchoolAccess(request); const id = (await context.params).id; const body = await request.json() as Record<string, unknown>;
    const dueAt = body.dueAt === undefined ? undefined : body.dueAt === null || body.dueAt === "" ? null : typeof body.dueAt === "string" && !Number.isNaN(new Date(body.dueAt).getTime()) ? new Date(body.dueAt) : false;
    if (dueAt === false) return NextResponse.json({ error: "Invalid due date." }, { status: 400 });
    const existing = await getSchoolAssignment(account.id, id);
    if (!existing) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    const estimatedMinutes = body.estimatedMinutes === undefined || body.estimatedMinutes === null || body.estimatedMinutes === "" ? null : typeof body.estimatedMinutes === "number" && Number.isSafeInteger(body.estimatedMinutes) && body.estimatedMinutes > 0 && body.estimatedMinutes <= 2_000 ? body.estimatedMinutes : false;
    if (estimatedMinutes === false) return NextResponse.json({ error: "Estimated time must be a whole number of minutes from 1 to 2,000." }, { status: 400 });
    const planningOnly = existing.sourceType !== "manual";
    const updated = await updateSchoolAssignment(account.id, id, { ...(!planningOnly && dueAt !== undefined ? { dueAt } : {}), ...(!planningOnly && typeof body.title === "string" && body.title.trim() ? { title: body.title.trim().slice(0, 500) } : {}), ...(body.priority === "critical" || body.priority === "high" || body.priority === "normal" || body.priority === "low" ? { priority: body.priority } : {}), ...(body.planningStatus === "not_started" || body.planningStatus === "planned" || body.planningStatus === "in_progress" || body.planningStatus === "done" ? { planningStatus: body.planningStatus } : {}), ...(estimatedMinutes !== undefined ? { estimatedMinutes } : {}), ...(typeof body.personalNotes === "string" ? { personalNotes: body.personalNotes.slice(0, 10_000) } : {}) });
    return NextResponse.json({ assignment: updated });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Assignment could not be updated." }, { status: 503 }); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request); const account = await requireSchoolAccess(request); const deleted = await deleteSchoolAssignment(account.id, (await context.params).id);
    return deleted ? new Response(null, { status: 204 }) : NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Assignment could not be deleted." }, { status: 503 }); }
}
