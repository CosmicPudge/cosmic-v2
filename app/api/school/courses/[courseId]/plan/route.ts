import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { getSchoolCoursePlan } from "@/services/school/coursePlanRepository";
import { getSchoolSnapshotForAccount } from "@/services/school/server";
import { listCoursePlanOverrides, removeCoursePlanOverride, upsertCoursePlanOverride } from "@/services/school/coursePlanOverrideRepository";
import { assertSameOrigin } from "@/services/security/origin";

const supportedFields = new Set(["instructor", "meeting_schedule", "office_hours", "grading", "grade_scale", "textbooks", "materials", "policies", "exams", "major_assignments", "weekly_schedule", "recurring_expectation"]);

export async function GET(request: Request, context: { params: Promise<{ courseId: string }> }) {
  const account = await requireSchoolAccess(request); const plan = await getSchoolCoursePlan(account.id, (await context.params).courseId);
  return plan ? NextResponse.json({ plan }, { headers: { "Cache-Control": "no-store" } }) : NextResponse.json({ error: "Course plan not found." }, { status: 404 });
}

export async function PATCH(request: Request, context: { params: Promise<{ courseId: string }> }) {
  assertSameOrigin(request);
  const account = await requireSchoolAccess(request); const courseId = (await context.params).courseId;
  const snapshot = await getSchoolSnapshotForAccount(account.id);
  if (!snapshot.courses.some((course) => course.id === courseId)) return NextResponse.json({ error: "Course not found." }, { status: 404 });
  const body = await request.json().catch(() => ({})) as { semanticField?: string; targetId?: string; value?: unknown; note?: string; action?: string };
  const semanticField = typeof body.semanticField === "string" ? body.semanticField : ""; const targetId = typeof body.targetId === "string" && body.targetId ? body.targetId : "primary";
  if (!supportedFields.has(semanticField)) return NextResponse.json({ error: "Unsupported CoursePlan field." }, { status: 400 });
  if (body.action === "reset") { await removeCoursePlanOverride(account.id, courseId, semanticField, targetId); return NextResponse.json({ overrides: await listCoursePlanOverrides(account.id, courseId) }); }
  if (body.value === undefined || body.value === null) return NextResponse.json({ error: "A bounded field value is required." }, { status: 400 });
  if (JSON.stringify(body.value).length > 12_000) return NextResponse.json({ error: "CoursePlan correction is too large." }, { status: 400 });
  const override = await upsertCoursePlanOverride({ id: `course-plan-override:${account.id}:${courseId}:${semanticField}:${targetId}`, accountId: account.id, courseId, semanticField, targetId, value: body.value, ...(typeof body.note === "string" ? { note: body.note.slice(0, 500) } : {}) });
  return NextResponse.json({ override });
}
