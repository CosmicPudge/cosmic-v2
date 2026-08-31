import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { assertSameOrigin } from "@/services/security/origin";
import { classifySchoolEmail, extractSchoolEmailProposals, normalizeSchoolEmail, schoolEmailSourceId } from "@/services/school/email";
import { createSchoolEmailSource, upsertSchoolEmailProposal } from "@/services/school/emailRepository";
import { getSchoolSnapshotForAccount } from "@/services/school/server";
import { normalizeManualEmail, MAX_MANUAL_EMAIL_BODY, type ManualEmailInput } from "@/services/school/manualEmail";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const account = await requireSchoolAccess(request); const input = await request.json() as Partial<ManualEmailInput>; if (typeof input.body !== "string" || input.body.length > MAX_MANUAL_EMAIL_BODY) return NextResponse.json({ error: "Email body must be 50,000 characters or less." }, { status: 413 });
    const message = normalizeManualEmail({ importId: typeof input.importId === "string" ? input.importId : "", sender: typeof input.sender === "string" ? input.sender : "", subject: typeof input.subject === "string" ? input.subject : "", receivedAt: typeof input.receivedAt === "string" ? input.receivedAt : "", body: input.body, ...(typeof input.to === "string" ? { to: input.to } : {}), ...(typeof input.cc === "string" ? { cc: input.cc } : {}) }, account.id); const normalized = normalizeSchoolEmail(message, message.id, account.id); const snapshot = await getSchoolSnapshotForAccount(account.id); const classification = classifySchoolEmail(normalized, [...snapshot.courses.map((course) => course.name), ...(snapshot.canvasCourses ?? []).map((course) => course.name)]);
    if (classification.relevance === "not_relevant") return NextResponse.json({ relevant: false, proposals: [], message: "No actionable School information was detected." }, { headers: { "Cache-Control": "no-store" } });
    const sourceId = schoolEmailSourceId(normalized); await createSchoolEmailSource({ id: sourceId, userId: account.id, title: normalized.subject, sourceType: "email", category: "school-email", sourceDate: normalized.receivedAt, notes: `Imported Email · ${normalized.senderAddress}`, processingStatus: "ready", processingVersion: 1 }); const extracted = extractSchoolEmailProposals(normalized, classification.relevance); const saved = []; for (const proposal of extracted) { const item = await upsertSchoolEmailProposal({ id: proposal.id, userId: account.id, sourceId, provider: "manual", connectionId: message.id, messageId: message.id, type: proposal.type, title: proposal.title, description: proposal.description, evidence: proposal.evidence, confidence: proposal.confidence }); if (item) saved.push(item); }
    return NextResponse.json({ relevant: true, proposals: saved, message: saved.length ? "School update queued for review." : "No actionable School information was detected." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: error instanceof Error ? error.message : "School email import is unavailable." }, { status: 400 }); }
}
