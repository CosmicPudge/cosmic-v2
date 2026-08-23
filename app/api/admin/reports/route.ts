import { NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin/auth";
import { listAdminReports } from "@/services/support/repository";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireAdmin(request); const params = new URL(request.url).searchParams; return NextResponse.json({ reports: await listAdminReports({ status: params.get("status") ?? undefined, module: params.get("module") ?? undefined, severity: params.get("severity") ?? undefined, q: params.get("q") ?? undefined }) }, { headers: { "Cache-Control": "no-store" } }); } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Reports unavailable." }, { status: 503 }); } }
