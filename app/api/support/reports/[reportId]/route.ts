import { NextResponse } from "next/server";
import { requireCosmicAccount } from "@/services/auth/server";
import { getUserReport } from "@/services/support/repository";
export async function GET(request: Request, context: { params: Promise<{ reportId: string }> }) { try { const account = await requireCosmicAccount(request); const { reportId } = await context.params; const report = await getUserReport(reportId, account.id); if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 }); return NextResponse.json({ report }, { headers: { "Cache-Control": "no-store" } }); } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Report unavailable." }, { status: 503 }); } }
