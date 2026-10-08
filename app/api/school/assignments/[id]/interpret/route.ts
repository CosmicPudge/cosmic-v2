import { NextResponse } from "next/server";
import { parseSchoolAssignmentInterpretationInput } from "@/core/contracts/SchoolAI";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { SCHOOL_AI_ENABLED } from "@/services/school/capabilities";
import { requireSchoolAccessContext } from "@/services/school/access";
import { getSchoolAssignment } from "@/services/school/assignmentRepository";
import { interpretSchoolAssignment } from "@/services/school/ai/service";
import { assertSameOrigin } from "@/services/security/origin";

type Context = { params: Promise<{ id: string }> };

function assignmentFromInput(id: string, input: NonNullable<ReturnType<typeof parseSchoolAssignmentInterpretationInput>>): SchoolPlanningAssignment {
  const now = new Date();
  const date = (value?: string) => value ? new Date(value) : undefined;
  return {
    id, accountId: "local", title: input.title,
    ...(input.description ? { description: input.description } : {}), ...(input.courseId ? { courseId: input.courseId } : {}), ...(input.courseName ? { courseName: input.courseName } : {}),
    sourceType: input.sourceType ?? "manual",
    ...(date(input.dueAt) ? { dueAt: date(input.dueAt) } : {}), ...(date(input.availableAt) ? { availableAt: date(input.availableAt) } : {}), ...(date(input.lockAt) ? { lockAt: date(input.lockAt) } : {}),
    ...(input.pointsPossible !== undefined ? { pointsPossible: input.pointsPossible } : {}), completionStatus: "upcoming", planningStatus: "not_started", priority: "normal", createdAt: now, updatedAt: now,
  };
}

export async function POST(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const access = await requireSchoolAccessContext(request);
    const assignmentId = (await context.params).id;
    if (!assignmentId || assignmentId.length > 300) return NextResponse.json({ error: "Invalid assignment." }, { status: 400 });
    if (!SCHOOL_AI_ENABLED) return NextResponse.json({ error: "school_ai_disabled" }, { status: 503 });
    const body = await request.json() as { input?: unknown };
    let assignment: SchoolPlanningAssignment | null = null;
    if (access.storageOwner.kind === "legacy-account" && !assignmentId.startsWith("manual:")) {
      assignment = await getSchoolAssignment(access.storageOwner.accountId, assignmentId);
      if (!assignment) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    } else {
      if (!assignmentId.startsWith("manual:")) return NextResponse.json({ error: "Assignment is not available in personal mode." }, { status: 404 });
      const input = parseSchoolAssignmentInterpretationInput(body.input);
      if (!input || input.sourceType !== "manual") return NextResponse.json({ error: "A validated manual assignment input is required." }, { status: 400 });
      assignment = assignmentFromInput(assignmentId, input);
    }
    const result = await interpretSchoolAssignment(assignment);
    if (!result.ok) {
      const status = result.error.code === "DISABLED" || result.error.code === "NOT_CONFIGURED" || result.error.code === "NO_PROVIDER" ? 503 : 502;
      return NextResponse.json({ error: result.error.code, message: result.error.message }, { status });
    }
    return NextResponse.json({ intelligence: result.value, generatedAt: result.value.generatedAt }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Assignment analysis could not be completed. Your assignment is safe." }, { status: 503 });
  }
}
