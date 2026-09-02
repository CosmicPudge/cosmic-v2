import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { createSchoolTranscriptIngestion, type SchoolTranscriptSourceType } from "@/services/school/transcriptIngestion";
import { assertSameOrigin } from "@/services/security/origin";

const sourceTypes = new Set<SchoolTranscriptSourceType>(["apple_voice_memos_transcript", "manual_transcript", "other_transcript"]);
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await requireSchoolAccess(request);
    const body = await request.json() as Record<string, unknown>;
    const sourceType = typeof body.sourceType === "string" && sourceTypes.has(body.sourceType as SchoolTranscriptSourceType) ? body.sourceType as SchoolTranscriptSourceType : "manual_transcript";
    const sourceLabel = typeof body.sourceLabel === "string" ? body.sourceLabel.trim().slice(0, 120) : "Manual transcript";
    const job = await createSchoolTranscriptIngestion({ accountId: account.id, transcript: typeof body.transcript === "string" ? body.transcript : "", title: typeof body.title === "string" ? body.title : undefined, courseId: typeof body.courseId === "string" ? body.courseId : null, sourceType, sourceLabel });
    return NextResponse.json({ voiceNote: job }, { status: 201 });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: error instanceof Error ? error.message : "Transcript could not be imported." }, { status: 422 }); }
}
