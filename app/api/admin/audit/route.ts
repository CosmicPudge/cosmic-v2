import { NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin/auth";
import { listAudit } from "@/services/admin/repository";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireAdmin(request); const limit = Number(new URL(request.url).searchParams.get("limit") ?? 50); return NextResponse.json({ events: await listAudit(Number.isFinite(limit) ? limit : 50) }, { headers: { "Cache-Control": "no-store" } }); } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Audit log unavailable." }, { status: 503 }); } }
