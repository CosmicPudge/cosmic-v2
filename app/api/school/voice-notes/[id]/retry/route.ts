import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { processSchoolAudio, regenerateSchoolAudioSummary } from "@/services/school/audioProcessing";
import { getSchoolAudioTranscript } from "@/services/school/audioRepository";
import { assertSameOrigin } from "@/services/security/origin";
import { SCHOOL_AI_ENABLED } from "@/services/school/capabilities";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { try { assertSameOrigin(request); const account = await requireSchoolAccess(request); if (!SCHOOL_AI_ENABLED) return NextResponse.json({ error: "school_ai_unavailable" }, { status: 503 }); const id = (await context.params).id; const existing = await getSchoolAudioTranscript(account.id, id); const job = existing?.organizedContent ? await regenerateSchoolAudioSummary(account.id, id) : await processSchoolAudio(account.id, id); return job ? NextResponse.json({ voiceNote: job }) : NextResponse.json({ error: "Voice note not found." }, { status: 404 }); } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "We couldn't update this summary right now. Your transcript and previous summary are safe." }, { status: 503 }); } }
