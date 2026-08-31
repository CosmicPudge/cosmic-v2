import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { listSchoolEmailProposals } from "@/services/school/emailRepository";

export async function GET(request: Request) { try { const account = await requireSchoolAccess(request); const status = new URL(request.url).searchParams.get("status") ?? undefined; return NextResponse.json({ proposals: await listSchoolEmailProposals(account.id, status) }, { headers: { "Cache-Control": "no-store" } }); } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "School updates are unavailable." }, { status: 503 }); } }
