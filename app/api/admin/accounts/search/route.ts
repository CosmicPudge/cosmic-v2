import { NextResponse } from "next/server";
import { requireAdmin } from "@/services/admin/auth";
import { searchAccounts } from "@/services/admin/repository";

export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireAdmin(request); const query = new URL(request.url).searchParams.get("q") ?? ""; if (query.trim().length < 2) return NextResponse.json({ accounts: [] }, { headers: { "Cache-Control": "no-store" } }); const accounts = await searchAccounts(query); return NextResponse.json({ accounts }, { headers: { "Cache-Control": "no-store" } }); } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Account search unavailable." }, { status: 503 }); } }
