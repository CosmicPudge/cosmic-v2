import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { getSchoolFinding, updateSchoolFinding } from "@/services/school/findingRepository";
import { createSchoolNote } from "@/services/school/noteRepository";
import { createSchoolAssignment } from "@/services/school/assignmentRepository";
import { assertSameOrigin } from "@/services/security/origin";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  assertSameOrigin(request);
  const account = await requireSchoolAccess(request); const id = (await context.params).id; const finding = await getSchoolFinding(account.id, id);
  if (!finding) return NextResponse.json({ error: "Finding not found." }, { status: 404 });
  const body = await request.json().catch(() => ({})) as { action?: string; payload?: Record<string, unknown> };
  if (finding.type === "conflict") {
    if (body.action === "approve") body.action = "use_new";
    if (body.action === "dismiss") body.action = "dismiss_new";
    if (body.action !== "use_new" && body.action !== "keep_existing" && body.action !== "dismiss_new") return NextResponse.json({ error: "Unsupported conflict action." }, { status: 400 });
    const conflict = finding.payload as Record<string, unknown>; const incomingId = typeof conflict.incomingFindingId === "string" ? conflict.incomingFindingId : ""; const existingId = typeof conflict.existingFindingId === "string" ? conflict.existingFindingId : "";
    if (body.action === "use_new") { await updateSchoolFinding(account.id, existingId, { reviewState: "superseded" }); await updateSchoolFinding(account.id, incomingId, { reviewState: "approved" }); }
    if (body.action === "keep_existing" || body.action === "dismiss_new") await updateSchoolFinding(account.id, incomingId, { reviewState: "dismissed" });
    return NextResponse.json({ finding: await updateSchoolFinding(account.id, id, { reviewState: body.action, payload: { ...conflict, resolution: body.action } }) });
  }
  if (body.action === "dismiss") return NextResponse.json({ finding: await updateSchoolFinding(account.id, id, { reviewState: "dismissed" }) });
  if (body.action !== "approve" && body.action !== "edit_then_approve") return NextResponse.json({ error: "Unsupported finding action." }, { status: 400 });
  const payload = body.payload ?? finding.payload as Record<string, unknown>;
  if (finding.type === "note") await createSchoolNote({ id: `note:${finding.id}`, userId: account.id, sourceId: finding.sourceId, ...(typeof payload.courseId === "string" ? { courseId: payload.courseId } : {}), title: typeof payload.title === "string" ? payload.title : "School note", content: typeof payload.content === "string" ? payload.content : finding.evidence, topics: Array.isArray(payload.topics) ? payload.topics : [], extractionMethod: "ai", provenance: payload.provenance });
  if (finding.type === "assignment") await createSchoolAssignment({ id: `finding:${finding.id}`, userId: account.id, title: typeof payload.title === "string" ? payload.title : finding.evidence, sourceType: "school-source", sourceId: finding.sourceId, externalId: finding.id, description: typeof payload.description === "string" ? payload.description : undefined, dueAt: typeof payload.dueAt === "string" && !Number.isNaN(Date.parse(payload.dueAt)) ? new Date(payload.dueAt) : undefined, completionStatus: "unknown", planningStatus: "not_started", priority: "normal", provenance: [{ sourceType: "school-source", sourceId: finding.sourceId, externalId: finding.id, evidence: finding.evidence, extractor: "deterministic" }] });
  return NextResponse.json({ finding: await updateSchoolFinding(account.id, id, { reviewState: body.action === "edit_then_approve" ? "edited_then_approved" : "approved", payload }) });
}
