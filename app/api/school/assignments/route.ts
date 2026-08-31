import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { createSchoolAssignment, listSchoolAssignments } from "@/services/school/assignmentRepository";
import { schoolAssignmentIdentity } from "@/services/school/planning";
import { assertSameOrigin } from "@/services/security/origin";

export const dynamic = "force-dynamic";

function date(value: unknown) { if (value === undefined || value === null || value === "") return undefined; if (typeof value !== "string") return null; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? null : parsed; }

export async function GET(request: Request) {
  const account = await requireSchoolAccess(request);
  return NextResponse.json({ assignments: await listSchoolAssignments(account.id) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await requireSchoolAccess(request);
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.title !== "string" || !body.title.trim()) return NextResponse.json({ error: "Assignment title is required." }, { status: 400 });
    const dueAt = date(body.dueAt); if (dueAt === null) return NextResponse.json({ error: "Invalid due date." }, { status: 400 });
    const id = typeof body.id === "string" && body.id.trim() ? body.id : crypto.randomUUID();
    const sourceType = body.sourceType === "manual" ? "manual" : null;
    if (!sourceType) return NextResponse.json({ error: "Only manual assignments may be created here." }, { status: 400 });
    const row = await createSchoolAssignment({ id: schoolAssignmentIdentity({ id, sourceType }), userId: account.id, title: body.title.trim().slice(0, 500), ...(typeof body.description === "string" ? { description: body.description.slice(0, 20_000) } : {}), sourceType, ...(dueAt ? { dueAt } : {}), completionStatus: "unknown", planningStatus: "not_started", priority: body.priority === "critical" || body.priority === "high" || body.priority === "low" ? body.priority : "normal", ...(typeof body.estimatedMinutes === "number" && Number.isSafeInteger(body.estimatedMinutes) && body.estimatedMinutes > 0 && body.estimatedMinutes <= 2_000 ? { estimatedMinutes: body.estimatedMinutes } : {}), ...(typeof body.personalNotes === "string" ? { personalNotes: body.personalNotes.slice(0, 10_000) } : {}) });
    return NextResponse.json({ assignment: row }, { status: 201 });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Assignment could not be saved." }, { status: 503 }); }
}
