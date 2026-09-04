import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { createSchoolTranscriptIngestion } from "@/services/school/transcriptIngestion";
import type { SchoolTranscriptSourceType } from "@/services/school/sourceTypes";
import { assertSameOrigin } from "@/services/security/origin";
import { SCHOOL_AI_ENABLED } from "@/services/school/capabilities";

const sourceTypes = new Set<SchoolTranscriptSourceType>(["apple_voice_memos_transcript", "manual_transcript", "other_transcript"]);
async function stableImportKey(body: Record<string, unknown>) { const value = [body.sourceType, body.sourceLabel, body.title, body.courseId, body.transcript].map((item) => typeof item === "string" ? item : "").join("\u001f"); const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return [...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, "0")).join(""); }
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await requireSchoolAccess(request);
    if (!SCHOOL_AI_ENABLED) return NextResponse.json({ error: "school_ai_unavailable" }, { status: 503 });
    const body = await request.json() as Record<string, unknown>;
    const sourceType = typeof body.sourceType === "string" && sourceTypes.has(body.sourceType as SchoolTranscriptSourceType) ? body.sourceType as SchoolTranscriptSourceType : "manual_transcript";
    const idempotencyKey = typeof body.idempotencyKey === "string" && /^[0-9a-f-]{16,100}$/i.test(body.idempotencyKey) ? body.idempotencyKey : await stableImportKey(body);
    const sourceLabel = typeof body.sourceLabel === "string" ? body.sourceLabel.trim().slice(0, 120) : "Manual transcript";
    const job = await createSchoolTranscriptIngestion({ accountId: account.id, idempotencyKey, transcript: typeof body.transcript === "string" ? body.transcript : "", title: typeof body.title === "string" ? body.title : undefined, courseId: typeof body.courseId === "string" ? body.courseId : null, sourceType, sourceLabel });
    return NextResponse.json({ voiceNote: job }, { status: 201 });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: error instanceof Error ? error.message : "Transcript could not be imported." }, { status: 422 }); }
}
