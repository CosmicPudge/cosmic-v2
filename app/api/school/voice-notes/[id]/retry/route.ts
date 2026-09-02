import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { processSchoolAudio } from "@/services/school/audioProcessing";
import { assertSameOrigin } from "@/services/security/origin";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { try { assertSameOrigin(request); const account = await requireSchoolAccess(request); const job = await processSchoolAudio(account.id, (await context.params).id); return job ? NextResponse.json({ voiceNote: job }) : NextResponse.json({ error: "Voice note not found." }, { status: 404 }); } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Recording could not be retried." }, { status: 503 }); } }
